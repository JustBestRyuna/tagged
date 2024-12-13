![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/11ab4881-bb67-4bc2-a0d4-6f94740ca20e/c76591f9-c677-4057-a471-11a1563a903a/image.png)

## 뭐 하는 사이트인가요?

Tagged는 백준 온라인 저지(BOJ)의 문제를 더 쉽게 찾을 수 있게 도와주는 검색 서비스입니다. 다음과 같은 기능을 제공합니다:

1. 태그 기반 검색: 원하는 알고리즘 태그 조합으로 문제를 찾을 수 있습니다.
2. 정확한 매칭: 태그를 정확히 일치하거나 포함된 문제를 검색할 수 있습니다.
3. CLASS 기반 검색: BOJ의 CLASS 레벨별로 문제를 필터링할 수 있습니다.
4. 난이도 범위 검색: [solved.ac](http://solved.ac/) 기준의 난이도 범위로 문제를 찾을 수 있습니다.
5. 출처 검색: 다양한 출처의 문제로 문제를 필터링할 수 있습니다.
6. 문제 제보: 태그나 난이도가 변경된 문제를 제보하면 즉시 정보가 업데이트됩니다.

## 어떻게 만들었나요?

기술 스택을 간단히 설명하자면:

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **데이터베이스**: Prisma ORM
- **배포**: Vercel
- **API**: [solved.ac](http://solved.ac/) API v3

주요 기술적 특징:

1. Server/Client Components 분리로 최적화된 성능
2. 자동 크롤링 시스템으로 데이터 최신성 유지
3. 사용자 친화적인 UI/UX (토스트 메시지, 페이지네이션 등)
4. 반응형 디자인으로 모바일 지원
5. 타입 안정성을 위한 TypeScript 사용
