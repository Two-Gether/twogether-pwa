import type { NextConfig } from "next";

// next-pwa가 있을 때만 적용되도록 안전하게 래핑
let withPWA: (cfg: NextConfig) => NextConfig = (cfg) => cfg;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pwa = require('next-pwa');
  withPWA = pwa({
    dest: 'public',
    disable: false,
    register: true,
    skipWaiting: true,
  });
} catch {
  // next-pwa 미설치 시 그대로 진행
}

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/place/photo**',
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
};

export default withPWA(nextConfig);
