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

export class SourceCrawler {
  private readonly BASE_URL = 'https://solved.ac/api/v3';
  private readonly DELAY = 1000;
  private processedGroups = new Set<number>();
  private processedContests = new Set<number>();

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async crawlAll() {
    try {
      console.log('출처 크롤링 시작...');
      await this.crawlSourceGroup(0); // 루트(0)부터 시작
      console.log('출처 크롤링 완료!');
    } catch (error) {
      console.error('출처 크롤링 중 에러 발생:', error);
      throw error;
    }
  }

  private async crawlSourceGroup(groupId: number, parentId: number | null = null) {
    try {
      // 이미 처리한 그룹이면 건너뛰기
      if (this.processedGroups.has(groupId)) {
        console.log(`그룹 ${groupId} 이미 처리됨, 건너뛰기`);
        return;
      }

      const response = await fetch(
        `${this.BASE_URL}/problem/contest/group?contestGroupId=${groupId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tagged/1.0'
          }
        }
      );

      if (!response.ok) {
        console.log(`그룹 ${groupId} API 응답 실패: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      // API 응답 데이터 유효성 검사
      if (!data || !data.contestGroup) {
        console.log(`그룹 ${groupId} 데이터 없음, 건너뛰기`);
        return;
      }

      // 현재 그룹 저장 및 처리 완료 표시
      if (data.contestGroup.contestGroupId !== 0) {
        await this.saveGroup(data.contestGroup, parentId);
        this.processedGroups.add(groupId);
      }

      // 하위 그룹들 처리
      if (data.childGroups) {
        for (const group of data.childGroups) {
          if (!this.processedGroups.has(group.contestGroupId)) {
            try {
              await this.saveGroup(group, null);  // 먼저 부모 ID 없이 저장
              await this.delay(this.DELAY);
              // 재귀적으로 하위 그룹 크롤링
              await this.crawlSourceGroup(group.contestGroupId, groupId);
            } catch (error) {
              console.log(`하위 그룹 ${group.contestGroupId} 처리 실패: ${error}`);
              continue;  // 실패해도 다음 그룹 계속 처리
            }
          }
        }
      }

      // 대회 정보 처리
      if (data.childContests) {
        for (const contest of data.childContests) {
          if (!this.processedContests.has(contest.contestId)) {
            try {
              await this.crawlContest(contest.contestId);
              this.processedContests.add(contest.contestId);
              await this.delay(this.DELAY);
            } catch (error) {
              console.log(`대회 ${contest.contestId} 처리 실패: ${error}`);
              continue;  // 실패해도 다음 대회 계속 처리
            }
          }
        }
      }
    } catch (error) {
      console.log(`그룹 ${groupId} 처리 중 에러 발생: ${error}`);
      return;
    }
  }

  private async saveGroup(group: ContestGroup, parentId: number | null) {
    try {
      // 1. 먼저 parentId 없이 저장
      await prisma.source.upsert({
        where: { id: group.contestGroupId },
        create: {
          id: group.contestGroupId,
          sourceName: group.contestGroupName,
          fullName: group.contestGroupFullName,
          tag: group.contestGroupTagName,
          problemCount: group.contestGroupProblemCount,
          availableProblemCount: group.contestGroupAvailableProblemCount,
          openProblemCount: group.contestGroupOpenProblemCount,
          parentId: null  // 처음에는 parentId를 null로 설정
        },
        update: {
          sourceName: group.contestGroupName,
          fullName: group.contestGroupFullName,
          tag: group.contestGroupTagName,
          problemCount: group.contestGroupProblemCount,
          availableProblemCount: group.contestGroupAvailableProblemCount,
          openProblemCount: group.contestGroupOpenProblemCount
          // update에서는 parentId를 변경하지 않음
        }
      });

      // 2. parentId가 있는 경우, 별도의 update로 처리
      if (parentId !== null) {
        // 부모 소스가 존재하는지 확인
        const parentExists = await prisma.source.findUnique({
          where: { id: parentId }
        });

        if (parentExists) {
          await prisma.source.update({
            where: { id: group.contestGroupId },
            data: { parentId }
          });
        } else {
          console.log(`부모 소스 ${parentId}가 존재하지 않아 parentId 설정을 건너뜁니다.`);
        }
      }
    } catch (error) {
      console.log(`소스 ${group.contestGroupId} 저장 중 에러 발생`);
      throw error;  // 상위에서 처리하도록 에러를 전파
    }
  }

  public async crawlContest(contestId: number) {
    try {
      console.log(`대회 ${contestId} 처리 중...`);
      
      // 대회 정보 가져오기 (show API 사용)
      const response = await fetch(
        `${this.BASE_URL}/problem/contest/show?contestId=${contestId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tagged/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API 응답 실패: ${response.status}`);
      }

      const data = await response.json();
      if (!data.contest) {
        throw new Error('대회 데이터 없음');
      }

      // 대회 정보 저장
      await prisma.contest.upsert({
        where: { id: contestId },
        create: {
          id: contestId,
          name: data.contest.contestName,
          sourceId: data.contest.parentContestGroupId || 0
        },
        update: {
          name: data.contest.contestName,
          sourceId: data.contest.parentContestGroupId || 0
        }
      });

      // 문제-대회 관계 처리
      if (data.problems) {
        for (const item of data.problems) {
          if (item?.problem) {
            try {
              await prisma.problem.upsert({
                where: { id: item.problem.problemId },
                create: {
                  id: item.problem.problemId,
                  titleKo: item.problem.titleKo || '',
                  level: item.problem.level || 0,
                  averageTries: item.problem.averageTries || 0,
                  acceptedUserCount: item.problem.acceptedUserCount || 0,
                },
                update: {
                  titleKo: item.problem.titleKo || '',
                  level: item.problem.level || 0,
                  averageTries: item.problem.averageTries || 0,
                  acceptedUserCount: item.problem.acceptedUserCount || 0,
                }
              });

              await prisma.problemContest.upsert({
                where: {
                  problemId_contestId: {
                    problemId: item.problem.problemId,
                    contestId: contestId
                  }
                },
                create: {
                  problemId: item.problem.problemId,
                  contestId: contestId
                },
                update: {}
              });
            } catch (dbError) {
              console.log(`문제 ${item.problem.problemId} DB 저장 실패: ${dbError}`);
              continue;
            }
          }
        }
      }

      console.log(`대회 ${contestId} 처리 완료`);
    } catch (error) {
      console.log(`대회 ${contestId} 처리 중 에러 발생:`, error);
      throw error;
    }
  }

  async crawlSingleSource(sourceId: number) {
    try {
      console.log(`출처 ${sourceId} 크롤링 시작...`);
      
      // API 호출
      const response = await fetch(
        `${this.BASE_URL}/problem/contest/group?contestGroupId=${sourceId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tagged/1.0'
          }
        }
      );

      if (!response.ok) {
        console.log(`출처 ${sourceId} API 응답 실패: ${response.status}`);
        throw new Error(`API 응답 실패: ${response.status}`);
      }

      const data = await response.json();
      
      // API 응답 데이터 유효성 검사
      if (!data || !data.contestGroup) {
        console.log(`출처 ${sourceId} 데이터 없음`);
        throw new Error('데이터 없음');
      }

      // 출처 정보 저장
      await this.saveGroup(data.contestGroup, data.contestGroup.parentContestGroupId || null);

      // 대회 정보 처리
      if (data.childContests) {
        for (const contest of data.childContests) {
          if (!this.processedContests.has(contest.contestId)) {
            try {
              await this.crawlContest(contest.contestId);
              this.processedContests.add(contest.contestId);
              await this.delay(this.DELAY);
            } catch (error) {
              console.log(`대회 ${contest.contestId} 처리 실패: ${error}`);
              continue;
            }
          }
        }
      }

      console.log(`출처 ${sourceId} 크롤링 완료!`);
    } catch (error) {
      console.error(`출처 ${sourceId} 크롤링 중 에러 발생:`, error);
      throw error;
    }
  }
} 