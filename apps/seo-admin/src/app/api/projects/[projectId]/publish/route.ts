import { NextResponse } from 'next/server';
import { requirePermission } from 'backend/permissions';
import { ContentMutationService } from 'backend/services/ContentMutationService';
import fs from 'fs/promises';
import path from 'path';

async function getDraftVersion(projectId: string) {
    try {
        const p = path.resolve(process.cwd(), `../../websites/${projectId}/data/.version.json`);
        const data = await fs.readFile(p, 'utf8');
        return JSON.parse(data).version.toString();
    } catch {
        return '1';
    }
}

export async function POST(request: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { session, project } = await requirePermission(params.projectId, 'content.publish');
    
    const draftVersion = await getDraftVersion(project.id);
    const service = new ContentMutationService();
    
    await service.publish(project.id, session.userId, "Publishing via Dashboard", draftVersion);

    return NextResponse.redirect(new URL(`/projects/${project.id}/deployments`, request.url));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
