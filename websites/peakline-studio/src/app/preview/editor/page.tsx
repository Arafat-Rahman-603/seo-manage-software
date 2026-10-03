import { EditorWrapper } from '@/components/EditorWrapper';
import { requirePermission } from 'backend/permissions';

export default async function ProjectPreviewPage({ params, searchParams }: { params: { projectId: string }, searchParams: { page?: string } }) {
  const { project, session, membership } = await requirePermission('peakline-studio', 'content.edit', '/preview/login');
  
  const pagePath = searchParams.page ? `/${searchParams.page}` : '';
  const previewUrl = `/preview/render${pagePath}`;

  return (
    <EditorWrapper 
      projectId={project.id} 
      previewUrl={previewUrl} 
      initialRole={membership.role} 
    />
  );
}
