"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Seo } from "shared-types";

export default function SeoEditorClient({
  projectId,
  page,
  initialSeo,
  baseVersion,
}: {
  projectId: string;
  page: string;
  initialSeo: Partial<Seo>;
  baseVersion: string;
}) {
  const router = useRouter();
  const [seo, setSeo] = useState<Partial<Seo>>(initialSeo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const file = `seo/${page}.json`;
    const mutations = [];

    // Simple flat mutation mapping for now
    for (const [key, value] of Object.entries(seo)) {
      if (key !== 'jsonLd' && key !== 'robots') {
        mutations.push({
          file,
          jsonPath: key,
          value,
        });
      }
    }

    if (seo.jsonLd) {
      mutations.push({
        file,
        jsonPath: "jsonLd",
        value: typeof seo.jsonLd === "string" ? JSON.parse(seo.jsonLd) : seo.jsonLd,
      });
    }

    if (seo.robots) {
      mutations.push({
        file,
        jsonPath: "robots",
        value: seo.robots,
      });
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          baseVersion,
          mutations,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save SEO");
      }

      router.push(`/projects/${projectId}/seo`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJsonLdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const val = e.target.value;
      if (val) JSON.parse(val); // validate
      setSeo({ ...seo, jsonLd: val });
    } catch {
      setSeo({ ...seo, jsonLd: e.target.value });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Basic Metadata</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={seo.title || ""}
              onChange={(e) => setSeo({ ...seo, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={seo.description || ""}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Canonical URL</label>
            <input
              type="url"
              className="w-full border rounded p-2"
              value={seo.canonical || ""}
              onChange={(e) => setSeo({ ...seo, canonical: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Robots</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              placeholder="index, follow"
              value={seo.robots || ""}
              onChange={(e) => setSeo({ ...seo, robots: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Keywords</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              placeholder="comma, separated, keywords"
              value={seo.keywords || ""}
              onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Social / Open Graph</h3>
          <div>
            <label className="block text-sm font-medium mb-1">OG Title</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={seo.ogTitle || ""}
              onChange={(e) => setSeo({ ...seo, ogTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OG Description</label>
            <textarea
              className="w-full border rounded p-2"
              rows={2}
              value={seo.ogDescription || ""}
              onChange={(e) => setSeo({ ...seo, ogDescription: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OG Image URL</label>
            <input
              type="url"
              className="w-full border rounded p-2"
              value={seo.ogImage || ""}
              onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Structured Data (JSON-LD)</h3>
        <div>
          <label className="block text-sm font-medium mb-1">JSON-LD Snippet</label>
          <textarea
            className="w-full border rounded p-2 font-mono text-sm"
            rows={6}
            value={typeof seo.jsonLd === "object" ? JSON.stringify(seo.jsonLd, null, 2) : seo.jsonLd || ""}
            onChange={handleJsonLdChange}
            placeholder={`{ "@context": "https://schema.org", "@type": "WebPage", ... }`}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save SEO"}
        </button>
      </div>
    </form>
  );
}
