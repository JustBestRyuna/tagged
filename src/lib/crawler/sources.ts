import { PrismaClient } from '@prisma/client';
import { SolvedacProblem } from '../types';
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
  childContests: Contest[];
  parentContestGroup: ContestGroup;
}

interface Contest {
  contestId: number;
  contestName: string;
  contestFullName: string;
  contestTagName: string | null;
  contestProblemCount: number;
  contestAvailableProblemCount: number;
  contestOpenProblemCount: number;
  parentContestGroupId: number;
}

interface ContestDetail {
  contest: Contest;
  problems: {
    problemId: number;
    problem: SolvedacProblem;
  }[];
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
      await this.crawlSourceGroup(0); // 루트(0)부터 시작
      console.log('출처 크롤링 완료!');
    } catch (error) {
      console.error('출처 크롤링 중 에러 발생:', error);
      throw error;
    }
  }

  private async crawlSourceGroup(groupId: number) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/problem/contest/group?contestGroupId=${groupId}`,
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
      
      // 현재 그룹 저장
      if (data.contestGroup.contestGroupId !== 0) {
        await this.saveGroup(data.contestGroup);
      }

      // 하위 그룹들 처리
      for (const group of data.childGroups) {
        await this.saveGroup(group);
        await this.delay(this.DELAY);
        // 재귀적으로 하위 그룹 크롤링
        await this.crawlSourceGroup(group.contestGroupId);
      }

      // 대회 정보 처리
      for (const contest of data.childContests) {
        await this.crawlContest(contest.contestId);
        await this.delay(this.DELAY);
      }
    } catch (error) {
      console.error(`그룹 ${groupId} 처리 중 에러:`, error);
      throw error;
    }
  }

  private async saveGroup(group: ContestGroup) {
    await prisma.$transaction(async (tx) => {
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
  }

  private async crawlContest(contestId: number) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/problem/contest/show?contestId=${contestId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`대회 API 요청 실패: ${response.status}`);
      }

      const data = await response.json() as ContestDetail;
      
      // 대회에 포함된 문제들 처리
      for (const item of data.problems) {
        await prisma.problemSource.upsert({
          where: {
            problemId_sourceId: {
              problemId: item.problemId,
              sourceId: data.contest.parentContestGroupId
            }
          },
          create: {
            problemId: item.problemId,
            sourceId: data.contest.parentContestGroupId
          },
          update: {}
        });
      }

      console.log(`대회 ${data.contest.contestName} 처리 완료`);
    } catch (error) {
      console.error(`대회 ${contestId} 처리 중 에러:`, error);
      throw error;
    }
  }
} 