import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Emploid | Listing Trust Score job search',
  description:
    'Over 40% of online job postings are ghost jobs. Emploid scans thousands of postings to filter out the fakes, so you only spend time on real opportunities.',
  icons: { icon: '/images/logoicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/images/logoicon.svg" />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/colors_and_type.css" />
        <link rel="stylesheet" href="/tracker.css" />
        {/* Set data-page on body synchronously from URL before paint — main.js reads this */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var p = window.location.pathname;
  var id = p === '/browse' ? 'jobs' : p === '/tracker' ? 'tracker' : p === '/about' ? 'about' : p === '/blog' ? 'blog' : 'home';
  document.documentElement.setAttribute('data-init-page', id);
  document.addEventListener('DOMContentLoaded', function() {
    document.body.setAttribute('data-page', id);
  });
})();
        `.trim() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
