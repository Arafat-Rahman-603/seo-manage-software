import { User } from 'backend/models/User';
import { Membership } from 'backend/models/Membership';
import { connectMongoDB } from 'backend/mongodb';
import { requireAuth } from 'backend/permissions';
import Link from 'next/link';

export default async function UsersPage() {
  const session = await requireAuth();
  await connectMongoDB();

  // If SUPER_ADMIN, show all users. Else show users sharing orgs.
  const memberships = await Membership.find({ userId: session.userId });

  const isSuperAdmin = memberships.some(m => m.role === 'SUPER_ADMIN');

  let userIdsToFetch: any[] = [];
  if (!isSuperAdmin) {
      const orgIds = memberships.map(m => m.organizationId);
      const sharedMemberships = await Membership.find({ organizationId: { $in: orgIds } });
      userIdsToFetch = sharedMemberships.map(m => m.userId);
  }

  const usersQuery = isSuperAdmin ? {} : { _id: { $in: userIdsToFetch } };

  const users = await User.find(usersQuery).sort({ createdAt: -1 });
  const usersWithMemberships = await Promise.all(users.map(async (u) => {
      const userMemberships = await Membership.find({ userId: u._id }).populate('organizationId').populate('projectId');
      return { ...u.toObject(), id: u._id.toString(), memberships: userMemberships };
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center mb-6 space-x-4">
        <Link href="/" className="text-gray-500 hover:text-black">← Back to Dashboard</Link>
      </div>

      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          {isSuperAdmin && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Add User</button>
          )}
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Name</th>
              <th className="p-4 font-semibold text-gray-700">Email</th>
              <th className="p-4 font-semibold text-gray-700">Status</th>
              <th className="p-4 font-semibold text-gray-700">Memberships</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {usersWithMemberships.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.status}
                    </span>
                </td>
                <td className="p-4 text-gray-600 space-y-1">
                    {u.memberships.map((m: any) => (
                        <div key={m._id.toString()} className="text-xs">
                            <span className="font-semibold">{m.organizationId?.name}</span>
                            {m.projectId ? ` -> ${m.projectId.name}` : ''}
                            <span className="ml-2 text-blue-600">[{m.role}]</span>
                        </div>
                    ))}
                    {u.memberships.length === 0 && <span className="text-gray-400">No memberships</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usersWithMemberships.length === 0 && <div className="p-4 text-gray-500 text-center">No users found.</div>}
      </div>
    </div>
  );
}
