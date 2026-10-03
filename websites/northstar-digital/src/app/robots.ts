import { MetadataRoute } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let settings = null;
  try {
    const publishedVersionPath = path.join(process.cwd(), 'data', '.published_version.json');
    const publishedMeta = await fs.readFile(publishedVersionPath, 'utf8');
    const { version } = JSON.parse(publishedMeta);
    
    const settingsPath = path.join(process.cwd(), 'published', `v${version}`, 'seo', 'settings.json');
    settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
  } catch (e) {
    // missing settings
  }

  const siteUrl = settings?.siteUrl || 'https://northstar-digital.example.com';
  
  // If robots setting explicitly says noindex
  const robotsSetting = (settings?.robots || '').toLowerCase();
  if (robotsSetting.includes('noindex')) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/preview/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
