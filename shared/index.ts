export interface ClipboardItem {
  id: string;
  content: string;
  type: string;
  createdAt: Date | string;
}

export interface FileItem {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date | string;
}

export interface CreateClipboardPayload {
  content: string;
  type?: string;
}