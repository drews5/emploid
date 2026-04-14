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
    ]
  },
};

export default nextConfig;
