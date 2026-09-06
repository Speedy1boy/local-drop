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

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateNotePayload {
  title: string;
  content: string;
  tags: string[];
}