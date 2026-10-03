import { AuditLog } from 'backend/models/AuditLog';
import { Membership } from 'backend/models/Membership';
import { Project } from 'backend/models/Project';
import { connectMongoDB } from 'backend/mongodb';
import { requireAuth } from 'backend/permissions';
import Link from 'next/link';

export default async function AuditLogsPage() {
  const session = await requireAuth();
  await connectMongoDB();

  // If user is SUPER_ADMIN, show all logs, else only logs for projects they have access to
  const memberships = await Membership.find({ userId: session.userId });

  const isSuperAdmin = memberships.some(m => m.role === 'SUPER_ADMIN');

  let whereClause = {};
  if (!isSuperAdmin) {
      // Find all projects user has access to
      const allowedProjects = new Set<string>();
      for (const m of memberships) {
          if (m.projectId) {
              allowedProjects.add(m.projectId.toString());
          } else {
              const orgProjects = await Project.find({ organizationId: m.organizationId });
              orgProjects.forEach(p => allowedProjects.add(p._id.toString()));
          }
      }
      whereClause = { projectId: { $in: Array.from(allowedProjects) } };
  }

  const rawLogs = await AuditLog.find(whereClause).sort({ createdAt: -1 }).limit(100);
  
  // Populate project manually since projectId is a string
  const logs = await Promise.all(rawLogs.map(async (log) => {
      let project = null;
      if (log.projectId) {
          project = await Project.findById(log.projectId);
      }
      return { ...log.toObject(), id: log._id.toString(), project };
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center mb-6 space-x-4">
        <Link href="/" className="text-gray-500 hover:text-black">← Back to Dashboard</Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Platform Audit Logs</h1>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Time</th>
              <th className="p-4 font-semibold text-gray-700">User ID</th>
              <th className="p-4 font-semibold text-gray-700">Project</th>
              <th className="p-4 font-semibold text-gray-700">Action</th>
              <th className="p-4 font-semibold text-gray-700">Target</th>
              <th className="p-4 font-semibold text-gray-700">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-4 text-gray-500 font-mono">{log.userId.substring(0,8)}...</td>
                <td className="p-4 font-medium"><Link href={`/projects/${log.project?.id || log.projectId}`} className="text-blue-600 hover:underline">{log.project?.name || 'Unknown'}</Link></td>
                <td className="p-4 text-gray-800">{log.action}</td>
                <td className="p-4 text-gray-600 font-mono text-xs">{log.targetId || '-'}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${log.result === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {log.result}
                    </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="p-4 text-gray-500 text-center">No audit logs found.</div>}
      </div>
    </div>
  );
}
