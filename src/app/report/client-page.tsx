'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportClientPage() {
  const [problemId, setProblemId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [contestId, setContestId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleProblemSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!problemId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/problems/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: Number(problemId) })
      });

      if (!response.ok) throw new Error('문제 제보 중 오류가 발생했습니다.');

      toast({
        title: "성공",
        description: "문제가 성공적으로 업데이트되었습니다."
      });
      setProblemId('');
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "문제 제보 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sourceId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/sources/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: Number(sourceId) })
      });

      if (!response.ok) throw new Error('출처 제보 중 오류가 발생했습니다.');

      toast({
        title: "성공",
        description: "출처가 성공적으로 업데이트되었습니다."
      });
      setSourceId('');
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "출처 제보 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contestId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/contests/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestId: Number(contestId) })
      });

      if (!response.ok) throw new Error('대회 제보 중 오류가 발생했습니다.');

      toast({
        title: "성공",
        description: "대회가 성공적으로 업데이트되었습니다."
      });
      setContestId('');
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "대회 제보 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">제보하기</h1>
      
      <Tabs defaultValue="problem" className="space-y-4">
        <TabsList>
          <TabsTrigger value="problem">문제 제보</TabsTrigger>
          <TabsTrigger value="source">출처 제보</TabsTrigger>
          <TabsTrigger value="contest">대회 제보</TabsTrigger>
        </TabsList>

        <TabsContent value="problem">
          <p className="mb-4 text-muted-foreground">
            백준 문제의 태그, 난이도 등이 변경되었을 때 문제 번호를 입력해주세요.
            입력된 문제의 정보를 자동으로 업데이트합니다.
          </p>

          <form onSubmit={handleProblemSubmit} className="space-y-4">
            <div>
              <Input
                type="number"
                value={problemId}
                onChange={(e) => setProblemId(e.target.value)}
                placeholder="문제 번호를 입력하세요"
                className="w-[200px]"
                min="1000"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : "제보하기"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="source">
          <p className="mb-4 text-muted-foreground">
            solved.ac의 출처 ID를 입력해주세요.
            해당 출처의 정보를 자동으로 업데이트합니다.
          </p>

          <form onSubmit={handleSourceSubmit} className="space-y-4">
            <div>
              <Input
                type="number"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                placeholder="출처 ID를 입력하세요"
                className="w-[200px]"
                min="1"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : "제보하기"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="contest">
          <p className="mb-4 text-muted-foreground">
            solved.ac의 대회 ID를 입력해주세요.
            해당 대회의 정보를 자동으로 업데이트합니다.
          </p>

          <form onSubmit={handleContestSubmit} className="space-y-4">
            <div>
              <Input
                type="number"
                value={contestId}
                onChange={(e) => setContestId(e.target.value)}
                placeholder="대회 ID를 입력하세요"
                className="w-[200px]"
                min="1"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "처리 중..." : "제보하기"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </main>
  );
} 