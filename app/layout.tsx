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
        <link rel="stylesheet" href="/browse.css" />
        <script
          src="https://unpkg.com/react@18.3.1/umd/react.development.js"
          integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L"
          crossOrigin="anonymous"
        />
        <script
          src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"
          integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm"
          crossOrigin="anonymous"
        />
        <script
          src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"
          integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y"
          crossOrigin="anonymous"
        />
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
      <body>
        {children}
        <script src="/main.js" />
        <script src="/tracker-data.js" />
        <script type="text/babel" src="/tracker-combined.jsx" />
      </body>
    </html>
  );
}
