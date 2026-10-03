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
      title: 'Northstar Digital',
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
    // missing seo data
  }

  if (homeData.sections.length === 0) {
      return <div className="p-10 text-center">Production is empty. Site not published.</div>;
  }

  return (
    <main>
      {seoData?.jsonLd && <StructuredData data={seoData.jsonLd} />}
      {/* Visual indicator it's production */}
      <div className="bg-red-600 text-white text-center text-xs py-1">Production (Published)</div>
      {homeData.sections.map((section: any, idx: number) => (
        <div key={section.id}>
           {section.type === 'hero' && (
              <section className="hero-section text-center p-10 bg-gray-100">
                <p className="text-sm font-bold text-blue-600 uppercase">{section.data.eyebrow}</p>
                <h1 className="text-4xl font-bold mt-2">{section.data.title}</h1>
                <p className="text-gray-600 mt-4">{section.data.description}</p>
              </section>
           )}
           {section.type === 'services' && (
              <section className="services-section p-10">
                <h2 className="text-3xl font-bold text-center">{section.data.title}</h2>
                <p className="text-center text-gray-500 mt-2">{section.data.subtitle}</p>
              </section>
           )}
           {section.type === 'cta' && (
              <section className="cta-section bg-blue-900 text-white p-10 text-center">
                <h2 className="text-3xl font-bold">{section.data.title}</h2>
                <p className="mt-4">{section.data.description}</p>
              </section>
           )}
        </div>
      ))}
    </main>
  );
}
