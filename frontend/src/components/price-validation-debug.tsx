"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePriceInfo, validatePriceConsistency } from "@/lib/price-utils";
import type { Event } from "@/lib/api-client";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface PriceValidationDebugProps {
  events: Event[];
  limit?: number;
}

export function PriceValidationDebug({ events, limit = 10 }: PriceValidationDebugProps) {
  const validationResults = events.slice(0, limit).map(event => {
    const priceInfo = parsePriceInfo(event.use_fee, event.ticket, event.is_free);
    const validation = validatePriceConsistency(priceInfo, event.is_free);
    
    return {
      event,
      priceInfo,
      validation
    };
  });

  const inconsistentEvents = validationResults.filter(result => !result.validation.isConsistent);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>가격 정보 일관성 검증</span>
            {inconsistentEvents.length === 0 ? (
              <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-50">
                <CheckCircle className="w-3 h-3 mr-1" />
                모든 데이터 일관성 확인
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {inconsistentEvents.length}개 불일치 발견
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.validation.isConsistent 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {result.event.title}
                  </h4>
                  {result.validation.isConsistent ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-medium">is_free 플래그:</span> {result.event.is_free || 'null'}
                  </div>
                  <div>
                    <span className="font-medium">파싱 결과:</span> {result.priceInfo.isFree ? '무료' : '유료'}
                  </div>
                  <div>
                    <span className="font-medium">표시 가격:</span> {result.priceInfo.displayText}
                  </div>
                </div>
                
                {result.priceInfo.rawText && (
                  <div className="mt-2 text-xs">
                    <span className="font-medium">원본 텍스트:</span> {result.priceInfo.rawText}
                  </div>
                )}
                
                {!result.validation.isConsistent && (
                  <div className="mt-2">
                    <div className="text-xs text-red-600">
                      <span className="font-medium">문제점:</span>
                      <ul className="list-disc list-inside ml-2">
                        {result.validation.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}