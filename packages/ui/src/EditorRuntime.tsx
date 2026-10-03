'use client';

import React, { useEffect } from 'react';
import { sendEditorMessage, isValidEditorMessage } from 'editor-protocol';

export function EditorRuntime({ projectId }: { projectId: string }) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = isValidEditorMessage(event, projectId);
      if (!msg) return;

      if (msg.type === 'REQUEST_PREVIEW_REFRESH') {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest('[data-editor-section]');
      
      if (sectionEl) {
        e.preventDefault();
        e.stopPropagation();

        const sectionId = sectionEl.getAttribute('data-editor-section');
        const file = sectionEl.getAttribute('data-editor-file') || `data/pages/home.json`;

        // Explicit JSON Path Mapping
        const fields: Array<{ path: string, value: string, file: string }> = [];
        const fieldNodes = sectionEl.querySelectorAll('[data-editor-path]');
        
        fieldNodes.forEach(node => {
          const path = node.getAttribute('data-editor-path');
          // Allow field to override file if it's SEO data for example
          const fieldFile = node.getAttribute('data-editor-file') || file;
          if (path) {
            fields.push({ path, value: node.textContent || '', file: fieldFile });
          }
        });

        sendEditorMessage(window.parent, {
          type: 'SELECT_SECTION',
          projectId,
          payload: {
            sectionId,
            file,
            fields
          }
        });
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest('[data-editor-section]');
      if (sectionEl) {
        (sectionEl as HTMLElement).style.outline = '2px dashed #3b82f6';
        (sectionEl as HTMLElement).style.cursor = 'pointer';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest('[data-editor-section]');
      if (sectionEl) {
        (sectionEl as HTMLElement).style.outline = 'none';
      }
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);

    sendEditorMessage(window.parent, { type: 'EDITOR_READY', projectId });

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
    };
  }, [projectId]);

  return null;
}
