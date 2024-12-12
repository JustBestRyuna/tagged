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

  private async crawlSourceGroup(groupId: number) {
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
        await this.saveGroup(data.contestGroup);
        this.processedGroups.add(groupId);
      }

      // 하위 그룹들 처리
      if (data.childGroups) {
        for (const group of data.childGroups) {
          if (!this.processedGroups.has(group.contestGroupId)) {
            await this.saveGroup(group);
            await this.delay(this.DELAY);
            // 재귀적으로 하위 그룹 크롤링
            await this.crawlSourceGroup(group.contestGroupId);
          }
        }
      }

      // 대회 정보 처리
      if (data.childContests) {
        for (const contest of data.childContests) {
          if (!this.processedContests.has(contest.contestId)) {
            try {
              await this.crawlContest(contest.contestId, data.contestGroup.contestGroupId);
              this.processedContests.add(contest.contestId);
              await this.delay(this.DELAY);
            } catch (error) {
              console.error(`대회 ${contest.contestId} 처리 실패, 계속 진행`, error);
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error(`그룹 ${groupId} 처리 중 에러:`, error);
      // 에러가 발생해도 크롤링을 중단하지 않음
      return;
    }
  }

  private async saveGroup(group: ContestGroup) {
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
      },
      update: {
        sourceName: group.contestGroupName,
        fullName: group.contestGroupFullName,
        tag: group.contestGroupTagName,
        problemCount: group.contestGroupProblemCount,
        availableProblemCount: group.contestGroupAvailableProblemCount,
        openProblemCount: group.contestGroupOpenProblemCount,
      }
    });
  }

  private async crawlContest(contestId: number, sourceId: number) {
    try {
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
        console.log(`대회 ${contestId} API 응답 실패: ${response.status}`);
        return;
      }

      const data = await response.json();
      
      if (!data || !data.contest) {
        console.log(`대회 ${contestId} 데이터 없음, 건너뛰기`);
        return;
      }

      // 대회 정보 저장
      await prisma.contest.upsert({
        where: { id: contestId },
        create: {
          id: contestId,
          name: data.contest.contestName,
          sourceId: sourceId
        },
        update: {
          name: data.contest.contestName,
          sourceId: sourceId
        }
      });

      // 문제-대회 관계 저장
      if (data.problems === null) {
        console.log(`대회 ${contestId}의 문제 목록이 null입니다.`);
        return;
      }

      console.log(`대회 ${contestId}의 문제 수:`, data.problems.length);

      for (const item of data.problems || []) {
        if (item?.problem) {
          try {
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
            console.error(`문제 ${item.problem.problemId} DB 저장 실패:`, dbError);
            continue;
          }
        }
      }

      console.log(`대회 ${data.contest.contestName} 처리 완료`);
    } catch (error) {
      console.error(`대회 ${contestId} 처리 중 에러:`, error);
      return;
    }
  }
} 