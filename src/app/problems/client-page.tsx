'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getLevelName } from '@/lib/utils';
import { SourceSelector } from '@/components/source-selector';
import { RefreshCw } from "lucide-react";

interface Problem {
  id: number;
  titleKo: string;
  titleEn: string | null;
  level: number;
  acceptedUserCount: number;
  averageTries: number;
  tags: {
    tag: {
      key: string;
      nameKo: string;
      nameEn: string | null;
      isMeta: boolean;
    };
  }[];
  classes?: {
    class: {
      id: number;
    };
  }[];
}

interface Tag {
  key: string;
  nameKo: string;
  nameEn: string | null;
}

interface Source {
  id: number;
  sourceName: string;
  fullName: string;
  children: Source[];
  contests?: {
    id: number;
    name: string;
  }[];
  type: 'source';
}

interface SelectedItem {
  id: number;
  type: 'source' | 'contest';
}

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const delta = 2; // 현재 페이지 기준 양쪽에 보여줄 페이지 수
  const range = [];
  const rangeWithDots = [];

  // 시작과 끝 페이지는 항상 표시
  range.push(1);
  
  for (let i = currentPage - delta; i <= currentPage + delta; i++) {
    if (i > 1 && i < totalPages) {
      range.push(i);
    }
  }
  
  range.push(totalPages);

  let l;
  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  }

  return rangeWithDots;
};

function ProblemsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 초기 상태를 URL 파라미터에서 가져오기
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [matchType, setMatchType] = useState<'exact' | 'include'>(
    (searchParams.get('matchType') as 'exact' | 'include') || 'include'
  );
  const [minLevel, setMinLevel] = useState<number | undefined>(
    searchParams.get('minLevel') ? Number(searchParams.get('minLevel')) : undefined
  );
  const [maxLevel, setMaxLevel] = useState<number | undefined>(
    searchParams.get('maxLevel') ? Number(searchParams.get('maxLevel')) : undefined
  );
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sortField, setSortField] = useState<string>(searchParams.get('sortField') || 'id');
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get('sortOrder') || 'asc');
  const [selectedClasses, setSelectedClasses] = useState<number[]>(
    searchParams.get('classes')?.split(',').map(Number).filter(Boolean) || []
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>(
    searchParams.get('sources')?.split(',').map(Number).filter(Boolean) || []
  );
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [classMatchType, setClassMatchType] = useState<'and' | 'or'>(
    (searchParams.get('classMatchType') as 'and' | 'or') || 'or'
  );
  const [sourceMatchType, setSourceMatchType] = useState<'and' | 'or'>(
    (searchParams.get('sourceMatchType') as 'and' | 'or') || 'or'
  );

  // URL 업데이트 함수
  const updateURL = (params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });

    router.push(`/problems?${newParams.toString()}`);
  };

  // 검색 조건이 변경될 때 URL 업데이트
  const handleSearch = () => {
    // selectedItems에서 contest 타입의 id만 추출
    const selectedContestIds = selectedItems
      .filter(item => item.type === 'contest')
      .map(item => item.id);

    const params = {
      tags: selectedTags.length ? selectedTags.join(',') : undefined,
      matchType,
      minLevel: minLevel?.toString(),
      maxLevel: maxLevel?.toString(),
      keyword: keyword || undefined,
      sortField,
      sortOrder,
      classes: selectedClasses.length ? selectedClasses.join(',') : undefined,
      classMatchType,
      sources: selectedContestIds.length ? selectedContestIds.join(',') : undefined,
      sourceMatchType,
      page: '1',
    };

    updateURL(params);
    fetchProblems();
    setPage(1);
  };

  // 페이지 변경 시 URL 업데이트
  useEffect(() => {
    const params = {
      tags: selectedTags.length ? selectedTags.join(',') : undefined,
      matchType,
      minLevel: minLevel?.toString(),
      maxLevel: maxLevel?.toString(),
      keyword: keyword || undefined,
      sortField,
      sortOrder,
      classes: selectedClasses.length ? selectedClasses.join(',') : undefined,
      sources: selectedSourceIds.length ? selectedSourceIds.join(',') : undefined,
      page: page.toString(),
    };

    updateURL(params);
  }, [page]);

  // URL 파라미터가 변경될 때 검색 실행
  useEffect(() => {
    fetchProblems();
  }, [searchParams]);

  const fetchProblems = async () => {
    try {
      const response = await fetch(`/api/problems/search?${searchParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setProblems(data.data.problems);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('문제 로딩 중 오류:', error);
    }
  };

  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [expandedProblemIds, setExpandedProblemIds] = useState<number[]>([]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      if (data.success) {
        setAvailableTags(data.data.tags);
      }
    } catch (error) {
      console.error('태그 로딩 중 오류:', error);
    }
  };

  const handleSortFieldChange = (value: string) => {
    setSortField(value);
  };

  const handleSortOrderChange = (value: string | undefined) => {
    if (value) setSortOrder(value);
  };

  const handleTagToggle = (tagKey: string) => {
    setSelectedTags(prev => 
      prev.includes(tagKey)
        ? prev.filter(t => t !== tagKey)
        : [...prev, tagKey]
    );
  };

  const handleClassToggle = (classNum: number) => {
    setSelectedClasses(prev => 
      prev.includes(classNum)
        ? prev.filter(c => c !== classNum)
        : [...prev, classNum]
    );
  };

  const toggleTags = (problemId: number) => {
    setExpandedProblemIds(prev => 
      prev.includes(problemId)
        ? prev.filter(id => id !== problemId)
        : [...prev, problemId]
    );
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();
      if (data.success) {
        setSources(data.data.sources);
      }
    } catch (error) {
      console.error('출처 로딩 중 오류:', error);
    }
  };

  const handleSelect = (items: SelectedItem[], shouldSelect: boolean) => {
    if (shouldSelect) {
      setSelectedItems(prev => [...prev, ...items]);
    } else {
      setSelectedItems(prev => 
        prev.filter(item => 
          !items.some(newItem => 
            newItem.id === item.id && newItem.type === item.type
          )
        )
      );
    }
  };

  const resetQuery = () => {
    setSelectedTags([]);
    setMatchType('include');
    setMinLevel(undefined);
    setMaxLevel(undefined);
    setKeyword('');
    setSortField('id');
    setSortOrder('asc');
    setSelectedClasses([]);
    setSelectedSourceIds([]);
    setPage(1);

    // URL 초기화
    updateURL({});
    // 검색 실행
    fetchProblems();
  };

  return (
    <div className="container py-6 px-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">문제 검색하기</h1>
      </div>
      
      {/* 태그 선택 */}
      <div className="mb-4">
        <div className="text-sm mb-2">선택된 태그:</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map(tagKey => {
            const tag = availableTags.find(t => t.key === tagKey);
            return tag ? (
              <Badge
                key={tag.key}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag.key)}
              >
                {tag.nameKo} ×
              </Badge>
            ) : null;
          })}
        </div>
        
        <div className="mb-4">
          <ToggleGroup
            type="single"
            value={matchType}
            onValueChange={(value) => value && setMatchType(value as 'exact' | 'include')}
            className="justify-start"
          >
            <ToggleGroupItem value="exact">정확히 일치</ToggleGroupItem>
            <ToggleGroupItem value="include">포함</ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="text-sm mb-2">사용 가능한 태그:</div>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <Button
              key={tag.key}
              variant={selectedTags.includes(tag.key) ? "secondary" : "outline"}
              size="sm"
              className="h-7"
              onClick={() => handleTagToggle(tag.key)}
            >
              {tag.nameKo}
            </Button>
          ))}
        </div>
      </div>

      {/* 클래스 선택 */}
      <div className="mb-4">
        <div className="text-sm mb-2">CLASS 선택:</div>
        <div className="flex gap-4 mb-2">
          <ToggleGroup type="single" value={classMatchType} onValueChange={(value) => value && setClassMatchType(value as 'and' | 'or')}>
            <ToggleGroupItem value="and">AND</ToggleGroupItem>
            <ToggleGroupItem value="or">OR</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Button
              key={i + 1}
              variant={selectedClasses.includes(i + 1) ? "secondary" : "outline"}
              size="sm"
              className="h-7"
              onClick={() => handleClassToggle(i + 1)}
            >
              CLASS {i + 1}
            </Button>
          ))}
        </div>
      </div>

      {/* 난이도 범위 선택 */}
      <div className="mb-4 flex gap-4 items-center">
        <Select value={minLevel?.toString()} onValueChange={(v) => setMinLevel(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="최소 레벨" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Unrated</SelectItem>
            {Array.from({ length: 30 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {getLevelName(i + 1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>~</span>
        <Select value={maxLevel?.toString()} onValueChange={(v) => setMaxLevel(Number(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="최대 레벨" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Unrated</SelectItem>
            {Array.from({ length: 30 }, (_, i) => (
              <SelectItem key={i + 1} value={(i + 1).toString()}>
                {getLevelName(i + 1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* 출처 선택 */}
      <div className="mb-4">
        <div className="text-sm mb-2">출처 선택:</div>
        <div className="flex gap-4 mb-2">
          <ToggleGroup type="single" value={sourceMatchType} onValueChange={(value) => value && setSourceMatchType(value as 'and' | 'or')}>
            <ToggleGroupItem value="and">AND</ToggleGroupItem>
            <ToggleGroupItem value="or">OR</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <SourceSelector
          sources={sources}
          selectedItems={selectedItems}
          onSelect={handleSelect}
        />
      </div>

      {/* 문제 제목 검색 */}
      <div className="mb-4">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="문제 제목 검색"
          className="w-[300px]"
        />
      </div>

      {/* 정렬 옵션 */}
      <div className="mb-4 flex gap-4">
        <Select value={sortField} onValueChange={handleSortFieldChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">문제 번호</SelectItem>
            <SelectItem value="level">난이도</SelectItem>
            <SelectItem value="acceptedUserCount">푼 사람 수</SelectItem>
            <SelectItem value="averageTries">평균 시도 횟수</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup type="single" value={sortOrder} onValueChange={handleSortOrderChange}>
          <ToggleGroupItem value="asc">오름차순</ToggleGroupItem>
          <ToggleGroupItem value="desc">내림차순</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 검색 버튼 */}
      <div className="mb-4 flex justify-center gap-2">
        <Button 
          variant="outline"
          onClick={resetQuery}
          className="w-[100px] gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          초기화
        </Button>
        <Button 
          onClick={handleSearch}
          className="w-[100px]"
        >
          검색
        </Button>
      </div>

      {/* 문제 목록 */}
      <div className="space-y-4">
        {problems.map(problem => (
          <div key={problem.id} className="p-4 border rounded-lg shadow-sm">
            <h3 className="text-lg font-bold">
              <a 
                href={`https://www.acmicpc.net/problem/${problem.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 transition-colors"
              >
                {problem.id}. {problem.titleKo} {problem.titleEn && `(${problem.titleEn})`}
              </a>
            </h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <span className="mr-4">레벨: {getLevelName(problem.level)}</span>
              <span className="mr-4">푼 사람: {problem.acceptedUserCount}명</span>
              <span className="mr-4">
                평균 시도: {problem.averageTries?.toFixed(2)}회
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTags(problem.id)}
                className="text-sm"
              >
                {expandedProblemIds.includes(problem.id) ? '태그 숨기기' : '태그 표시하기'}
              </Button>
              {expandedProblemIds.includes(problem.id) && (
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map(({ tag }) => (
                    <Button
                      key={tag.key}
                      variant="secondary"
                      size="sm"
                      className="h-7"
                    >
                      {tag.nameKo}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {problem.classes?.map(({ class: cls }) => (
                  <Badge
                    key={cls.id}
                    variant="outline"
                    className="bg-blue-50"
                  >
                    CLASS {cls.id}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              aria-disabled={page === 1}
            />
          </PaginationItem>
          
          {getPageNumbers(page, Math.ceil(total / limit)).map((pageNum, i) => (
            <PaginationItem key={i}>
              {pageNum === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={page === pageNum}
                  onClick={() => setPage(Number(pageNum))}
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
              aria-disabled={page === Math.ceil(total / limit)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export default function ProblemsClientPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProblemsPageContent />
    </Suspense>
  );
} 