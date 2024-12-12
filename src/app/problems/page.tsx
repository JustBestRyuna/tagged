'use client';

import { useState, useEffect } from 'react';
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

export default function ProblemsPage() {  
  const [searchParams, setSearchParams] = useState({
    tags: [] as string[],
    matchType: 'include' as 'exact' | 'include',
    minLevel: undefined as number | undefined,
    maxLevel: undefined as number | undefined,
    keyword: '',
    sortField: 'level',
    sortOrder: 'asc',
    classes: [] as number[]
  });
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchType, setMatchType] = useState<'exact' | 'include'>('include');
  const [minLevel, setMinLevel] = useState<number | undefined>();
  const [maxLevel, setMaxLevel] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [expandedProblemIds, setExpandedProblemIds] = useState<number[]>([]);

  useEffect(() => {
    fetchProblems();
  }, [page, searchParams]);

  useEffect(() => {
    fetchTags();
  }, []);

  const handleSearch = () => {
    setSearchParams({
      tags: selectedTags,
      matchType,
      minLevel,
      maxLevel,
      keyword,
      sortField,
      sortOrder,
      classes: selectedClasses
    });
    setPage(1);
  };

  const fetchProblems = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedTags.length && { tags: selectedTags.join(',') }),
        matchType,
        ...(minLevel !== undefined && { minLevel: minLevel.toString() }),
        ...(maxLevel !== undefined && { maxLevel: maxLevel.toString() }),
        ...(keyword && { keyword }),
        ...(selectedClasses.length > 0 && { classes: selectedClasses.join(',') }),
        page: page.toString(),
        limit: limit.toString(),
        sortField,
        sortOrder
      });

      console.log('검색 파라미터:', params.toString());
      
      const response = await fetch(`/api/problems/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProblems(data.data.problems);
        setTotal(data.data.pagination.total);
      }
    } catch (error) {
      console.error('문제 로딩 중 오류:', error);
    }
  };

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

  return (
    <main className="p-4">
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
      <div className="mb-4 flex justify-center">
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
    </main>
  );
} 