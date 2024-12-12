'use client';

import { useState, useEffect } from 'react';

interface Tag {
  key: string;
  nameKo: string;
  nameEn: string | null;
  isMeta: boolean;
  problemCount: number;
}

interface Problem {
  id: number;
  titleKo: string;
  titleEn: string | null;
  level: number;
  tags: {
    tag: Tag;
  }[];
}

export default function ProblemsPage() {  
  // 상태 관리
  const [tags, setTags] = useState<Tag[]>([]); // 사용 가능한 모든 태그 목록
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchType, setMatchType] = useState<'exact' | 'include'>('include');
  const [level, setLevel] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);

  // 태그 목록 가져오기
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        const { data } = await response.json();
        setTags(data.tags);
      } catch (error) {
        console.error('태그 로딩 중 오류:', error);
      }
    };
    fetchTags();
  }, []);

  // 검색 실행
  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(selectedTags.length && { tags: selectedTags.join(',') }),
        ...(level && { level }),
        ...(keyword && { keyword }),
        matchType
      });

      const response = await fetch(`/api/problems/search?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setProblems(data.data.problems);
      }
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 검색 필터 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        {/* 태그 선택 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">태그 선택</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.key}
                onClick={() => {
                  setSelectedTags(prev => 
                    prev.includes(tag.key)
                      ? prev.filter(t => t !== tag.key)
                      : [...prev, tag.key]
                  );
                }}
                className={`px-3 py-1 rounded-full text-sm
                  ${selectedTags.includes(tag.key)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700'
                  }`}
              >
                {tag.nameKo}
              </button>
            ))}
          </div>
        </div>

        {/* 매칭 타입 선택 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">매칭 타입</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="include"
                checked={matchType === 'include'}
                onChange={(e) => setMatchType(e.target.value as 'include')}
                className="mr-2"
              />
              포함
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="exact"
                checked={matchType === 'exact'}
                onChange={(e) => setMatchType(e.target.value as 'exact')}
                className="mr-2"
              />
              정확히 일치
            </label>
          </div>
        </div>

        {/* 난이도 선택 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">난이도</h3>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full max-w-xs px-4 py-2 rounded-lg border dark:bg-gray-700"
          >
            <option value="">전체</option>
            {[...Array(30)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                레벨 {i + 1}
              </option>
            ))}
          </select>
        </div>

        {/* 키워드 검색 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">키워드 검색</h3>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="문제 제목 검색"
            className="w-full max-w-md px-4 py-2 rounded-lg border dark:bg-gray-700"
          />
        </div>

        {/* 검색 버튼 */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-lg
                   hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 검색 결과 목록 */}
      <div className="space-y-4">
        {problems.map(problem => (
          <div
            key={problem.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
          >
            <h3 className="text-lg font-semibold mb-2">
              [{problem.id}] {problem.titleKo}
            </h3>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                레벨 {problem.level}
              </span>
              {problem.tags.map(({ tag }) => (
                <span
                  key={tag.key}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded"
                >
                  {tag.nameKo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 