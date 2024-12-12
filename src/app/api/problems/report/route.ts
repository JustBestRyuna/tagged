import { NextResponse } from 'next/server';
import { ProblemCrawler } from '@/lib/crawler';

export async function POST(request: Request) {
  try {
    const { problemId } = await request.json();

    if (!problemId || typeof problemId !== 'number') {
      return NextResponse.json({
        success: false,
        error: '유효한 문제 번호를 입력해주세요.'
      }, { status: 400 });
    }

    const crawler = new ProblemCrawler();
    await crawler.crawlSingleProblem(problemId);

    return NextResponse.json({
      success: true,
      message: '문제 정보가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '문제 정보 업데이트 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 