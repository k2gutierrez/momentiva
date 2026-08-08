import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // webpack: (config) => {
  //   config.externals = [...config.externals, { canvas: 'canvas' }];
  //   return config;
  // },
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
