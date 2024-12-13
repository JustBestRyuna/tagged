import { NextResponse } from "next/server";
import { SourceCrawler } from "@/lib/crawler/sources";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const contestId = Number(json.contestId);

    // 간단한 입력 검증
    if (!contestId || contestId <= 0) {
      return NextResponse.json(
        { error: "유효하지 않은 대회 ID입니다." },
        { status: 400 }
      );
    }

    // 대회 크롤링 실행
    const crawler = new SourceCrawler();
    await crawler.crawlContest(contestId);

    return NextResponse.json({
      message: "대회가 성공적으로 업데이트되었습니다."
    });

  } catch (error) {
    console.log(`Error in contest report: ${error}`);

    return NextResponse.json(
      { error: "대회 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 