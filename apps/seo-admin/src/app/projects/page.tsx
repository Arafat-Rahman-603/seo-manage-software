import { Project } from 'backend/models/Project';
import { Membership } from 'backend/models/Membership';
import { DeploymentRecord } from 'backend/models/DeploymentRecord';
import { connectMongoDB } from 'backend/mongodb';
import { requireAuth } from 'backend/permissions';
import Link from 'next/link';
import fs from 'fs/promises';
import path from 'path';

async function getDraftVersion(projectId: string) {
    try {
        const p = path.resolve(process.cwd(), `../../websites/${projectId}/data/.version.json`);
        const data = await fs.readFile(p, 'utf8');
        return JSON.parse(data).version;
    } catch {
        return 1;
    }
}

async function getPublishedVersion(projectId: string) {
    try {
        const p = path.resolve(process.cwd(), `../../websites/${projectId}/.published_version.json`);
        const data = await fs.readFile(p, 'utf8');
        return JSON.parse(data).version;
    } catch {
        return 'None';
    }
}

export default async function ProjectsPage() {
  const session = await requireAuth();
  await connectMongoDB();

  // For this prototype, we'll list projects the user has access to either through org or directly
  const memberships = await Membership.find({ userId: session.userId }).populate('projectId').populate('organizationId');

  // Unique projects
  const projectsMap = new Map();
  for (const m of memberships) {
      if (m.projectId) {
          projectsMap.set((m.projectId as any)._id.toString(), m.projectId);
      } else if (m.organizationId) {
          const orgProjects = await Project.find({ organizationId: (m.organizationId as any)._id });
          for (const p of orgProjects) {
              projectsMap.set(p._id.toString(), p);
          }
      }
  }
  const projects = Array.from(projectsMap.values());

  const projectsWithMeta = await Promise.all(projects.map(async (p: any) => {
      const draft = await getDraftVersion(p.id);
      const published = await getPublishedVersion(p.id);
      
      const lastDeploy = await DeploymentRecord.findOne({ projectId: p.id })
          .sort({ startedAt: -1 });
      return { ...p.toObject(), id: p._id.toString(), draft, published, lastDeploy };
  }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-sm text-gray-700">Project</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Type</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Draft v.</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Published v.</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Status</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projectsWithMeta.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium"><Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link></td>
                <td className="p-4 text-sm text-gray-600">{p.websiteType}</td>
                <td className="p-4 text-sm text-gray-600">v{p.draft}</td>
                <td className="p-4 text-sm text-gray-600">{p.published === 'None' ? 'None' : `v${p.published}`}</td>
                <td className="p-4 text-sm">
                    {p.lastDeploy ? (
                        <span className={`px-2 py-1 rounded text-xs ${p.lastDeploy.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : p.lastDeploy.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {p.lastDeploy.status}
                        </span>
                    ) : <span className="text-gray-400 text-xs">No deploys</span>}
                </td>
                <td className="p-4 text-sm space-x-3">
                    <Link href={`/projects/${p.id}/preview`} className="text-blue-600 hover:underline">Preview/Edit</Link>
                    <Link href={`/projects/${p.id}/deployments`} className="text-blue-600 hover:underline">History</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projectsWithMeta.length === 0 && <div className="p-4 text-gray-500 text-center">No projects found.</div>}
      </div>
    </div>
  );
}
