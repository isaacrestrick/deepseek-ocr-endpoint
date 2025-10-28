// TypeScript types for DeepSeek OCR application

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

export interface OCRFormData {
  systemPrompt?: string;
  userPrompt: string;
  images: ImageFile[];
}

export interface OCRRequest {
  systemPrompt?: string;
  userPrompt: string;
  images: string[]; // Base64 encoded images
}

export interface OCRResponse {
  success: boolean;
  result?: string; // Markdown formatted result
  error?: string;
  processingTime?: number;
}

export interface UploadState {
  isUploading: boolean;
  isDragging: boolean;
  error?: string;
}

