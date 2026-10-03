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
  const seoData = await readDraftSeoData('home').catch(() => ({ title: 'Northstar Default', description: '' }));
  const projectId = 'northstar-digital';

  return (
    <div className="preview-container">
      {seoData?.jsonLd && <StructuredData data={seoData.jsonLd} />}
      <EditorRuntime projectId={projectId} />

      <div style={{ display: 'none' }} data-editor-section="seo" data-editor-file="data/seo/home.json">
          <span data-editor-path="title">{seoData.title}</span>
          <span data-editor-path="description">{seoData.description}</span>
      </div>

      <main className="min-h-screen">
        {homeData.sections.map((section: any, idx: number) => (
          <div key={section.id} data-editor-section={section.id} data-editor-file="data/pages/home.json">
             {section.type === 'hero' && (
                <section className="hero text-center py-20 bg-gray-50">
                  <h1 data-editor-path={`sections.${idx}.data.title`} className="text-5xl font-bold">{section.data.title}</h1>
                  <p data-editor-path={`sections.${idx}.data.description`} className="text-xl mt-4 text-gray-600">{section.data.description}</p>
                </section>
             )}
             {section.type === 'services' && (
                <section className="services grid grid-cols-3 gap-6 p-10">
                   {section.data.items.map((item: any, itemIdx: number) => (
                      <div key={itemIdx} className="service-card p-6 border rounded shadow-sm">
                         <h3 data-editor-path={`sections.${idx}.data.items.${itemIdx}.name`} className="text-xl font-semibold">{item.name}</h3>
                         <p data-editor-path={`sections.${idx}.data.items.${itemIdx}.text`} className="mt-2 text-gray-700">{item.text}</p>
                      </div>
                   ))}
                </section>
             )}
          </div>
        ))}
      </main>
    </div>
  );
}
