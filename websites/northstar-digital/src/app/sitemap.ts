import { MetadataRoute } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let version = "1";
  try {
    const publishedVersionPath = path.join(process.cwd(), 'data', '.published_version.json');
    const publishedMeta = await fs.readFile(publishedVersionPath, 'utf8');
    version = JSON.parse(publishedMeta).version.toString();
  } catch (e) {
    return [];
  }

  const seoDir = path.join(process.cwd(), 'published', `v${version}`, 'seo');
  
  let files: string[] = [];
  try {
    files = await fs.readdir(seoDir);
  } catch {
    return [];
  }

  let siteUrl = 'https://northstar-digital.example.com';
  try {
    const settingsPath = path.join(seoDir, 'settings.json');
    const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    if (settings.siteUrl) siteUrl = settings.siteUrl;
    
    // If sitemap is disabled
    if (settings.sitemap && settings.sitemap.enabled === false) {
      return [];
    }
  } catch {}

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const file of files) {
    if (file === 'settings.json') continue;
    if (!file.endsWith('.json')) continue;

    try {
      const pageName = file.replace('.json', '');
      const seoPath = path.join(seoDir, file);
      const seoData = JSON.parse(await fs.readFile(seoPath, 'utf8'));

      // Skip pages with noindex
      const robots = (seoData.robots || '').toLowerCase();
      if (robots.includes('noindex')) continue;

      let url = seoData.canonical;
      if (!url) {
         url = `${siteUrl}/${pageName === 'home' ? '' : pageName}`;
      } else {
         // validate canonical matches site url domain if present
         if (!url.startsWith(siteUrl) && url.startsWith('http')) {
             // canonical points elsewhere, omit from this site's sitemap
             continue;
         }
      }

      sitemapEntries.push({
        url,
      });
    } catch (e) {
      // skip invalid
    }
  }

  return sitemapEntries;
}
