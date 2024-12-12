import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tagged - 백준 문제 태그 검색',
  description: '백준 온라인 저지의 문제를 태그, 난이도, CLASS 등 다양한 조건으로 검색할 수 있는 서비스입니다.',
  keywords: '백준, BOJ, 알고리즘, 문제 풀이, 태그 검색, CLASS, 난이도',
  openGraph: {
    title: 'Tagged - 백준 문제 태그 검색',
    description: '백준 온라인 저지의 문제를 태그, 난이도, CLASS 등 다양한 조건으로 검색할 수 있는 서비스입니다.',
    type: 'website',
  }
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <main className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Tagged
        </h1>

        {/* Hero Image */}
        <div className="relative w-full h-64 sm:h-80">
          <Image
            src="/favicon.ico"
            alt="Tagged 서비스 미리보기"
            fill
            priority
            className="object-contain"
          />
        </div>
        
        <p className="text-xl sm:text-2xl text-muted-foreground">
          태그 기반 BOJ 문제 검색 서비스
        </p>

        <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
          <Button asChild size="lg" className="text-lg">
            <Link href="/problems">
              문제 검색하기
            </Link>
          </Button>
          <Button asChild size="lg" className="text-lg">
            <Link href="/report">
              문제 제보하기
            </Link>
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="lg"
            className="text-lg"
          >
            <a 
              href="https://github.com/JustBestRyuna/tagged"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
        </div>

        {/* Feature Section */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>태그 기반 검색</CardTitle>
              <CardDescription>
                원하는 알고리즘 태그 조합으로 문제를 찾아보세요
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>정확한 매칭</CardTitle>
              <CardDescription>
                정확히 일치하는 태그 또는 포함된 태그로 검색하세요
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>매일 업데이트</CardTitle>
              <CardDescription>
                매일 오전 6시에 최신 문제 정보로 업데이트됩니다
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-muted-foreground">
        <p>© 2024 Tagged. All rights reserved.</p>
      </footer>
    </div>
  );
}
