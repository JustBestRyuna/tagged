import { Metadata } from 'next';
import ReportClientPage from './client-page';

export const metadata: Metadata = {
  title: '문제 제보 - Tagged',
  description: '백준 문제의 태그, 난이도 등이 변경되었을 때 제보해주세요.',
};

export default function ReportPage() {
  return <ReportClientPage />;
} 