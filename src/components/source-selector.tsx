'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Source {
  id: number;
  sourceName: string;
  fullName: string;
  children: Source[];
  contests?: {
    id: number;
    name: string;
  }[];
  parentId?: number | null;
}

interface SourceSelectorProps {
  sources: Source[];
  selectedSourceIds: number[];
  onSelect: (sourceIds: number[], shouldSelect: boolean) => void;
}

export function SourceSelector({ sources, selectedSourceIds, onSelect }: SourceSelectorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  
  const toggleNode = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSourceSelect = (source: Source) => {
    const childIds = getAllChildIds(source);
    const allIds = [source.id, ...childIds];
    const isCurrentlySelected = selectedSourceIds.includes(source.id);
    
    onSelect(allIds, !isCurrentlySelected);
  };

  const renderSourceNode = (source: Source, depth = 0) => {
    const hasChildren = Boolean(source.children?.length || source.contests?.length);
    const isExpanded = expandedNodes.has(source.id);
    const allChildrenSelected = hasChildren && areAllChildrenSelected(source, selectedSourceIds);
    const isSelected = selectedSourceIds.includes(source.id) || allChildrenSelected;

    return (
      <div key={source.id} className="w-full">
        <div 
          className={`
            flex items-center gap-1.5 py-0.5 px-1.5 rounded-md text-sm
            ${isSelected ? 'bg-secondary' : 'hover:bg-secondary/50'}
          `}
          style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        >
          <div className="flex items-center gap-1.5 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-5 w-5"
                onClick={() => toggleNode(source.id)}
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <div className="w-5" />
            )}
            <Checkbox 
              className="h-4 w-4"
              checked={isSelected}
              onCheckedChange={() => handleSourceSelect(source)}
            />
            <span>{source.sourceName}</span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="ml-1.5">
            {source.children?.map(child => renderSourceNode(child, depth + 1))}
            {source.contests?.map(contest => (
              <div
                key={contest.id}
                className={`
                  flex items-center gap-1.5 py-0.5 px-1.5 rounded-md text-sm
                  ${selectedSourceIds.includes(contest.id) ? 'bg-secondary' : 'hover:bg-secondary/50'}
                `}
                style={{ paddingLeft: `${(depth + 1) * 1.25 + 0.5}rem` }}
              >
                <div className="w-5" />
                <Checkbox 
                  className="h-4 w-4"
                  checked={selectedSourceIds.includes(contest.id)}
                  onCheckedChange={(checked) => onSelect([contest.id], checked as boolean)}
                />
                <span>{contest.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full border rounded-lg p-1.5 space-y-0.5 max-h-[300px] overflow-y-auto">
      {sources.map(source => renderSourceNode(source))}
    </div>
  );
}

const getAllChildIds = (source: Source): number[] => {
  let ids: number[] = [];
  ids.push(source.id);
  
  // 하위 출처들 처리
  if (source.children) {
    for (const child of source.children) {
      const childIds = getAllChildIds(child);
      ids = [...ids, ...childIds];
    }
  }
  
  // 현재 출처의 대회들
  if (source.contests) {
    ids = [...ids, ...source.contests.map(contest => contest.id)];
  }
  
  return ids;
};

const areAllChildrenSelected = (source: Source, selectedSourceIds: number[]): boolean => {
  const childIds = getAllChildIds(source).filter(id => id !== source.id);
  return childIds.length > 0 && childIds.every(id => selectedSourceIds.includes(id));
}; 