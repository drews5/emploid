import type { MetadataRoute } from 'next';
import { PAGE_METADATA, SITE_URL } from './site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return Object.values(PAGE_METADATA).map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.path === '/' || page.path === '/browse' ? 'daily' : 'weekly',
    priority: page.path === '/' ? 1 : page.path === '/browse' ? 0.9 : 0.7,
  }));
}
