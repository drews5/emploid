import { readFile } from 'node:fs/promises';
import path from 'node:path';
import TrackerClientMount from './components/TrackerClientMount';

function extractBodyContents(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!match) {
    throw new Error('Could not find the body contents in public/index.html');
  }

  return match[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').trim();
}

export default async function LegacyPage() {
  const htmlPath = path.join(process.cwd(), 'public', 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  const bodyContents = extractBodyContents(html);

  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyContents }} />
      <TrackerClientMount />
    </>
  );
}
