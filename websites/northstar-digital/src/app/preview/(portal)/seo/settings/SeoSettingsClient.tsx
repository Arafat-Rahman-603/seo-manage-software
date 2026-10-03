"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeoSettingsClient({
  projectId,
  initialSettings,
  baseVersion,
}: {
  projectId: string;
  initialSettings: any;
  baseVersion: string;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const file = `seo/settings.json`;
    const mutations = [];

    for (const [key, value] of Object.entries(settings)) {
      mutations.push({
        file,
        jsonPath: key,
        value,
      });
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: "POST", // changed from POST to POST but wait, in EditorWrapper it was PATCH.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          baseVersion,
          mutations,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      router.push(`/projects/${projectId}/seo`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Site Identity</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={settings.siteName || ""}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base Site URL</label>
            <input
              type="url"
              className="w-full border rounded p-2"
              value={settings.siteUrl || ""}
              onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Locale</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={settings.locale || ""}
              onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
              placeholder="en_US"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Global Defaults</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Default Title Pattern</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={settings.defaultTitle || ""}
              onChange={(e) => setSettings({ ...settings, defaultTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Description</label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={settings.defaultDescription || ""}
              onChange={(e) => setSettings({ ...settings, defaultDescription: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
