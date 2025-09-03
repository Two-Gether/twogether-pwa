declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  type WithPWAOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    [key: string]: unknown;
  };

  type WithPWA = (options?: WithPWAOptions) => (config: NextConfig) => NextConfig;

  const withPWA: WithPWA;
  export default withPWA;
}


