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
  
  // 1. 쉼표가 포함된 숫자 패턴 (예: 20,000원, 1,500원, VIP석 20,000원)
  const commaPattern = /(?:[a-zA-Z가-힣]*석?\s*)?(\d{1,3}(?:,\d{3})+)\s*원/g;
  const commaMatches = text.matchAll(commaPattern);
  for (const match of commaMatches) {
    const numStr = match[1].replace(/,/g, '');
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > 0) {
      prices.push(num);
    }
  }
  
  // 2. 한글 숫자 표현 - 향상된 패턴 (예: 3만원, 5천원, VIP석 15만원, R석 12만원)
  const koreanNumberPattern = /(?:[a-zA-Z]*석?\s*)?(\d+)\s*(만|천)\s*원/g;
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
  const normalPattern = /(?:[a-zA-Z가-힣]*석?\s*)?(\d{4,})\s*원/g;
  const normalMatches = text.matchAll(normalPattern);
  for (const match of normalMatches) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) {
      // 이미 파싱된 것과 중복되지 않도록 체크
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
    /(재료비|교재비|체험비|입장료)\s*:\s*([^,\n]+)/,
    /\*\s*([^:]+)\s*:\s*([^/\n]+)/
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
 * 좌석별 가격 정보를 추출합니다
 */
function extractSeatPrices(text: string): { seatType: string; price: number }[] {
  if (!text) return [];
  
  const seatPrices: { seatType: string; price: number }[] = [];
  
  // VIP석, R석, S석, A석 등의 좌석 타입과 가격 매칭
  const seatPatterns = [
    // VIP석 15만원, R석 12만원 형태
    /([VIPRS석]+|전석|일반석|프리미엄석)\s*(\d+)\s*(만|천)\s*원/g,
    // VIP석 150,000원, R석 120,000원 형태
    /([VIPRS석]+|전석|일반석|프리미엄석)\s*(\d{1,3}(?:,\d{3})+)\s*원/g,
    // VIP석 50000원 형태
    /([VIPRS석]+|전석|일반석|프리미엄석)\s*(\d{4,})\s*원/g
  ];
  
  for (const pattern of seatPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const seatType = match[1];
      let price: number;
      
      if (match[3]) { // 한글 숫자 (만원, 천원)
        const num = parseInt(match[2], 10);
        const unit = match[3];
        if (unit === '만') {
          price = num * 10000;
        } else if (unit === '천') {
          price = num * 1000;
        } else {
          continue;
        }
      } else { // 일반 숫자
        const numStr = match[2].replace(/,/g, '');
        price = parseInt(numStr, 10);
      }
      
      if (!isNaN(price) && price > 0) {
        seatPrices.push({ seatType, price });
      }
    }
  }
  
  return seatPrices;
}

/**
 * 프로모션 가격 정보를 추출합니다 (할인가, 정가)
 */
function extractPromotionalPricing(text: string): { discountPrice: number | null; regularPrice: number | null; description: string | null } {
  if (!text) return { discountPrice: null, regularPrice: null, description: null };
  
  // 할인: 3,000원(정가 5,000원) 형태
  const promotionPattern = /(할인|오픈기념할인|특가)\s*:\s*(\d{1,3}(?:,\d{3})+|\d+)\s*원?\s*\(\s*정가\s*(\d{1,3}(?:,\d{3})+|\d+)\s*원\s*\)/;
  const match = text.match(promotionPattern);
  
  if (match) {
    const description = match[1];
    const discountPrice = parseInt(match[2].replace(/,/g, ''), 10);
    const regularPrice = parseInt(match[3].replace(/,/g, ''), 10);
    
    if (!isNaN(discountPrice) && !isNaN(regularPrice)) {
      return { discountPrice, regularPrice, description };
    }
  }
  
  return { discountPrice: null, regularPrice: null, description: null };
}

/**
 * 가격 범위 텍스트를 파싱합니다 (예: "20,000원~50,000원")
 */
function parseRangePrice(text: string): { min: number | null; max: number | null } {
  // 한글 숫자 범위 (3만원~5만원)
  const koreanRangePattern = /(\d+)\s*(만|천)\s*원\s*[-~]\s*(\d+)\s*(만|천)\s*원/;
  const koreanMatch = text.match(koreanRangePattern);
  
  if (koreanMatch) {
    const num1 = parseInt(koreanMatch[1], 10);
    const unit1 = koreanMatch[2];
    const num2 = parseInt(koreanMatch[3], 10);
    const unit2 = koreanMatch[4];
    
    let min = num1;
    let max = num2;
    
    if (unit1 === '만') min *= 10000;
    else if (unit1 === '천') min *= 1000;
    
    if (unit2 === '만') max *= 10000;
    else if (unit2 === '천') max *= 1000;
    
    if (!isNaN(min) && !isNaN(max)) {
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }
  }
  
  // 일반 숫자 범위 (20,000원~50,000원)
  const rangePattern = /(\d{1,3}(?:,\d{3})*)\s*원?\s*[-~]\s*(\d{1,3}(?:,\d{3})*)\s*원/;
  const match = text.match(rangePattern);
  
  if (match) {
    const min = parseInt(match[1].replace(/,/g, ''), 10);
    const max = parseInt(match[2].replace(/,/g, ''), 10);
    
    if (!isNaN(min) && !isNaN(max)) {
      return { min: Math.min(min, max), max: Math.max(min, max) };
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
  
  // 프로모션 가격 정보 확인 (할인가, 정가)
  const promotionalPricing = extractPromotionalPricing(rawText);
  if (promotionalPricing.discountPrice !== null && promotionalPricing.regularPrice !== null) {
    return {
      isFree: false,
      minPrice: promotionalPricing.discountPrice,
      maxPrice: promotionalPricing.regularPrice,
      displayText: `${formatPrice(promotionalPricing.discountPrice)} (${promotionalPricing.description})`,
      rawText,
      hasMultiplePrices: true
    };
  }
  
  // 좌석별 가격 정보 확인
  const seatPrices = extractSeatPrices(rawText);
  if (seatPrices.length > 0) {
    const prices = seatPrices.map(seat => seat.price);
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