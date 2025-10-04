import { PriceValidationDebug } from "@/components/price-validation-debug";
import { fetchEvents } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PriceDebugPage() {
  // 다양한 가격 형태의 샘플 데이터 가져오기
  const eventsData = await fetchEvents({ limit: 50 });
  
  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">가격 파싱 테스트</h1>
          <p className="text-muted-foreground">
            행사 가격 정보 파싱 결과 및 일관성 검증
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
      
      <PriceValidationDebug events={eventsData.items} limit={20} />
      
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">테스트 대상 가격 형식들:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• &quot;전석 20,000원&quot; → &quot;20,000원&quot;</li>
          <li>• &quot;R석 60,000원｜S석 50,000원｜A석 35,000원&quot; → &quot;35,000원부터&quot;</li>
          <li>• &quot;99,000원~143,000원&quot; → &quot;99,000원~143,000원&quot;</li>
          <li>• &quot;무료 ※ 프로그램별...&quot; → &quot;무료&quot;</li>
          <li>• &quot;성인 5,000원, 청소년 4,000원&quot; → &quot;4,000원부터&quot;</li>
        </ul>
      </div>
    </div>
  );
}