import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROOT_SOURCES = ['ICPC', 'Olympiad', 'Contest', 'University', 'Camp', 'High School'];

export async function GET() {
  try {
    const allSources = await prisma.source.findMany({
      where: {
        sourceName: {
          in: ROOT_SOURCES
        }
      },
      include: {
        children: {
          include: {
            contests: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        contests: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sources: allSources
      }
    });
  } catch (error) {
    console.error('출처 로딩 중 오류:', error);
    return NextResponse.json({
      success: false,
      error: '출처 목록을 불러오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 