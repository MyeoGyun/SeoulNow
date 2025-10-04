"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image, { type ImageProps } from "next/image";

const PLACEHOLDER_SRC = "/images/placeholder.jpg";

type ProxyImageProps = ImageProps & {
  fallbackSrc?: string;
  disableProxy?: boolean;
};

const buildProxyUrl = (originalUrl: string): string | null => {
  const explicitBase = process.env.NEXT_PUBLIC_IMAGE_PROXY_BASE_URL;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const preferredBase = explicitBase ?? apiBase ?? "";

  const trimmed = preferredBase.replace(/\/$/, "");
  const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

  let proxyBase: string;

  if (trimmed.length === 0) {
    proxyBase = "/api";
  } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    proxyBase = /\/api(\/|$)/.test(trimmed) ? trimmed : `${trimmed}/api`;
  } else {
    const normalized = ensureLeadingSlash(trimmed);
    proxyBase = /\/api(\/|$)/.test(normalized) ? normalized : `${normalized}/api`;
  }

  const encoded = encodeURIComponent(originalUrl);
  return `${proxyBase}/images/proxy?url=${encoded}`;
};

export function ProxyImage({
  src,
  fallbackSrc = PLACEHOLDER_SRC,
  disableProxy = false,
  onError,
  alt,
  ...imageProps
}: ProxyImageProps) {
  const candidates = useMemo(() => {
    const urls: Array<ImageProps["src"]> = [];

    if (typeof src === "string") {
      if (!disableProxy) {
        const proxyUrl = buildProxyUrl(src);
        if (proxyUrl) {
          urls.push(proxyUrl as ImageProps["src"]);
        }
      }
      urls.push(src);
    } else if (src) {
      urls.push(src);
    }

    if (fallbackSrc) {
      urls.push(fallbackSrc as ImageProps["src"]);
    }

    return urls.length > 0 ? urls : [fallbackSrc as ImageProps["src"]];
  }, [src, fallbackSrc, disableProxy]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [candidates]);

  const handleError = useCallback<NonNullable<ImageProps["onError"]>>(
    (event) => {
      if (currentIndex < candidates.length - 1) {
        setCurrentIndex((index) => index + 1);
      }
      if (onError) {
        onError(event);
      }
    },
    [candidates.length, currentIndex, onError]
  );

  const resolvedSrc = candidates[currentIndex];

  const shouldBypassOptimizer = typeof resolvedSrc === "string" && resolvedSrc.startsWith("http://") && !disableProxy;

  return (
    <Image
      {...imageProps}
      alt={alt}
      src={resolvedSrc}
      onError={handleError}
      unoptimized={shouldBypassOptimizer || imageProps.unoptimized}
    />
  );
}
