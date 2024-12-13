import { Metadata } from 'next';
import ReportClientPage from './client-page';

export const metadata: Metadata = {
  title: '제보하기 - Tagged',
  description: '백준 문제의 태그, 난이도 등이 변경되었을 때나 문제가 추가되었을 때 제보해주세요.',
};

export default function ReportPage() {
  return <ReportClientPage />;
} 