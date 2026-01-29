export interface Document {
  s3_key: string;
  filename: string;
  department: string;
  size_bytes: number;
  last_modified: string;
}

export interface SourceInfo {
  text: string;
  source: string;
  score: number;
  page?: number;
  row?: number;
  section?: string;
  s3_key?: string;
}

export interface SearchResponse {
  success: boolean;
  answer: string;
  sources: SourceInfo[];
  tokens_used?: {
    input: number;
    output: number;
  };
}

export interface UploadResponse {
  success: boolean;
  message: string;
  filename: string;
  department: string;
  s3_key: string;
  chunks_indexed: number;
  is_update: boolean;
}

export interface DocumentsResponse {
  success: boolean;
  count: number;
  documents: Document[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceInfo[];
  timestamp: Date;
}

export type Department = 'engineering' | 'finance' | 'hr' | 'marketing' | 'general' | 'executive';

export const DEPARTMENT_ACCESS: Record<Department, string[]> = {
  engineering: ['engineering', 'general'],
  finance: ['finance', 'general'],
  hr: ['hr', 'general'],
  marketing: ['marketing', 'general'],
  general: ['general'],
  executive: ['engineering', 'finance', 'hr', 'marketing', 'general'],
};

export const DEPARTMENTS: Department[] = ['engineering', 'finance', 'hr', 'marketing', 'general', 'executive'];
