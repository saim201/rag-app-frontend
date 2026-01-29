import type { SearchResponse, UploadResponse, DocumentsResponse } from '../types';

const API_BASE_URL = 'http://localhost:9000';

export async function searchDocuments(
  query: string,
  userDepartment: string,
  topK: number = 5
): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      user_department: userDepartment,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

export async function uploadDocument(
  file: File,
  department: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('department', department);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function getDocuments(department?: string): Promise<DocumentsResponse> {
  const url = department
    ? `${API_BASE_URL}/documents?department=${encodeURIComponent(department)}`
    : `${API_BASE_URL}/documents`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch documents');
  }

  return response.json();
}

export async function deleteDocument(
  department: string,
  filename: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(department)}/${encodeURIComponent(filename)}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Delete failed');
  }

  return response.json();
}

export async function checkHealth(): Promise<{
  status: string;
  services: Record<string, boolean>;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
