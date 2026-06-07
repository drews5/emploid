import { notFound } from 'next/navigation';
import LegacyPage from '../legacy-page';

const LEGACY_PAGES = ['search', 'browse', 'tracker', 'about', 'blog', 'privacy', 'terms'];

export function generateStaticParams() {
  return LEGACY_PAGES.map((page) => ({ page }));
}

export default function Page({ params }: { params: { page: string } }) {
  if (!LEGACY_PAGES.includes(params.page)) {
    notFound();
  }

  return <LegacyPage />;
}
