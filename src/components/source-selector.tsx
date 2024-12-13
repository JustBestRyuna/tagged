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
  type: 'source';
}

interface SelectedItem {
  id: number;
  type: 'source' | 'contest';
}

interface SourceSelectorProps {
  sources: Source[];
  selectedItems: Array<{id: number, type: 'source' | 'contest'}>;
  onSelect: (items: Array<{id: number, type: 'source' | 'contest'}>, shouldSelect: boolean) => void;
}

export function SourceSelector({ sources, selectedItems, onSelect }: SourceSelectorProps) {
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
    const childItems = getAllChildIds(source);
    const isCurrentlySelected = (selectedItems || []).some(
      item => item.id === source.id && item.type === 'source'
    );
    
    onSelect(childItems, !isCurrentlySelected);
  };

  const renderSourceNode = (source: Source, depth = 0) => {
    const hasChildren = Boolean(source.children?.length || source.contests?.length);
    const isExpanded = expandedNodes.has(source.id);
    const allChildrenSelected = hasChildren && areAllChildrenSelected(source, selectedItems || []);
    const isSelected = (selectedItems || []).some(
      item => item.id === source.id && item.type === 'source'
    ) || allChildrenSelected;

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
                  ${selectedItems.some(
                    item => item.id === contest.id && item.type === 'contest'
                  ) ? 'bg-secondary' : 'hover:bg-secondary/50'}
                `}
                style={{ paddingLeft: `${(depth + 1) * 1.25 + 0.5}rem` }}
              >
                <div className="w-5" />
                <Checkbox 
                  className="h-4 w-4"
                  checked={selectedItems.some(
                    item => item.id === contest.id && item.type === 'contest'
                  )}
                  onCheckedChange={(checked) => 
                    onSelect([{ id: contest.id, type: 'contest' }], checked as boolean)
                  }
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

const getAllChildIds = (source: Source): SelectedItem[] => {
  let items: SelectedItem[] = [];
  
  // 출처는 'source' 타입으로
  items.push({ id: source.id, type: 'source' });
  
  if (source.children) {
    for (const child of source.children) {
      const childItems = getAllChildIds(child);
      items = [...items, ...childItems];
    }
  }
  
  // 대회는 'contest' 타입으로
  if (source.contests) {
    items = [...items, ...source.contests.map(contest => ({ 
      id: contest.id, 
      type: 'contest' as const 
    }))];
  }
  
  return items;
};

const areAllChildrenSelected = (
  source: Source, 
  selectedItems: SelectedItem[] = []
): boolean => {
  const childItems = getAllChildIds(source).filter(item => 
    !(item.id === source.id && item.type === 'source')
  );
  return childItems.length > 0 && childItems.every(item => 
    selectedItems.some(selected => selected.id === item.id && selected.type === item.type)
  );
}; 