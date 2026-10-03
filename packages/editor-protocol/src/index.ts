export type EditorMessageType = 
  | 'EDITOR_READY'
  | 'SELECT_SECTION'
  | 'SELECT_FIELD'
  | 'REQUEST_SAVE'
  | 'SAVE_SUCCESS'
  | 'SAVE_ERROR'
  | 'REQUEST_PUBLISH'
  | 'PUBLISH_STATUS'
  | 'REQUEST_PREVIEW_REFRESH';

export interface EditorMessage {
  type: EditorMessageType;
  projectId?: string;
  requestId?: string;
  payload?: any;
}

export function sendEditorMessage(target: Window, message: EditorMessage, targetOrigin: string = '*') {
  target.postMessage(message, targetOrigin);
}

const ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

export function isValidEditorMessage(event: MessageEvent, expectedProjectId?: string): EditorMessage | null {
  // Harden postMessage security
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn(`[Editor Protocol] Rejected message from unauthorized origin: ${event.origin}`);
    return null;
  }

  const data = event.data;
  if (!data || typeof data.type !== 'string') return null;

  if (expectedProjectId && data.projectId && data.projectId !== expectedProjectId) {
    console.warn(`[Editor Protocol] Project ID mismatch. Expected ${expectedProjectId}, got ${data.projectId}`);
    return null;
  }

  return data as EditorMessage;
}
