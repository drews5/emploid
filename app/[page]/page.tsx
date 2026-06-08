import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LegacyPage from '../legacy-page';
import { PAGE_METADATA, type LegacyPageId } from '../site';

const LEGACY_PAGES: LegacyPageId[] = ['search', 'browse', 'tracker', 'about', 'blog', 'privacy', 'terms'];

export function generateStaticParams() {
  return LEGACY_PAGES.map((page) => ({ page }));
}

export function generateMetadata({ params }: { params: { page: string } }): Metadata {
  if (!LEGACY_PAGES.includes(params.page as LegacyPageId)) {
    return {};
  }

  const page = PAGE_METADATA[params.page as LegacyPageId];
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.path,
    },
    twitter: {
      card: 'summary',
      title: page.title,
      description: page.description,
    },
  };
}

export default function Page({ params }: { params: { page: string } }) {
  if (!LEGACY_PAGES.includes(params.page as LegacyPageId)) {
    notFound();
  }

  return <LegacyPage />;
}
