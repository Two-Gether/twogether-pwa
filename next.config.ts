import type { NextConfig } from "next";

// next-pwa 있을 때만 적용
let withPWA: (cfg: NextConfig) => NextConfig = (cfg) => cfg;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pwa = require("next-pwa");
  withPWA = pwa({
    dest: "public",
    disable: false,
    register: true,
    skipWaiting: true,
  });
} catch {
  // next-pwa 미설치 시 그대로 진행
}

const nextConfig: NextConfig = {
  reactStrictMode: true, // Vercel 배포 시 권장
  output: "export",
  eslint: {
    // 빌드 시 ESLint 오류로 실패하지 않도록 (개발 중 any 등 빠른 우회)
    ignoreDuringBuilds: true,
  },
  
  // Google Maps JavaScript SDK 로드
  async rewrites() {
    return [
      {
        source: '/api/google-maps/:path*',
        destination: 'https://maps.googleapis.com/maps/api/:path*',
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        port: "",
        pathname: "/maps/api/place/photo**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "twogether-s3-private-bucket.s3.ap-northeast-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      // Korea Tourism Organization (VisitKorea) image hosts
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.visitkorea.or.kr",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "korean.visitkorea.or.kr",
        port: "",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },

  experimental: {
    scrollRestoration: true,
  },
};

export default withPWA(nextConfig);
