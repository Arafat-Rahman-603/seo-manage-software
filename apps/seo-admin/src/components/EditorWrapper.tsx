'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorMessage, isValidEditorMessage, sendEditorMessage } from 'editor-protocol';

type EditorState = 'LOADING' | 'READY' | 'DIRTY' | 'SAVING' | 'SAVED' | 'CONFLICT' | 'SAVE_ERROR' | 'PUBLISHING' | 'PUBLISHED' | 'PUBLISH_ERROR';

export function EditorWrapper({ projectId, previewUrl, initialRole }: { projectId: string, previewUrl: string, initialRole: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [editorState, setEditorState] = useState<EditorState>('LOADING');
  const [selectedSection, setSelectedSection] = useState<any>(null);
  // fields state is now an array of explicit mappings
  const [editedFields, setEditedFields] = useState<Array<{ path: string, value: string, file: string }>>([]);
  const [draftVersion, setDraftVersion] = useState<string>("1"); // Ideally fetched from server on load
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of current draft version could go here
    setEditorState('READY');
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = isValidEditorMessage(event, projectId);
      if (!msg) return;

      if (msg.type === 'EDITOR_READY') {
        console.log("Editor ready in iframe");
      }
      if (msg.type === 'SELECT_SECTION') {
        setSelectedSection(msg.payload);
        setEditedFields(msg.payload.fields || []);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [projectId]);

  const handleFieldChange = (index: number, newValue: string) => {
    setEditedFields(prev => {
      const copy = [...prev];
      copy[index].value = newValue;
      return copy;
    });
    setEditorState('DIRTY');
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (editedFields.length === 0) return;
    setEditorState('SAVING');
    setErrorMessage(null);
    try {
      const payload = {
        projectId,
        baseVersion: draftVersion,
        mutations: editedFields.map(f => ({
          file: f.file,
          jsonPath: f.path,
          value: f.value
        }))
      };

      const res = await fetch(`/api/projects/${projectId}/content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
          if (res.status === 409) setEditorState('CONFLICT');
          else setEditorState('SAVE_ERROR');
          throw new Error(data.error || "Save failed");
      }

      setDraftVersion(data.newVersion.toString());
      setEditorState('SAVED');
      
      if (iframeRef.current?.contentWindow) {
        sendEditorMessage(iframeRef.current.contentWindow, { type: 'REQUEST_PREVIEW_REFRESH', projectId });
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message);
    }
  };

  const handlePublish = async () => {
    setEditorState('PUBLISHING');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Publishing from visual editor', draftVersion })
      });
      const data = await res.json();
      if (!res.ok) {
          setEditorState('PUBLISH_ERROR');
          throw new Error(data.error || "Publish failed");
      }
      setEditorState('PUBLISHED');
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Toolbar */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <a href="/projects" className="text-gray-500 hover:text-gray-900">← Back</a>
          <h1 className="font-semibold text-lg">{projectId}</h1>
          <span className="text-sm px-2 py-1 bg-gray-100 rounded text-gray-600 font-mono">v{draftVersion}</span>
          <span className={`text-sm px-2 py-1 rounded font-medium ${
              editorState === 'DIRTY' ? 'bg-yellow-100 text-yellow-800' :
              editorState === 'CONFLICT' ? 'bg-red-100 text-red-800' :
              editorState === 'SAVING' || editorState === 'PUBLISHING' ? 'bg-blue-100 text-blue-800' :
              editorState === 'SAVED' || editorState === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-600'
          }`}>
            {editorState}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <a href={`/projects/${projectId}/seo`} className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors mr-2">
            SEO
          </a>
          {(initialRole === 'EDITOR' || initialRole === 'PROJECT_ADMIN' || initialRole === 'SUPER_ADMIN') && (
             <button 
              onClick={handleSave}
              disabled={editorState !== 'DIRTY'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
             >
              Save
             </button>
          )}
          {(initialRole === 'PROJECT_ADMIN' || initialRole === 'SUPER_ADMIN') && (
             <button 
              onClick={handlePublish}
              disabled={editorState === 'DIRTY' || editorState === 'SAVING' || editorState === 'PUBLISHING'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
             >
              Publish
             </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Iframe Preview */}
        <div className="flex-1 bg-gray-100">
          <iframe 
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-none"
            title="Preview"
          />
        </div>

        {/* Editor Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex flex-col">
          {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm break-words">
                  {errorMessage}
              </div>
          )}
          {selectedSection ? (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-900 capitalize">{selectedSection.sectionId}</h2>
              <div className="space-y-4">
                {editedFields.map((field, index) => (
                  <div key={index}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 font-mono truncate" title={field.path}>
                        {field.path.split('.').pop()}
                    </label>
                    <textarea 
                      value={field.value}
                      onChange={(e) => handleFieldChange(index, e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-sans"
                      rows={3}
                    />
                    <div className="text-[10px] text-gray-400 mt-1 truncate" title={field.file}>{field.file}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center mt-10">
              <p>Select a section in the preview to edit.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
