import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // webpack: (config) => {
  //   config.externals = [...config.externals, { canvas: 'canvas' }];
  //   return config;
  // },
  // Le decimos a Next.js que acepte peticiones de hasta 10MB en Server Actions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mvsabrcqhpwenamlqcux.supabase.co',
        port: '',
      }
    ]
  },
  output: "standalone",
};

export default nextConfig;
