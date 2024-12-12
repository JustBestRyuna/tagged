import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type MatchType = 'exact' | 'include';
type SortField = 'level' | 'acceptedUserCount' | 'averageTries';
type SortOrder = 'asc' | 'desc';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 검색 파라미터 파싱
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const matchType = (searchParams.get('matchType') || 'include') as MatchType;
  const keyword = searchParams.get('keyword') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortField = (searchParams.get('sortField') || 'level') as SortField;
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as SortOrder;
  const minLevel = searchParams.get('minLevel') ? Number(searchParams.get('minLevel')) : undefined;
  const maxLevel = searchParams.get('maxLevel') ? Number(searchParams.get('maxLevel')) : undefined;
  const classes = searchParams.get('classes')?.split(',').map(Number) || [];

  try {
    // 태그 검색 조건 구성
    const tagCondition = tags.length > 0 
      ? matchType === 'exact'
        ? {
            // 정확히 일치: 지정된 태그만 가지고 있어야 함
            tags: {
              some: {}, // 태그가 최소 1개 이상 있어야 함
              every: {
                tag: {
                  key: {
                    in: tags
                  }
                }
              }
            },
            AND: {
              tags: {
                none: {
                  tag: {
                    key: {
                      notIn: tags
                    }
                  }
                }
              }
            }
          }
        : {
            // 포함: 지정된 태그들이 모두 포함되어 있어야 함
            tags: {
              some: {
                tag: {
                  key: {
                    in: tags
                  }
                }
              }
            },
            AND: tags.map(tag => ({
              tags: {
                some: {
                  tag: {
                    key: tag
                  }
                }
              }
            }))
          }
      : {};

    // 검색 조건 구성
    const where = {
      AND: [
        tagCondition,
        // 키워드 검색
        keyword ? {
          OR: [
            { titleKo: { contains: keyword } },
            { titleEn: { contains: keyword } }
          ]
        } : {},
        minLevel !== undefined ? { level: { gte: minLevel } } : {},
        maxLevel !== undefined ? { level: { lte: maxLevel } } : {},
        classes.length > 0 ? {
          classes: {
            some: {
              class: {
                id: {
                  in: classes
                }
              }
            }
          }
        } : {},
      ]
    };

    const orderBy: Prisma.ProblemOrderByWithRelationInput[] = [
      { [sortField]: sortOrder },
      { id: 'asc' }
    ];

    // 총 결과 수 조회
    const total = await prisma.problem.count({ where });

    // 문제 검색 실행
    const problems = await prisma.problem.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: {
              select: {
                key: true,
                nameKo: true,
                nameEn: true,
                isMeta: true
              }
            }
          }
        },
        classes: {
          include: {
            class: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        problems,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('문제 검색 중 에러:', error);
    return NextResponse.json({
      success: false,
      error: '문제 검색 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
