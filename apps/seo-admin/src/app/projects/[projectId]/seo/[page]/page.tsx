import { requirePermission } from "backend/permissions";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import SeoEditorClient from "./SeoEditorClient";

async function getSeoAndVersion(projectId: string, page: string) {
  const projectDir = path.resolve(process.cwd(), "../../websites", projectId);
  const seoPath = path.resolve(projectDir, "data/seo", `${page}.json`);
  const metaPath = path.resolve(projectDir, "data/.version.json");
  
  let seo = {};
  let version = "1";

  try {
    const content = await fs.readFile(seoPath, "utf8");
    seo = JSON.parse(content);
  } catch (e) {
    // defaults if missing
  }

  try {
    const meta = await fs.readFile(metaPath, "utf8");
    version = JSON.parse(meta).version.toString();
  } catch (e) {
    // defaults
  }

  return { seo, version };
}

export default async function SeoPageEditor({ params }: { params: { projectId: string; page: string } }) {
  const { project } = await requirePermission(params.projectId, "content.edit");
  const { seo, version } = await getSeoAndVersion(project.id, params.page);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold capitalize">{params.page} SEO</h1>
          <p className="text-gray-500 mt-2">Editing SEO properties for this page</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/projects/${project.id}/seo`} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</Link>
        </div>
      </div>

      <div className="bg-white p-6 border rounded shadow-sm">
        <SeoEditorClient projectId={project.id} page={params.page} initialSeo={seo} baseVersion={version} />
      </div>
    </div>
  );
}
