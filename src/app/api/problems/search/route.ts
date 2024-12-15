import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type MatchType = 'exact' | 'include';
type SortField = 'level' | 'acceptedUserCount' | 'averageTries';
type SortOrder = 'asc' | 'desc';

async function categorizeSourceIds(sources: number[]) {
  // 1. 먼저 contest 테이블에서 실제 대회 ID를 찾습니다
  const contestData = await prisma.contest.findMany({
    where: { id: { in: sources } },
    select: { id: true }
  });
  const contestIdSet = new Set(contestData.map(c => c.id));

  // 2. contest가 아닌 ID들 중에서 source를 찾습니다
  const remainingIds = sources.filter(id => !contestIdSet.has(id));
  const sourceData = await prisma.source.findMany({
    where: { id: { in: remainingIds } },
    select: { 
      id: true,
      contests: {
        select: { id: true }
      }
    }
  });

  // 3. 선택된 source의 직접적인 contest들만 가져옵니다
  const directContestIds = sourceData.flatMap(s => s.contests.map(c => c.id));

  return {
    sourceIds: sourceData.map(s => s.id),
    contestIds: [...contestIdSet, ...directContestIds]
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const matchType = (searchParams.get('matchType') || 'include') as MatchType;
  const keyword = searchParams.get('keyword') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortField = (searchParams.get('sortField') || 'id') as SortField;
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as SortOrder;
  const minLevel = searchParams.get('minLevel') ? Number(searchParams.get('minLevel')) : undefined;
  const maxLevel = searchParams.get('maxLevel') ? Number(searchParams.get('maxLevel')) : undefined;
  const classes = searchParams.get('classes')?.split(',').map(Number) || [];
  const sources = searchParams.get('sources')?.split(',').map(Number) || [];
  const classMatchType = (searchParams.get('classMatchType') || 'or') as 'and' | 'or';
  const sourceMatchType = (searchParams.get('sourceMatchType') || 'or') as 'and' | 'or';

  try {
    const { contestIds } = await categorizeSourceIds(sources);
    
    const allContestIds = contestIds;

    const where = {
      AND: [
        ...(tags.length > 0 
          ? [matchType === 'exact'
              ? {
                  tags: {
                    some: {},
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
          ]
          : []),

        ...(keyword ? [{
          OR: [
            { titleKo: { contains: keyword } },
            { titleEn: { contains: keyword } }
          ]
        }] : []),

        ...(minLevel !== undefined ? [{ level: { gte: minLevel } }] : []),
        ...(maxLevel !== undefined ? [{ level: { lte: maxLevel } }] : []),

        {
          OR: [
            ...(classes.length > 0 
              ? [classMatchType === 'and'
                  ? {
                      AND: classes.map(classId => ({
                        classes: {
                          some: {
                            class: { id: classId }
                          }
                        }
                      }))
                    }
                  : {
                      classes: {
                        some: {
                          class: {
                            id: { in: classes }
                          }
                        }
                      }
                    }
              ]
              : []),

            ...(allContestIds.length > 0
              ? [sourceMatchType === 'and'
                  ? {
                      AND: allContestIds.map(contestId => ({
                        contests: {
                          some: {
                            contestId
                          }
                        }
                      }))
                    }
                  : {
                      contests: {
                        some: {
                          contestId: { in: allContestIds }
                        }
                      }
                    }
              ]
              : [])
          ]
        }
      ]
    };

    const orderBy: Prisma.ProblemOrderByWithRelationInput[] = [
      { [sortField]: sortOrder },
      { id: 'asc' }
    ];

    const total = await prisma.problem.count({ where });

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
    console.error('문제 검색 중 에러 발생:', error);
    return NextResponse.json({
      success: false,
      error: '문제 검색 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
