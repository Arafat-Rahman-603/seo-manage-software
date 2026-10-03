import { requireAuth } from 'backend/permissions';
import { Membership } from 'backend/models/Membership';
import { connectMongoDB } from 'backend/mongodb';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await requireAuth();
  await connectMongoDB();

  // Get user's orgs
  const memberships = await Membership.find({
    userId: session.userId, 
    projectId: { $exists: false }
  }).populate('organizationId');

  const orgs = memberships.map(m => m.organizationId);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Central Dashboard</h1>
        <div className="flex space-x-4 items-center">
            <span className="text-gray-600">{session.email}</span>
            <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Logout</button>
            </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Organizations</h2>
          {orgs.length === 0 ? (
            <p className="text-gray-500">No organizations found.</p>
          ) : (
            <ul className="space-y-2">
              {orgs.map((org: any) => (
                <li key={org._id.toString()}>
                  <Link href={`/orgs/${org._id.toString()}`} className="text-blue-600 hover:underline font-medium">
                    {org.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2 text-blue-600">
            <li><Link href="/projects" className="hover:underline">All Projects</Link></li>
            <li><Link href="/users" className="hover:underline">User Management</Link></li>
            <li><Link href="/audit-logs" className="hover:underline">Platform Audit Logs</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
