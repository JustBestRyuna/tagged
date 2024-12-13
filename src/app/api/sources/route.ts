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

    // 트리 구조 구성
    for (const source of allSources) {
      const sourceWithChildren = sourceMap.get(source.id);
      if (!sourceWithChildren) continue;

      if (source.parentId === null) {
        console.log('Found root source:', source.sourceName);
        rootSources.push(sourceWithChildren);
      } else {
        // 부모 출처에 추가
        const parent = sourceMap.get(source.parentId);
        if (parent) {
          console.log('Adding child', source.sourceName, 'to parent', parent.sourceName);
          parent.children.push(sourceWithChildren);
        }
      }
    }

    console.log('Final root sources:', rootSources.map(s => s.sourceName));

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