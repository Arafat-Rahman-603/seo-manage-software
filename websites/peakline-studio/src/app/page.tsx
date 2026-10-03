import { safeReadPublishedPageData } from '@/lib/data-loader';
import { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { StructuredData } from 'ui';

export async function generateMetadata(): Promise<Metadata> {
  const publishedVersionPath = path.join(process.cwd(), 'data', '.published_version.json');
  try {
    const publishedMeta = await fs.readFile(publishedVersionPath, 'utf8');
    const { version } = JSON.parse(publishedMeta);
    
    const seoPath = path.join(process.cwd(), 'published', `v${version}`, 'seo', 'home.json');
    const seoData = JSON.parse(await fs.readFile(seoPath, 'utf8'));

    return {
      title: seoData.title,
      description: seoData.description,
      alternates: {
        canonical: seoData.canonical,
      },
      robots: seoData.robots,
      openGraph: {
        title: seoData.ogTitle,
        description: seoData.ogDescription,
        images: seoData.ogImage ? [{ url: seoData.ogImage }] : undefined,
      },
      twitter: {
        card: seoData.twitterCard,
        title: seoData.twitterTitle,
        description: seoData.twitterDescription,
        images: seoData.twitterImage ? [seoData.twitterImage] : undefined,
      },
    };
  } catch (e) {
    return {
      title: 'Peakline Studio',
    };
  }
}
export default async function ProductionPage() {
  const homeData = await safeReadPublishedPageData('home');
  
  let seoData = null;
  try {
    const publishedVersionPath = path.join(process.cwd(), 'data', '.published_version.json');
    const publishedMeta = await fs.readFile(publishedVersionPath, 'utf8');
    const { version } = JSON.parse(publishedMeta);
    const seoPath = path.join(process.cwd(), 'published', `v${version}`, 'seo', 'home.json');
    seoData = JSON.parse(await fs.readFile(seoPath, 'utf8'));
  } catch (e) {
  }

  if (homeData.sections.length === 0) {
      return <div className="p-10 text-center font-serif text-stone-500">Production is empty. Site not published.</div>;
  }

  return (
    <main className="bg-stone-50 min-h-screen">
      {seoData?.jsonLd && <StructuredData data={seoData.jsonLd} />}
      <div className="bg-red-900 text-stone-100 text-center text-xs py-1 tracking-widest uppercase">Production (Published)</div>
      {homeData.sections.map((section: any, idx: number) => (
        <div key={section.id}>
           {section.type === 'hero' && (
              <section className="hero-section text-left p-12 max-w-4xl mx-auto">
                <p className="text-stone-500 uppercase tracking-widest">{section.data.eyebrow}</p>
                <h1 className="text-6xl font-serif text-stone-900 mt-4">{section.data.title}</h1>
                <p className="text-xl text-stone-600 mt-6">{section.data.description}</p>
              </section>
           )}
        </div>
      ))}
    </main>
  );
}
