import { DeploymentRecord } from 'backend/models/DeploymentRecord';
import { connectMongoDB } from 'backend/mongodb';
import { requireProjectAccess } from 'backend/permissions';
import Link from 'next/link';

export default async function DeploymentsPage({ params }: { params: { projectId: string } }) {
  const { session, project, membership } = await requireProjectAccess(params.projectId);
  await connectMongoDB();
  
  const deployments = await DeploymentRecord.find({ projectId: project.id }).sort({ startedAt: -1 });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-6 space-x-4">
        <Link href={`/projects/${project.id}`} className="text-gray-500 hover:text-black">← Back to Project</Link>
      </div>

      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Deployment History</h1>
          {['SUPER_ADMIN', 'PROJECT_ADMIN', 'EDITOR'].includes(membership.role) && (
              <form action={`/api/projects/${project.id}/publish`} method="POST">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Publish Current Draft</button>
              </form>
          )}
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-sm text-gray-700">Time</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Status</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Draft v.</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Published v.</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Commit</th>
              <th className="p-4 font-semibold text-sm text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deployments.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm text-gray-700">{new Date(d.startedAt).toLocaleString()}</td>
                <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${d.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : d.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {d.status}
                    </span>
                </td>
                <td className="p-4 text-sm text-gray-600">v{d.draftVersion}</td>
                <td className="p-4 text-sm text-gray-600">{d.publishedVersion ? `v${d.publishedVersion}` : '-'}</td>
                <td className="p-4 text-sm font-mono text-gray-500">{d.commitSha.substring(0, 7)}</td>
                <td className="p-4 text-sm">
                    {['SUPER_ADMIN', 'PROJECT_ADMIN'].includes(membership.role) && d.status === 'SUCCESS' && (
                        <form action={`/api/projects/${project.id}/rollback`} method="POST">
                            <input type="hidden" name="deploymentId" value={d.id} />
                            <button type="submit" className="text-red-600 hover:underline">Rollback to this</button>
                        </form>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deployments.length === 0 && <div className="p-4 text-gray-500 text-center">No deployments found.</div>}
      </div>
    </div>
  );
}
