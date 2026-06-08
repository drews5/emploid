import type { Metadata } from 'next';
import Script from 'next/script';
import { PAGE_METADATA, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: PAGE_METADATA.home.title,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: PAGE_METADATA.home.title,
    description: SITE_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: PAGE_METADATA.home.title,
    description: SITE_DESCRIPTION,
  },
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
        <Script id="brand-init-page" strategy="beforeInteractive">{`
(function(){
  var p = window.location.pathname;
  var id = p === '/browse' ? 'jobs' : p === '/tracker' ? 'tracker' : p === '/about' ? 'about' : p === '/blog' ? 'blog' : p === '/privacy' ? 'privacy' : p === '/terms' ? 'terms' : 'home';
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
