import Link from 'next/link';
import Image from 'next/image';

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
        
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300">
          태그 기반 BOJ 문제 검색 서비스
        </p>

        <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
          <Link 
            href="/problems"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            문제 검색하기
          </Link>
          <a 
            href="https://github.com/JustBestRyuna/tagged"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold text-lg"
          >
            GitHub
          </a>
        </div>

        {/* Feature Section */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">태그 기반 검색</h2>
            <p className="text-gray-600 dark:text-gray-300">
              원하는 알고리즘 태그 조합으로 문제를 찾아보세요
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">정확한 매칭</h2>
            <p className="text-gray-600 dark:text-gray-300">
              정확히 일치하는 태그 또는 포함된 태그로 검색하세요
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">매일 업데이트</h2>
            <p className="text-gray-600 dark:text-gray-300">
              매일 오전 6시에 최신 문제 정보로 업데이트됩니다
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500">
        <p>© 2024 Tagged. All rights reserved.</p>
      </footer>
    </div>
  );
}
