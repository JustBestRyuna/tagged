import { Metadata } from 'next';
import ProblemsClientPage from './client-page';

export const metadata: Metadata = {
  title: '문제 검색 - Tagged',
  description: '태그, 난이도, CLASS 등 다양한 조건으로 백준 문제를 검색해보세요.',
  keywords: '백준 문제 검색, BOJ 검색, 알고리즘 문제, 태그 검색, CLASS 검색',
  openGraph: {
    title: '문제 검색 - Tagged',
    description: '태그, 난이도, CLASS 등 다양한 조건으로 백준 문제를 검색해보세요.',
    type: 'website',
  }
};

export default function ProblemsPage() {
  return <ProblemsClientPage />;
} 