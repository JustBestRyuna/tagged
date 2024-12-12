import { PrismaClient } from '@prisma/client';
import { SolvedacProblem } from '../types';

const prisma = new PrismaClient();

interface SolvedacResponse {
  count: number;
  items: SolvedacProblem[];
}

export class ProblemCrawler {
  private readonly BASE_URL = 'https://solved.ac/api/v3';
  private readonly DELAY = 1000;

  private async fetchWithRetry(url: string, retries = 3): Promise<SolvedacResponse> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tagged/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data as SolvedacResponse;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(this.DELAY * (i + 1));
      }
    }
    throw new Error('Max retries reached');
  }

  private async crawlProblemsByLevel(level: number) {
    let page = 1;

    while (true) {
      try {
        // if (level === 20 && page <= 16) {
        //   page++;
        //   continue;
        // }

        const data = await this.fetchWithRetry(
          `${this.BASE_URL}/search/problem?query=*${level}&page=${page}&sort=id&direction=asc`
        );

        if (!data?.items?.length) {
          console.log(`난이도 ${level} 완료`);
          break;
        }

        await this.processProblemBatch(data.items);
        console.log(`난이도 ${level} - 페이지 ${page} 처리 완료`);
        
        page++;
        await this.delay(this.DELAY);
      } catch (error) {
        console.error(`난이도 ${level} - 페이지 ${page} 처리 중 에러:`, error);
        await this.delay(this.DELAY * 2);
        break;
      }
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async crawlAll() {
    try {
      console.log('문제 크롤링 시작...');
      
      // 1. CLASS 문제 크롤링 (1~10)
      for (let classLevel = 1; classLevel <= 10; classLevel++) {
        console.log(`CLASS ${classLevel} 크롤링 시작...`);
        await this.crawlProblemsByClass(classLevel);
        await this.delay(this.DELAY);
      }

      // 2. 난이도별 문제 크롤링 (0~30)
      for (let level = 0; level <= 30; level++) {
        console.log(`난이도 ${level} 크롤링 시작...`);
        await this.crawlProblemsByLevel(level);
        await this.delay(this.DELAY);
      }

      console.log('문제 크롤링 완료!');
    } catch (error) {
      console.error('문제 크롤링 중 에러 발생:', error);
      throw error;
    }
  }

  private async crawlProblemsByClass(classLevel: number) {
    let page = 1;
  
    while (true) {
      try {
        const data = await this.fetchWithRetry(
          `${this.BASE_URL}/search/problem?query=c/${classLevel}&page=${page}&sort=id&direction=asc`
        );
  
        if (!data?.items?.length) {
          console.log(`CLASS ${classLevel} 완료`);
          break;
        }
  
        await this.processProblemBatch(data.items, classLevel); // classLevel 전달
        console.log(`CLASS ${classLevel} - 페이지 ${page} 처리 완료`);
        
        page++;
        await this.delay(this.DELAY);
      } catch (error) {
        console.error(`CLASS ${classLevel} - 페이지 ${page} 처리 중 에러:`, error);
        await this.delay(this.DELAY * 2);
        break;
      }
    }
  }

  private async processProblemBatch(problems: SolvedacProblem[], classLevel?: number) {
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

        // 3. CLASS 정보 처리 (classLevel이 있는 경우에만)
      if (classLevel) {
        const savedClass = await tx.class.upsert({
          where: { id: classLevel },
          create: {
            id: classLevel,
            name: `Class ${classLevel}`
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