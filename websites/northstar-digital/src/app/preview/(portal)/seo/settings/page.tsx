import { requirePermission } from "backend/permissions";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import SeoSettingsClient from "./SeoSettingsClient";

export default async function SeoSettingsPage({ params }: { params: { projectId: string } }) {
  const { project } = await requirePermission('northstar-digital', "content.edit");
  const projectDir = path.resolve(process.cwd(), "../../websites", project.id);
  const settingsPath = path.resolve(projectDir, "data/seo", `settings.json`);
  const metaPath = path.resolve(projectDir, "data/.version.json");
  
  let settings = {};
  let version = "1";

  try {
    const content = await fs.readFile(settingsPath, "utf8");
    settings = JSON.parse(content);
  } catch (e) {}

  try {
    const meta = await fs.readFile(metaPath, "utf8");
    version = JSON.parse(meta).version.toString();
  } catch (e) {}

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Technical SEO Settings</h1>
          <p className="text-gray-500 mt-2">Global technical SEO configuration for {project.name}</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/preview/seo`} className="px-4 py-2 border rounded hover:bg-gray-50">Back</Link>
        </div>
      </div>

      <div className="bg-white p-6 border rounded shadow-sm">
        <SeoSettingsClient projectId={project.id} initialSettings={settings} baseVersion={version} />
      </div>
    </div>
  );
}
