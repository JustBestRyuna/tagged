import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SourceWithChildren {
  id: number;
  sourceName: string;
  fullName: string;
  contests: { id: number; name: string; }[];
  children: SourceWithChildren[];
  [key: string]: unknown;  // 다른 필드들도 허용
}

export async function GET() {
  try {
    // 모든 출처와 대회를 한 번에 가져오기
    const allSources = await prisma.source.findMany({
      include: {
        contests: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // 출처들을 트리 구조로 변환
    const sourceMap = new Map<number, SourceWithChildren>(
      allSources.map(source => [source.id, { ...source, children: [] }])
    );
    const rootSources: SourceWithChildren[] = [];

    // 먼저 최상위 출처들을 찾음 (이름순 정렬)
    const rootSourcesArray = allSources
      .filter(source => source.parentId === null)
      .sort((a, b) => a.sourceName.localeCompare(b.sourceName));

    for (const source of rootSourcesArray) {
      const sourceWithChildren = sourceMap.get(source.id);
      if (!sourceWithChildren) continue;
      rootSources.push(sourceWithChildren);
    }

    // 하위 출처들 처리 (이름순 정렬)
    const childSources = allSources
      .filter(source => source.parentId !== null)
      .sort((a, b) => a.sourceName.localeCompare(b.sourceName));

    for (const source of childSources) {
      const sourceWithChildren = sourceMap.get(source.id);
      if (!sourceWithChildren) continue;

      const parent = sourceMap.get(source.parentId!);
      if (parent) {
        parent.children.push(sourceWithChildren);
      }
    }

    // 각 출처의 대회들도 이름순 정렬
    for (const source of sourceMap.values()) {
      if (source.contests) {
        source.contests.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        sources: rootSources
      }
    });

    return response;
  } catch (error) {
    console.error('출처 로딩 중 오류:', error);
    return NextResponse.json({
      success: false,
      error: '출처 목록을 불러오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 