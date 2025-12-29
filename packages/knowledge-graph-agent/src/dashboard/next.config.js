/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,

  // Experimental features for App Router
  experimental: {
    // Enable parallel routes
    parallelRoutes: true,
  },

  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  },

  // Webpack configuration for cytoscape
  webpack: (config) => {
    // Handle cytoscape and related packages
    config.externals = config.externals || [];

    return config;
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // TypeScript configuration
  typescript: {
    // Allow build with type errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ESLint configuration
  eslint: {
    // Allow build with lint errors in development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
