import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 서울 열린데이터 광장
      {
        protocol: "https",
        hostname: "data.seoul.go.kr",
      },
      {
        protocol: "http", 
        hostname: "data.seoul.go.kr",
      },
      // 서울문화포털
      {
        protocol: "https",
        hostname: "culture.seoul.go.kr",
      },
      {
        protocol: "http",
        hostname: "culture.seoul.go.kr", 
      },
      // 서울시 공식 도메인들
      {
        protocol: "https",
        hostname: "www.seoul.go.kr",
      },
      {
        protocol: "http",
        hostname: "www.seoul.go.kr",
      },
      // 서울시 관련 하위 도메인들
      {
        protocol: "https",
        hostname: "*.seoul.go.kr",
      },
      {
        protocol: "http",
        hostname: "*.seoul.go.kr",
      },
      // 카르토 맵 타일 (EventMap에서 사용)
      {
        protocol: "https",
        hostname: "*.basemaps.cartocdn.com",
      },
      // 개발/테스트 환경을 위한 localhost
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "http", 
        hostname: "127.0.0.1",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "8000",
      },
      // 백엔드 API에서 이미지를 proxy하는 경우를 위한 설정
      {
        protocol: "https",
        hostname: "13.50.132.59", // 현재 배포 서버 IP
      },
      {
        protocol: "http",
        hostname: "13.50.132.59",
      },
      // 일반적인 이미지 호스팅 도메인들 (필요시)
      {
        protocol: "https",
        hostname: "*.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      }
    ],
    // 이미지 로딩 실패 시 더 관대한 설정
    unoptimized: process.env.NODE_ENV === 'development',
    // 이미지 최적화 설정
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24, // 24시간 캐시
  },
};

export default nextConfig;
