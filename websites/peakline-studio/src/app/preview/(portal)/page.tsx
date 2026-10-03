export const dynamic = 'force-dynamic';
import { safeReadDraftPageData, readDraftSeoData } from '@/lib/data-loader';
import { EditorRuntime, StructuredData } from 'ui';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seoData = await readDraftSeoData('home');
    return {
      title: seoData.title ? `${seoData.title} (Preview)` : 'Preview',
      description: seoData.description,
      alternates: {
        canonical: seoData.canonical,
      },
      robots: "noindex, nofollow", // Always prevent indexing preview!
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
      title: 'Preview',
      robots: "noindex, nofollow"
    };
  }
}

export default async function PreviewPage() {
  const homeData = await safeReadDraftPageData('home');
  const seoData = await readDraftSeoData('home').catch(() => ({ title: 'Default Title', description: '' }));
  const projectId = 'peakline-studio';

  return (
    <div className="preview-container">
      {seoData?.jsonLd && <StructuredData data={seoData.jsonLd} />}
      <EditorRuntime projectId={projectId} />
      
      {/* Hidden SEO Metadata Editor Section */}
      <div style={{ display: 'none' }} data-editor-section="seo" data-editor-file="data/seo/home.json">
          <span data-editor-path="title">{seoData.title}</span>
          <span data-editor-path="description">{seoData.description}</span>
      </div>

      <main>
        {homeData.sections.map((section: any, idx: number) => (
          <div key={section.id} data-editor-section={section.id} data-editor-file="data/pages/home.json">
             {section.type === 'hero' && (
                <section className="hero-section text-center p-10 bg-gray-100">
                  <p data-editor-path={`sections.${idx}.data.eyebrow`} className="text-sm font-bold text-blue-600 uppercase">{section.data.eyebrow}</p>
                  <h1 data-editor-path={`sections.${idx}.data.title`} className="text-4xl font-bold mt-2">{section.data.title}</h1>
                  <p data-editor-path={`sections.${idx}.data.description`} className="text-gray-600 mt-4">{section.data.description}</p>
                </section>
             )}
             {section.type === 'services' && (
                <section className="services-section p-10">
                  <h2 data-editor-path={`sections.${idx}.data.title`} className="text-3xl font-bold text-center">{section.data.title}</h2>
                  <p data-editor-path={`sections.${idx}.data.subtitle`} className="text-center text-gray-500 mt-2">{section.data.subtitle}</p>
                </section>
             )}
             {section.type === 'cta' && (
                <section className="cta-section bg-blue-900 text-white p-10 text-center">
                  <h2 data-editor-path={`sections.${idx}.data.title`} className="text-3xl font-bold">{section.data.title}</h2>
                  <p data-editor-path={`sections.${idx}.data.description`} className="mt-4">{section.data.description}</p>
                </section>
             )}
          </div>
        ))}
      </main>
    </div>
  );
}
