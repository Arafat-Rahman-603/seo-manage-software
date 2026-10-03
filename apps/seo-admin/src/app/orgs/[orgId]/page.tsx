import { Organization } from 'backend/models/Organization';
import { Project } from 'backend/models/Project';
import { Membership } from 'backend/models/Membership';
import { connectMongoDB } from 'backend/mongodb';
import { requireOrganizationAccess } from 'backend/permissions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function OrganizationPage({ params }: { params: { orgId: string } }) {
  const { session, membership } = await requireOrganizationAccess(params.orgId);
  await connectMongoDB();
  
  const org = await Organization.findById(params.orgId);
  if (!org) return notFound();

  const projects = await Project.find({ organizationId: params.orgId });
  const memberships = await Membership.find({ organizationId: params.orgId, projectId: { $exists: false } }).populate('userId');

  if (!org) return notFound();

  return (
    <div className="p-8">
      <div className="flex items-center mb-6 space-x-4">
        <Link href="/" className="text-gray-500 hover:text-black">← Back</Link>
        <h1 className="text-3xl font-bold">{org.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="space-y-3">
            {projects.map((p: any) => (
              <div key={p.id} className="p-4 border rounded hover:bg-gray-50">
                <div className="font-medium text-lg">
                  <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link>
                </div>
                <div className="text-sm text-gray-500 mt-1">Key: {p.projectKey} | Type: {p.websiteType}</div>
              </div>
            ))}
            {projects.length === 0 && <div className="text-gray-500 text-sm">No projects.</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Organization Members</h2>
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
        </div>
      </div>
    </div>
  );
}
