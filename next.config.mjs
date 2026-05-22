/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the app router entrypoint on /, and let the legacy static site handle
  // the rest of the campaign routes via public/index.html.
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  async rewrites() {
    return [
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
      {
        source: '/blog',
        destination: '/index.html',
      },
    ];
  },
};

export default nextConfig;
