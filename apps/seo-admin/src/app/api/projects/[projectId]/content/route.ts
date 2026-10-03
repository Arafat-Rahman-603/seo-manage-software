import { NextResponse } from 'next/server';
import { requirePermission } from 'backend/permissions';
import { ContentMutationService } from 'backend/services/ContentMutationService';
import { BatchMutationRequestSchema } from 'shared-types';

export async function POST(request: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { session, project } = await requirePermission(params.projectId, 'content.edit');
    
    const body = await request.json();
    const payload = BatchMutationRequestSchema.parse(body);

    const service = new ContentMutationService();
    const result = await service.saveBatch(project.id, session.userId, payload);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export const PATCH = POST;
