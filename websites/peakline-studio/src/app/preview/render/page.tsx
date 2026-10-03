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
      robots: "noindex, nofollow",
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

export default async function PreviewRenderPage() {
  const homeData = await safeReadDraftPageData('home');
  const seoData = await readDraftSeoData('home').catch(() => ({ title: 'Peakline Default', description: '' }));
  const projectId = 'peakline-studio';

  return (
    <div className="preview-container">
      {seoData?.jsonLd && <StructuredData data={seoData.jsonLd} />}
      <EditorRuntime projectId={projectId} />

      <div style={{ display: 'none' }} data-editor-section="seo" data-editor-file="data/seo/home.json">
          <span data-editor-path="title">{seoData.title}</span>
          <span data-editor-path="description">{seoData.description}</span>
      </div>

      <main className="bg-stone-50 min-h-screen">
        {homeData.sections.map((section: any, idx: number) => (
          <div key={section.id} data-editor-section={section.id} data-editor-file="data/pages/home.json">
             {section.type === 'hero' && (
                <section className="hero-section text-left p-12 max-w-4xl mx-auto">
                  <p data-editor-path={`sections.${idx}.data.eyebrow`} className="text-stone-500 uppercase tracking-widest">{section.data.eyebrow}</p>
                  <h1 data-editor-path={`sections.${idx}.data.title`} className="text-6xl font-serif text-stone-900 mt-4">{section.data.title}</h1>
                  <p data-editor-path={`sections.${idx}.data.description`} className="text-xl text-stone-600 mt-6">{section.data.description}</p>
                </section>
             )}
          </div>
        ))}
      </main>
    </div>
  );
}
