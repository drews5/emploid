import type { Metadata } from 'next';
import LegacyPage from './legacy-page';
import { PAGE_METADATA } from './site';

export const metadata: Metadata = {
  title: PAGE_METADATA.home.title,
  description: PAGE_METADATA.home.description,
  alternates: {
    canonical: PAGE_METADATA.home.path,
  },
  openGraph: {
    title: PAGE_METADATA.home.title,
    description: PAGE_METADATA.home.description,
    url: PAGE_METADATA.home.path,
  },
};

export default LegacyPage;
