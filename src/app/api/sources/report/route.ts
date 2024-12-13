import { NextResponse } from "next/server";
import { SourceCrawler } from "@/lib/crawler/sources";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const sourceId = Number(json.sourceId);

    // 간단한 입력 검증
    if (!sourceId || sourceId <= 0) {
      return NextResponse.json(
        { error: "유효하지 않은 출처 ID입니다." },
        { status: 400 }
      );
    }

    // 출처 크롤링 실행
    const crawler = new SourceCrawler();
    await crawler.crawlSingleSource(sourceId);

    return NextResponse.json({
      message: "출처가 성공적으로 업데이트되었습니다."
    });

  } catch (error) {
    console.log(`Error in source report: ${error}`);

    return NextResponse.json(
      { error: "출처 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 