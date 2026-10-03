import { Project } from './models/Project';
import { Membership } from './models/Membership';
import { connectMongoDB } from './mongodb';
import { getSession } from './auth';
import { redirect } from 'next/navigation';

export async function requireAuth(loginRoute = '/login') {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect(loginRoute);
  }
  return session;
}

export async function requireProjectAccess(projectId: string, loginRoute = '/login') {
  const session = await requireAuth(loginRoute);
  await connectMongoDB();
  
  // Find project
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  // Check org membership
  const orgMembership = await Membership.findOne({
    userId: session.userId, 
    organizationId: project.organizationId, 
    projectId: { $exists: false }
  });
  
  // Check project membership
  const projMembership = await Membership.findOne({
    userId: session.userId, 
    projectId
  });

  const membership = projMembership || orgMembership;
  if (!membership) throw new Error("Permission denied. You do not have access to this project.");

  return { session, project, membership };
}

export async function requirePermission(projectId: string, requiredPermission: string, loginRoute = '/login') {
  const { session, project, membership } = await requireProjectAccess(projectId, loginRoute);
  
  // SUPER_ADMIN has full access
  if (membership.role === 'SUPER_ADMIN') return { session, project, membership };

  // Define granular permissions
  const permissions: Record<string, string[]> = {
    'VIEWER': ['project.view', 'content.view', 'deployment.view'],
    'EDITOR': ['project.view', 'content.view', 'content.edit', 'deployment.view'],
    'PROJECT_ADMIN': ['project.view', 'content.view', 'content.edit', 'content.publish', 'deployment.view', 'deployment.rollback', 'project.manage_members']
  };

  const rolePerms = permissions[membership.role] || [];
  if (!rolePerms.includes(requiredPermission)) {
    throw new Error(`Permission denied. Requires ${requiredPermission}`);
  }

  return { session, project, membership };
}

export async function requireOrganizationAccess(organizationId: string) {
  const session = await requireAuth();
  await connectMongoDB();
  
  const membership = await Membership.findOne({
    userId: session.userId, 
    organizationId, 
    projectId: { $exists: false }
  });

  if (!membership) throw new Error("Permission denied. You do not have access to this organization.");

  return { session, membership };
}
