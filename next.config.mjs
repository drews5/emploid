/** @type {import('next').NextConfig} */
const nextConfig = {
  // The existing frontend is a static SPA — serve it from /public
  // while the API routes live under /app/api
  reactStrictMode: true,
  experimental: {
    // Allow the app directory API routes
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
      {
        source: '/search',
        destination: '/index.html',
      },
      {
        source: '/browse',
        destination: '/index.html',
      },
      {
        source: '/tracker',
        destination: '/index.html',
      },
      {
        source: '/about',
        destination: '/index.html',
      },
    ]
  },
};

export default nextConfig;
