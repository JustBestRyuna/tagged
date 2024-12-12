import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ContestGroup {
  contestGroupId: number;
  contestGroupName: string;
  contestGroupFullName: string;
  contestGroupTagName: string | null;
  contestGroupProblemCount: number;
  contestGroupAvailableProblemCount: number;
  contestGroupOpenProblemCount: number;
  parentContestGroupId: number;
}

interface ContestGroupResponse {
  contestGroup: ContestGroup;
  childGroups: ContestGroup[];
  childContests: unknown[];
  parentContestGroup: unknown;
}

export class SourceCrawler {
  private readonly BASE_URL = 'https://solved.ac/api/v3';
  private readonly DELAY = 1000;

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async crawlAll() {
    try {
      console.log('출처 크롤링 시작...');
      await this.crawlSources();
      console.log('출처 크롤링 완료!');
    } catch (error) {
      console.error('출처 크롤링 중 에러 발생:', error);
      throw error;
    }
  }

  private async crawlSources() {
    try {
      // 1. 메인 출처 그룹 정보 가져오기
      const response = await fetch(
        `${this.BASE_URL}/problem/contest/group?contestGroupId=0`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json() as ContestGroupResponse;
      
      // 2. 각 출처 그룹 처리
      for (const group of data.childGroups) {
        await prisma.$transaction(async (tx) => {
          // 출처 그룹 저장/업데이트
          const savedGroup = await tx.source.upsert({
            where: { id: group.contestGroupId },
            create: {
              id: group.contestGroupId,
              sourceName: group.contestGroupName,
              fullName: group.contestGroupFullName,
              tag: group.contestGroupTagName,
              problemCount: group.contestGroupProblemCount,
              availableProblemCount: group.contestGroupAvailableProblemCount,
              openProblemCount: group.contestGroupOpenProblemCount
            },
            update: {
              sourceName: group.contestGroupName,
              fullName: group.contestGroupFullName,
              tag: group.contestGroupTagName,
              problemCount: group.contestGroupProblemCount,
              availableProblemCount: group.contestGroupAvailableProblemCount,
              openProblemCount: group.contestGroupOpenProblemCount
            }
          });

          console.log(`출처 그룹 처리 완료: ${savedGroup.sourceName}`);
        });

        await this.delay(this.DELAY);
      }
    } catch (error) {
      console.error('출처 정보 처리 중 에러:', error);
      throw error;
    }
  }
} 