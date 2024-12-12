import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface SolvedacProblem {
  problemId: number;
  titleKo: string;
  titles: { language: string; title: string; }[];
  level: number;
  acceptedUserCount: number;
  averageTries: number;
  tags: {
    key: string;
    displayNames: { language: string; name: string; }[];
    isMeta: boolean;
  }[];
  sourceCodes: { source: string }[];
  classes: { class: number }[];
}

export class ProblemCrawler {
  private readonly BASE_URL = 'https://solved.ac/api/v3';
  private readonly DELAY = 1000; // 1초 딜레이

  async crawlAll() {
    try {
      console.log('문제 크롤링 시작...');
      // 난이도 0~30까지 순차적으로 크롤링
      for (let level = 0; level <= 30; level++) {
        console.log(`난이도 ${level} 크롤링 시작...`);
        await this.crawlProblemsByLevel(level);
        await delay(this.DELAY);
      }
      console.log('문제 크롤링 완료!');
    } catch (error) {
      console.error('문제 크롤링 중 에러 발생:', error);
      throw error;
    }
  }

  private async crawlProblemsByLevel(level: number) {
    let page = 1;
    const items_per_page = 50;

    while (true) {
      try {
        const response = await fetch(
          `${this.BASE_URL}/search/problem?query=*${level}&page=${page}&sort=id&direction=asc&limit=${items_per_page}`,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json() as { items: SolvedacProblem[] };

        if (!data.items.length) break;

        await this.processProblemBatch(data.items);
        console.log(`난이도 ${level} - 페이지 ${page} 처리 완료`);
        
        page++;
        await delay(this.DELAY);
      } catch (error) {
        console.error(`난이도 ${level} - 페이지 ${page} 처리 중 에러:`, error);
        throw error;
      }
    }
  }
  
  private async processProblemBatch(problems: SolvedacProblem[]) {
    for (const problem of problems) {
      await prisma.$transaction(async (tx) => {
        // 1. 문제 기본 정보 저장/업데이트
        const savedProblem = await tx.problem.upsert({
          where: { id: problem.problemId },
          create: {
            id: problem.problemId,
            titleKo: problem.titleKo,
            titleEn: problem.titles.find(t => t.language === 'en')?.title || null,
            level: problem.level,
            acceptedUserCount: problem.acceptedUserCount,
            averageTries: problem.averageTries || 0
          },
          update: {
            titleKo: problem.titleKo,
            titleEn: problem.titles.find(t => t.language === 'en')?.title || null,
            level: problem.level,
            acceptedUserCount: problem.acceptedUserCount,
            averageTries: problem.averageTries || 0
          }
        });

        // 2. 태그 정보 처리
        for (const tag of problem.tags) {
          const savedTag = await tx.tag.upsert({
            where: { key: tag.key },
            create: {
              key: tag.key,
              nameKo: tag.displayNames.find(n => n.language === 'ko')?.name || tag.key,
              nameEn: tag.displayNames.find(n => n.language === 'en')?.name || null,
              isMeta: tag.isMeta
            },
            update: {
              nameKo: tag.displayNames.find(n => n.language === 'ko')?.name || tag.key,
              nameEn: tag.displayNames.find(n => n.language === 'en')?.name || null,
              isMeta: tag.isMeta
            }
          });

          // 문제-태그 관계 설정
          await tx.problemTag.upsert({
            where: {
              problemId_tagId: {
                problemId: savedProblem.id,
                tagId: savedTag.id
              }
            },
            create: {
              problemId: savedProblem.id,
              tagId: savedTag.id
            },
            update: {}
          });
        }

        // 3. CLASS 정보 처리
        for (const classInfo of problem.classes) {
          const savedClass = await tx.class.upsert({
            where: { id: classInfo.class },
            create: {
              id: classInfo.class,
              name: `Class ${classInfo.class}`
            },
            update: {}
          });

          await tx.problemClass.upsert({
            where: {
              problemId_classId: {
                problemId: savedProblem.id,
                classId: savedClass.id
              }
            },
            create: {
              problemId: savedProblem.id,
              classId: savedClass.id
            },
            update: {}
          });
        }
      });
    }
  }
}
