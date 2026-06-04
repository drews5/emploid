import type { Metadata } from 'next';
import Script from 'next/script';

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
        <link rel="stylesheet" href="/browse.css" />
        <Script id="emploid-init-page" strategy="beforeInteractive">{`
(function(){
  var p = window.location.pathname;
  var id = p === '/browse' ? 'jobs' : p === '/tracker' ? 'tracker' : p === '/about' ? 'about' : p === '/blog' ? 'blog' : 'home';
  document.documentElement.setAttribute('data-init-page', id);
  document.addEventListener('DOMContentLoaded', function() {
    document.body.setAttribute('data-page', id);
  });
})();
        `.trim()}</Script>
      </head>
      <body>
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Script src="/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
