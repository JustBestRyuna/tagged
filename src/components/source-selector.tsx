'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Source {
  id: number;
  sourceName: string;
  fullName: string;
  children: Source[];
  contests?: {
    id: number;
    name: string;
  }[];
}

interface SourceSelectorProps {
  sources: Source[];
  onSelect: (sourceId: number) => void;
  selectedSourceIds: number[];
}

export function SourceSelector({ sources, onSelect, selectedSourceIds }: SourceSelectorProps) {
  const [expandedNodes, setExpandedNodes] = useState<number[]>([]);

  const toggleNode = (sourceId: number) => {
    setExpandedNodes(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const renderSourceNode = (source: Source, depth: number = 0) => {
    const isExpanded = expandedNodes.includes(source.id);
    const isSelected = selectedSourceIds.includes(source.id);
    const hasChildren = (source.children?.length ?? 0) > 0 || (source.contests?.length ?? 0) > 0;

    return (
      <div key={source.id} className="w-full">
        <div 
          className={`
            flex items-center gap-2 py-1 px-2 rounded-md
            ${isSelected ? 'bg-secondary' : 'hover:bg-secondary/50'}
          `}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(source.id);
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          <button
            className="flex-1 text-left"
            onClick={() => onSelect(source.id)}
          >
            {source.sourceName}
          </button>
        </div>

        {isExpanded && (
          <div className="ml-2">
            {source.children?.map(child => renderSourceNode(child, depth + 1))}
            {source.contests?.map(contest => (
              <div
                key={contest.id}
                className={`
                  py-1 px-2 rounded-md cursor-pointer
                  ${selectedSourceIds.includes(contest.id) ? 'bg-secondary' : 'hover:bg-secondary/50'}
                `}
                style={{ paddingLeft: `${(depth + 1) * 1.5 + 0.5}rem` }}
                onClick={() => onSelect(contest.id)}
              >
                {contest.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full border rounded-lg p-2 space-y-1 max-h-[400px] overflow-y-auto">
      {sources.map(source => renderSourceNode(source))}
    </div>
  );
} 