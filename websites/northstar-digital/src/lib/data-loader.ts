import fs from 'fs/promises';
import path from 'path';

const PROJECT_DIR = process.cwd();
const DRAFT_DIR = path.join(PROJECT_DIR, 'data');
const PUBLISHED_DIR = path.join(PROJECT_DIR, 'published');

// --- DRAFT LOADERS (For Preview Only) ---

export async function readDraftPageData(pageName: string) {
  const filePath = path.join(DRAFT_DIR, 'pages', `${pageName}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

export async function readDraftSeoData(pageName: string) {
  const filePath = path.join(DRAFT_DIR, 'seo', `${pageName}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

export async function safeReadDraftPageData(pageName: string) {
  try {
    return await readDraftPageData(pageName);
  } catch (error) {
    console.error(`Failed to load DRAFT page data for ${pageName}`, error);
    return { sections: [] };
  }
}

// --- PUBLISHED LOADERS (For Production Only) ---

async function getActivePublishedVersion(): Promise<string> {
  const metaPath = path.join(PROJECT_DIR, '.published_version.json');
  try {
    const data = await fs.readFile(metaPath, 'utf8');
    return JSON.parse(data).version.toString();
  } catch {
    throw new Error("No published version found. The site has not been published yet.");
  }
}

export async function readPublishedPageData(pageName: string) {
  const version = await getActivePublishedVersion();
  const filePath = path.join(PUBLISHED_DIR, `v${version}`, 'pages', `${pageName}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

export async function safeReadPublishedPageData(pageName: string) {
  try {
    return await readPublishedPageData(pageName);
  } catch (error) {
    console.error(`Failed to load PUBLISHED page data for ${pageName}`, error);
    return { sections: [] };
  }
}
