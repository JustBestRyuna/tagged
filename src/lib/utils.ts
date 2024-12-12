import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLevelName(level: number): string {
  if (level === 0) return 'Unrated';
  
  const tier = Math.floor((level - 1) / 5);
  const grade = 5 - ((level - 1) % 5);
  
  const tiers = [
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Diamond',
    'Ruby'
  ];

  return `${tiers[tier]} ${grade}`;
}
