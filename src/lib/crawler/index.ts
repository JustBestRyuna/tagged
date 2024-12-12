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
  private readonly MAX_RETRIES = 5;
  private readonly BATCH_SIZE = 100;

  private async fetchWithRetry(url: string, retries = this.MAX_RETRIES): Promise<SolvedacResponse> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tagged/1.0'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            const waitTime = this.DELAY * Math.pow(2, i);
            await this.delay(waitTime);
            continue;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data as SolvedacResponse;
      } catch (error) {
        console.error(`시도 ${i + 1}/${retries} 실패:`, error);
        if (i === retries - 1) throw error;
        await this.delay(this.DELAY * Math.pow(2, i));
      }
    }
    throw new Error('Max retries reached');
  }

  private async crawlProblemsByLevel(level: number) {
    let page = 1;

    while (true) {
      try {
        // if (level === 26 && page <= 5) {
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
      try {
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

          // 2. 태그 정보 처리 - 배치 처리로 변경
          const tagBatches = this.chunkArray(problem.tags, this.BATCH_SIZE);
          for (const tagBatch of tagBatches) {
            await Promise.all(tagBatch.map(async (tag) => {
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
            }));
            await this.delay(100); // 배치 간 짧은 딜레이
          }

          // 3. CLASS 정보 처리
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
        }, {
          timeout: 30000
        });
      } catch (error) {
        console.error(`문제 ${problem.problemId} 처리 중 에러:`, error);
        await this.delay(this.DELAY);
      }
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async crawlSingleProblem(problemId: number) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/problem/show?problemId=${problemId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tagged/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const problem = await response.json();
      
      // API 응답을 SolvedacProblem 형식으로 변환
      const solvedacProblem: SolvedacProblem = {
        problemId: problem.problemId,
        titleKo: problem.titleKo,
        titles: problem.titles,
        level: problem.level,
        acceptedUserCount: problem.acceptedUserCount,
        averageTries: problem.averageTries,
        tags: problem.tags,
        classes: []
      };

      await this.processProblemBatch([solvedacProblem]);
      return true;
    } catch (error) {
      console.error(`문제 ${problemId} 크롤링 중 에러:`, error);
      throw error;
    }
  }
}