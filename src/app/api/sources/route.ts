import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROOT_SOURCES = ['ICPC', 'Olympiad', 'Contest', 'University', 'Camp', 'High School'];

interface SourceWithChildren {
  id: number;
  sourceName: string;
  contests: { id: number; name: string; }[];
  children: SourceWithChildren[];
  [key: string]: unknown;  // 다른 필드들도 허용
}

export async function GET() {
  try {
    // 재귀적으로 하위 출처를 가져오는 함수
    const getSourceWithChildren = async (sourceId: number): Promise<SourceWithChildren | null> => {
      const source = await prisma.source.findUnique({
        where: { id: sourceId },
        include: {
          contests: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!source) return null;

      // 하위 출처들 가져오기
      const children = await prisma.source.findMany({
        where: { 
          OR: [
            // 최상위 출처인 경우
            {
              parentId: sourceId,
            },
            // 하위 출처인 경우
            {
              fullName: {
                startsWith: source.sourceName + '/'
              }
            }
          ]
        },
      });

      // 각 하위 출처에 대해 재귀적으로 처리
      const childrenWithData = await Promise.all(
        children.map(child => getSourceWithChildren(child.id))
      );

      return {
        ...source,
        children: childrenWithData.filter(Boolean) as SourceWithChildren[]
      };
    };

    // 루트 출처들 가져오기
    const rootSources = await prisma.source.findMany({
      where: {
        sourceName: {
          in: ROOT_SOURCES
        }
      },
      select: { id: true }
    });

    // 각 루트 출처에 대해 모든 하위 구조 가져오기
    const allSources = await Promise.all(
      rootSources.map(source => getSourceWithChildren(source.id))
    );

    const response = NextResponse.json({
      success: true,
      data: {
        sources: allSources.filter(Boolean)
      }
    });

    // 캐시 헤더 설정
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    console.error('출처 로딩 중 오류:', error);
    return NextResponse.json({
      success: false,
      error: '출처 목록을 불러오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 