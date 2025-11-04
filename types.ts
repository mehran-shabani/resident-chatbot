
export interface FileInfo {
  name: string;
  type: string;
  data: string; // base64 encoded string
  previewUrl: string; // Data URL for preview
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  file?: FileInfo;
}
