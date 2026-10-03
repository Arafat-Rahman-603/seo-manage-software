import { requirePermission } from "backend/permissions";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { validateSeo, detectDuplicates, SeoDiagnostic, Seo } from "shared-types";

async function getPages(projectId: string) {
  const pagesDir = path.resolve(process.cwd(), "../../websites", projectId, "data/pages");
  try {
    const files = await fs.readdir(pagesDir);
    return files.filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
  } catch (e) {
    return [];
  }
}

async function getSeo(projectId: string, page: string) {
  const seoPath = path.resolve(process.cwd(), "../../websites", projectId, "data/seo", `${page}.json`);
  try {
    const content = await fs.readFile(seoPath, "utf8");
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

export default async function ProjectSeoPage({ params }: { params: { projectId: string } }) {
  const { project, session } = await requirePermission('northstar-digital', "content.view");
  
  const pages = await getPages(project.id);
  
  const allSeoMap: Record<string, Seo | Partial<Seo>> = {};
  
  const seoDataRaw = await Promise.all(
    pages.map(async (page) => {
      const seo = await getSeo(project.id, page);
      allSeoMap[page] = seo;
      const issues = validateSeo(page, seo);
      return { page, seo, issues };
    })
  );

  const duplicateIssues = detectDuplicates(allSeoMap);

  // Merge duplicates into the page issues
  const seoData = seoDataRaw.map(data => {
      const pageDuplicateIssues = duplicateIssues.filter((i: SeoDiagnostic) => i.page === data.page);
      return {
          ...data,
          issues: [...data.issues, ...pageDuplicateIssues]
      };
  });

  const totalPages = pages.length;
  const missingTitles = seoData.filter(d => d.issues.some(i => i.code === 'MISSING_TITLE')).length;
  const missingDescriptions = seoData.filter(d => d.issues.some(i => i.code === 'MISSING_DESCRIPTION')).length;
  const canonicalIssues = seoData.filter(d => d.issues.some(i => i.category === 'CANONICAL')).length;
  const structuredDataIssues = seoData.filter(d => d.issues.some(i => i.category === 'STRUCTURED_DATA')).length;
  const ogIssues = seoData.filter(d => d.issues.some(i => i.code === 'MISSING_OG_IMAGE')).length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">SEO Dashboard - {project.name}</h1>
          <p className="text-gray-500 mt-2">Manage technical and on-page SEO</p>
        </div>
        <div className="flex space-x-4">
          <Link href={`/preview`} className="px-4 py-2 border rounded hover:bg-gray-50">Back to Project</Link>
          <Link href={`/preview/seo/settings`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Technical Settings</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 border rounded shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Overview</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between"><span>Total Pages:</span> <span className="font-medium">{totalPages}</span></div>
            <div className="flex justify-between text-red-600"><span>Missing Titles:</span> <span className="font-medium">{missingTitles}</span></div>
            <div className="flex justify-between text-orange-600"><span>Missing Descriptions:</span> <span className="font-medium">{missingDescriptions}</span></div>
          </div>
        </div>
        <div className="bg-white p-6 border rounded shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Technical Issues</h3>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between"><span>Canonical Issues:</span> <span className="font-medium">{canonicalIssues}</span></div>
            <div className="flex justify-between"><span>Structured Data Issues:</span> <span className="font-medium">{structuredDataIssues}</span></div>
            <div className="flex justify-between"><span>Open Graph Issues:</span> <span className="font-medium">{ogIssues}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Page</th>
              <th className="p-4 font-medium text-gray-600">SEO Title</th>
              <th className="p-4 font-medium text-gray-600">Description</th>
              <th className="p-4 font-medium text-gray-600">Issues</th>
              <th className="p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {seoData.map((data) => (
              <tr key={data.page} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium capitalize">{data.page}</div>
                  <div className="text-sm text-gray-500">/{data.page === 'home' ? '' : data.page}</div>
                </td>
                <td className="p-4 truncate max-w-xs">{data.seo.title || <span className="text-red-500 text-sm">Missing</span>}</td>
                <td className="p-4 truncate max-w-xs text-sm">{data.seo.description || <span className="text-red-500">Missing</span>}</td>
                <td className="p-4">
                  {data.issues.length > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {data.issues.filter((i: SeoDiagnostic) => i.severity === 'ERROR' || i.severity === 'WARNING').length} Issues
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Good
                    </span>
                  )}
                </td>
                <td className="p-4 flex space-x-2">
                  <Link href={`/preview/seo/${data.page}`} className="text-blue-600 hover:underline text-sm">Edit SEO</Link>
                  <Link href={`/preview/preview?page=${data.page}`} className="text-gray-600 hover:underline text-sm">Preview</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
