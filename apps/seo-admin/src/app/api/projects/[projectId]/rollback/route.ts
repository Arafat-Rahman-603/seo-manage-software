import { NextResponse } from 'next/server';
import { requirePermission } from 'backend/permissions';
import { ContentMutationService } from 'backend/services/ContentMutationService';

export async function POST(request: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { session, project } = await requirePermission(params.projectId, 'deployment.rollback');
    
    const formData = await request.formData();
    const deploymentId = formData.get('deploymentId') as string;

    if (!deploymentId) {
        return NextResponse.json({ error: "Missing deploymentId" }, { status: 400 });
    }

    const mutationService = new ContentMutationService();
    
    // We need to fetch the deployment to get its publishedVersion
    const { DeploymentRecord } = await import('backend');
    const connectMongoDB = (await import('backend')).connectMongoDB;
    await connectMongoDB();

    const deployment = await DeploymentRecord.findById(deploymentId);
    if (!deployment || !deployment.publishedVersion) {
        return NextResponse.json({ error: "Invalid deployment for rollback" }, { status: 400 });
    }

    await mutationService.rollback(project.id, session.userId, deployment.publishedVersion.toString());

    return NextResponse.redirect(new URL(`/projects/${project.id}/deployments`, request.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
