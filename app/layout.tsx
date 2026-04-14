export const metadata = {
  title: 'Emploid - Listing Trust Score job search',
  description: 'Search jobs with clearer Listing Trust Score signals, direct company links, and real hiring context.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
