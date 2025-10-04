import httpx
import imghdr
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_DOMAINS = [
    "culture.seoul.go.kr",
    "data.seoul.go.kr", 
    "www.seoul.go.kr",
    "*.seoul.go.kr"
]

def is_allowed_domain(url: str) -> bool:
    """Check if the image URL domain is allowed"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.hostname
        
        if not domain:
            return False
            
        # Check exact matches and wildcard matches
        for allowed in ALLOWED_DOMAINS:
            if allowed.startswith("*."):
                # Wildcard domain check
                allowed_suffix = allowed[2:]  # Remove "*."
                if domain.endswith(allowed_suffix):
                    return True
            elif domain == allowed:
                return True
                
        return False
    except Exception:
        return False

@router.get("/proxy")
async def proxy_image(
    url: str = Query(..., description="Original image URL to proxy"),
    timeout: Optional[int] = Query(10, description="Request timeout in seconds")
):
    """
    Proxy external images to avoid CORS and connection issues.
    Only allows images from trusted Seoul government domains.
    """
    
    # Validate the URL domain
    if not is_allowed_domain(url):
        logger.warning(f"Blocked proxy request for disallowed domain: {url}")
        raise HTTPException(
            status_code=403, 
            detail="Image domain not allowed"
        )
    
    try:
        # Set headers to mimic a browser request
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://culture.seoul.go.kr/",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            logger.info(f"Proxying image request: {url}")
            response = await client.get(url, headers=headers, follow_redirects=True)
            
            if response.status_code == 200:
                raw_content = response.content
                content_type = response.headers.get("content-type", "").lower()

                if not content_type.startswith("image/"):
                    detected_format = imghdr.what(None, raw_content)
                    if detected_format:
                        content_type = f"image/{detected_format}"
                        logger.debug(
                            "Adjusted content-type for proxied image", 
                            extra={"url": url, "detected_format": detected_format}
                        )
                    else:
                        logger.warning(
                            "Non-image content returned from proxy source",
                            extra={"url": url, "content_type": content_type or "<missing>"}
                        )
                        raise HTTPException(
                            status_code=400,
                            detail="URL does not return image content"
                        )

                headers_to_forward = {
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                }
                content_length = response.headers.get("content-length")
                if content_length is not None:
                    headers_to_forward["Content-Length"] = content_length

                return StreamingResponse(
                    iter([raw_content]),
                    media_type=content_type or "image/jpeg",
                    headers=headers_to_forward,
                )
            else:
                logger.error(f"Failed to fetch image: {url} - Status: {response.status_code}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to fetch image: HTTP {response.status_code}"
                )
                
    except httpx.TimeoutException:
        logger.error(f"Timeout while fetching image: {url}")
        raise HTTPException(
            status_code=408,
            detail="Timeout while fetching image"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error while fetching image {url}: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"Error fetching image: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error while proxying image {url}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing image"
        )
