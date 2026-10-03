import { Membership } from 'backend/models/Membership';
import { connectMongoDB } from 'backend/mongodb';
import { requireProjectAccess } from 'backend/permissions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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

export default async function ProjectOverviewPage({ params }: { params: { projectId: string } }) {
  const { session, project, membership } = await requireProjectAccess(params.projectId);
  await connectMongoDB();
  
  if (!project) return notFound();

  const draft = await getDraftVersion(project.id);
  const published = await getPublishedVersion(project.id);

  const memberships = await Membership.find({ projectId: project.id }).populate('userId');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-6 space-x-4">
        <Link href="/projects" className="text-gray-500 hover:text-black">← Back to Projects</Link>
      </div>

      <div className="flex justify-between items-start mb-8">
          <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-gray-600 mt-1">Project Key: {project.projectKey} | Type: {project.websiteType}</p>
          </div>
          <div className="space-x-3 flex">
              <Link href={`/projects/${project.id}/seo`} className="bg-gray-100 text-gray-800 border border-gray-300 px-4 py-2 rounded shadow-sm hover:bg-gray-200">SEO Dashboard</Link>
              <Link href={`/projects/${project.id}/preview`} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Open Visual Editor</Link>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-lg shadow border">
              <div className="text-sm text-gray-500 font-medium uppercase">Current Draft</div>
              <div className="text-2xl font-semibold mt-2">v{draft}</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow border">
              <div className="text-sm text-gray-500 font-medium uppercase">Published Version</div>
              <div className="text-2xl font-semibold mt-2">{published === 'None' ? 'None' : `v${published}`}</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow border">
              <div className="text-sm text-gray-500 font-medium uppercase">Your Role</div>
              <div className="text-2xl font-semibold mt-2">{membership.role}</div>
          </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Project Members</h2>
              {['SUPER_ADMIN', 'PROJECT_ADMIN'].includes(membership.role) && (
                  <button className="text-sm text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50">Add Member</button>
              )}
          </div>
          {memberships.length === 0 ? (
              <p className="text-gray-500 text-sm">No project-specific members. Organization members have access.</p>
          ) : (
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="p-2 font-semibold">User</th>
                    <th className="p-2 font-semibold">Role</th>
                </tr>
                </thead>
                <tbody className="divide-y">
                {memberships.map((m: any) => (
                    <tr key={m.id}>
                    <td className="p-2">{m.userId?.name} <span className="text-gray-500">({m.userId?.email})</span></td>
                    <td className="p-2">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{m.role}</span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
