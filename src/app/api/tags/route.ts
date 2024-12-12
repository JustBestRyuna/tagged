import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        key: true,
        nameKo: true,
        nameEn: true,
        isMeta: true,
        _count: {
          select: {
            problems: true
          }
        }
      },
      orderBy: [
        { isMeta: 'asc' },
        { problems: { _count: 'desc' } }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        tags: tags.map(tag => ({
          ...tag,
          problemCount: tag._count.problems
        }))
      }
    });
  } catch (error) {
    console.error('태그 목록 조회 중 에러:', error);
    return NextResponse.json({
      success: false,
      error: '태그 목록을 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 