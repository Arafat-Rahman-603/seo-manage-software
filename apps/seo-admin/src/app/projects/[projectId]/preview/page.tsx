import { EditorWrapper } from '@/components/EditorWrapper';
import { requirePermission } from 'backend/permissions';

export default async function ProjectPreviewPage({ params, searchParams }: { params: { projectId: string }, searchParams: { page?: string } }) {
  const { project, session, membership } = await requirePermission(params.projectId, 'content.edit');
  
  const pagePath = searchParams.page ? `/${searchParams.page}` : '';
  
  const previewUrl = project.id === 'northstar-digital' 
    ? `http://localhost:3001/preview${pagePath}` 
    : `http://localhost:3002/preview${pagePath}`;

  return (
    <EditorWrapper 
      projectId={project.id} 
      previewUrl={previewUrl} 
      initialRole={membership.role} 
    />
  );
}
