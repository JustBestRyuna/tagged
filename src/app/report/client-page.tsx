'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ReportClientPage() {
  const [problemId, setProblemId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!problemId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/problems/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: Number(problemId) })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '문제 제보 중 오류가 발생했습니다.');
      }

      toast({
        title: "성공",
        description: data.message
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

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">문제 제보</h1>
      <p className="mb-4 text-muted-foreground">
        백준 문제의 태그, 난이도 등이 변경되었을 때 문제 번호를 입력해주세요.
        입력된 문제의 정보를 자동으로 업데이트합니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
    </main>
  );
} 