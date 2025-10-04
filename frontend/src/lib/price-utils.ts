/**
 * 행사 가격 정보 파싱 및 처리 유틸리티
 */

export interface PriceInfo {
  isFree: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  displayText: string;
  rawText: string;
  hasMultiplePrices: boolean;
}

/**
 * 텍스트에서 숫자 가격을 추출합니다
 */
function extractPrices(text: string): number[] {
  if (!text) return [];
  
  const prices: number[] = [];
  
  // 1. 쉼표가 포함된 숫자 패턴 (예: 20,000원, 1,500원)
  const commaPattern = /(\d{1,3}(?:,\d{3})+)\s*원/g;
  const commaMatches = text.matchAll(commaPattern);
  for (const match of commaMatches) {
    const numStr = match[1].replace(/,/g, '');
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > 0) {
      prices.push(num);
    }
  }
  
  // 2. 한글 숫자 표현 (예: 3만원, 5천원)
  const koreanNumberPattern = /(\d+)\s*(만|천)\s*원/g;
  const koreanMatches = text.matchAll(koreanNumberPattern);
  for (const match of koreanMatches) {
    const num = parseInt(match[1], 10);
    const unit = match[2];
    if (!isNaN(num)) {
      let price = num;
      if (unit === '만') {
        price = num * 10000;
      } else if (unit === '천') {
        price = num * 1000;
      }
      prices.push(price);
    }
  }
  
  // 3. 일반 숫자 패턴 (예: 5000원) - 한글 숫자와 중복되지 않도록 체크
  const normalPattern = /(\d{4,})\s*원/g;
  const normalMatches = text.matchAll(normalPattern);
  for (const match of normalMatches) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) {
      // 이미 한글 숫자로 파싱된 것과 중복되지 않도록 체크
      if (!prices.includes(num)) {
        prices.push(num);
      }
    }
  }
  
  return prices;
}

/**
 * 부분 유료 정보를 추출합니다
 */
function extractPartialPaidInfo(text: string): string | null {
  if (!text) return null;
  
  const normalized = text.toLowerCase().trim();
  
  // 부분 유료 패턴들
  const partialPaidPatterns = [
    /일부\s*유료\s*\(([^)]+)\)/,
    /별도\s*비용\s*\(([^)]+)\)/,
    /추가\s*비용\s*\(([^)]+)\)/,
    /(재료비|교재비|체험비)\s*별도/,
    /(재료비|교재비|체험비)\s*:\s*([^,\n]+)/
  ];
  
  for (const pattern of partialPaidPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[2] || match[0];
    }
  }
  
  return null;
}

/**
 * 무료 여부를 판단합니다
 */
function checkIsFree(text: string): boolean {
  if (!text) return false;
  
  const normalized = text.toLowerCase().trim();
  
  // 명시적 무료 표현들
  const freeIndicators = [
    '무료',
    'free', 
    '0원',
    '입장료 없음',
    '참가비 없음',
    '관람료 없음'
  ];
  
  // 부분 유료 표현들 (무료가 아님을 나타냄)
  const partialPaidIndicators = [
    '일부 유료',
    '별도 비용',
    '추가 비용',
    '재료비',
    '교재비',
    '체험비'
  ];
  
  // 부분 유료 표현이 있으면 무료가 아님
  if (partialPaidIndicators.some(indicator => normalized.includes(indicator))) {
    return false;
  }
  
  return freeIndicators.some(indicator => normalized.includes(indicator));
}

/**
 * 가격 범위 텍스트를 파싱합니다 (예: "20,000원~50,000원")
 */
function parseRangePrice(text: string): { min: number | null; max: number | null } {
  const rangePattern = /(\d{1,3}(?:,\d{3})*)\s*원?\s*[-~]\s*(\d{1,3}(?:,\d{3})*)\s*원/;
  const match = text.match(rangePattern);
  
  if (match) {
    const min = parseInt(match[1].replace(/,/g, ''), 10);
    const max = parseInt(match[2].replace(/,/g, ''), 10);
    
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }
  
  return { min: null, max: null };
}

/**
 * 가격을 포맷팅합니다
 */
function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

/**
 * 행사의 가격 정보를 파싱합니다
 */
export function parsePriceInfo(
  useFee: string | null | undefined,
  ticket: string | null | undefined,
  isFreeFlag: string | null | undefined
): PriceInfo {
  // 원본 텍스트 조합
  const rawText = [useFee, ticket].filter(Boolean).join(' ').trim();
  
  // is_free 플래그 확인
  const isFreeFromFlag = isFreeFlag === '무료' || isFreeFlag === 'free';
  
  // 텍스트에서 무료 여부 확인
  const isFreeFromText = checkIsFree(rawText);
  
  // 최종 무료 여부 결정 (플래그 우선, 텍스트로 보완)
  const isFree = isFreeFromFlag || (isFreeFromText && !rawText.match(/\d+\s*원/));
  
  if (isFree) {
    return {
      isFree: true,
      minPrice: null,
      maxPrice: null,
      displayText: '무료',
      rawText,
      hasMultiplePrices: false
    };
  }
  
  // 가격 범위 파싱 시도
  const rangePrice = parseRangePrice(rawText);
  if (rangePrice.min !== null && rangePrice.max !== null) {
    return {
      isFree: false,
      minPrice: rangePrice.min,
      maxPrice: rangePrice.max,
      displayText: `${formatPrice(rangePrice.min)}~${formatPrice(rangePrice.max)}`,
      rawText,
      hasMultiplePrices: true
    };
  }
  
  // 부분 유료 정보 확인
  const partialPaidInfo = extractPartialPaidInfo(rawText);
  if (partialPaidInfo) {
    return {
      isFree: false,
      minPrice: null,
      maxPrice: null,
      displayText: `일부 유료 (${partialPaidInfo})`,
      rawText,
      hasMultiplePrices: false
    };
  }
  
  // 개별 가격들 추출
  const prices = extractPrices(rawText);
  
  if (prices.length === 0) {
    // 가격 정보가 없으면 플래그에 따라 결정
    return {
      isFree: isFreeFromFlag,
      minPrice: null,
      maxPrice: null,
      displayText: isFreeFromFlag ? '무료' : '가격 정보 없음',
      rawText,
      hasMultiplePrices: false
    };
  }
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasMultiplePrices = prices.length > 1;
  
  let displayText: string;
  if (hasMultiplePrices) {
    if (minPrice === maxPrice) {
      displayText = formatPrice(minPrice);
    } else {
      displayText = `${formatPrice(minPrice)}부터`;
    }
  } else {
    displayText = formatPrice(minPrice);
  }
  
  return {
    isFree: false,
    minPrice,
    maxPrice,
    displayText,
    rawText,
    hasMultiplePrices
  };
}

/**
 * 간단한 가격 표시용 텍스트를 생성합니다
 */
export function getSimplePriceDisplay(priceInfo: PriceInfo): string {
  if (priceInfo.isFree) {
    return '무료';
  }
  
  // 부분 유료 케이스 (displayText에 "일부 유료"가 포함된 경우)
  if (priceInfo.displayText.includes('일부 유료')) {
    return priceInfo.displayText;
  }
  
  if (priceInfo.minPrice === null) {
    return '가격 문의';
  }
  
  if (priceInfo.hasMultiplePrices && priceInfo.minPrice !== priceInfo.maxPrice) {
    return `${formatPrice(priceInfo.minPrice)}부터`;
  }
  
  return formatPrice(priceInfo.minPrice);
}

/**
 * 가격 정보의 일관성을 검증합니다
 */
export function validatePriceConsistency(
  priceInfo: PriceInfo,
  isFreeFlag: string | null | undefined
): {
  isConsistent: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  const isFreeFromFlag = isFreeFlag === '무료';
  
  // 플래그와 파싱 결과 불일치 확인
  if (isFreeFromFlag && !priceInfo.isFree && priceInfo.minPrice !== null) {
    issues.push('무료 플래그가 설정되었지만 가격 정보가 있습니다');
  }
  
  if (!isFreeFromFlag && priceInfo.isFree && priceInfo.rawText.length > 0) {
    issues.push('유료 플래그이지만 무료로 파싱되었습니다');
  }
  
  // 가격 범위 유효성 확인
  if (priceInfo.minPrice !== null && priceInfo.maxPrice !== null) {
    if (priceInfo.minPrice > priceInfo.maxPrice) {
      issues.push('최소 가격이 최대 가격보다 큽니다');
    }
  }
  
  return {
    isConsistent: issues.length === 0,
    issues
  };
}