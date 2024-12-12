import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { ProblemCrawler } from '@/lib/crawler';
import { SourceCrawler } from '@/lib/crawler/sources';

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 출처 정보 크롤링
    const sourceCrawler = new SourceCrawler();
    await sourceCrawler.crawlAll();

    // 문제 정보 크롤링
    const problemCrawler = new ProblemCrawler();
    await problemCrawler.crawlAll();
    
    return NextResponse.json({
      success: true,
      message: '크롤링이 성공적으로 완료되었습니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('크롤링 실패:', error);
    return NextResponse.json({
      success: false,
      error: '크롤링 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// 수동 실행을 위한 POST 엔드포인트
export async function POST() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  // API 키 인증
  if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const crawler = new ProblemCrawler();
    await crawler.crawlAll();
    
    return NextResponse.json({
      success: true,
      message: '수동 크롤링이 성공적으로 완료되었습니다.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('수동 크롤링 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '크롤링 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
