import { useState, useRef, useEffect } from 'react';
import type { Department, Document } from '../types';
import { DEPARTMENTS, DEPARTMENT_ACCESS } from '../types';
import { getDocuments, uploadDocument } from '../api';

interface DocumentsSidebarProps {
  currentDepartment: Department;
  onDepartmentChange: (dept: Department) => void;
}

export function DocumentsSidebar({
  currentDepartment,
  onDepartmentChange,
}: DocumentsSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const accessibleDepartments = DEPARTMENT_ACCESS[currentDepartment];
  const canUpload = currentDepartment !== 'executive';

  useEffect(() => {
    fetchDocuments();
  }, [currentDepartment]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);
    try {
      const allDocs: Document[] = [];
      for (const dept of accessibleDepartments) {
        const response = await getDocuments(dept);
        if (response.success) {
          allDocs.push(...response.documents);
        }
      }
      allDocs.sort(
        (a, b) =>
          new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()
      );
      setDocuments(allDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage(null);
    setError(null);

    try {
      const response = await uploadDocument(file, currentDepartment);
      setUploadMessage(response.message);
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  const groupedDocs = accessibleDepartments.reduce((acc, dept) => {
    acc[dept] = documents.filter((doc) => doc.department === dept);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Department Selector */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white"
          >
            <span className="font-medium text-gray-900 capitalize">{currentDepartment}</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    onDepartmentChange(dept);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 capitalize first:rounded-t-lg last:rounded-b-lg ${
                    dept === currentDepartment ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3 px-1">
          Access: {accessibleDepartments.join(', ')}
        </p>
      </div>

      {/* Upload Button */}
      {canUpload && (
        <div className="p-5 border-b border-gray-200 bg-white">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".pdf,.csv,.txt,.md,.docx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            PDF, CSV, TXT, MD, DOCX
          </p>
          {uploadMessage && (
            <p className="text-xs text-green-600 mt-2 text-center">{uploadMessage}</p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
          )}
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Documents
          </h3>
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-400 text-center py-12">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">No documents</div>
        ) : (
          <div className="space-y-6">
            {accessibleDepartments.map((dept) => {
              const deptDocs = groupedDocs[dept] || [];
              if (deptDocs.length === 0) return null;
              return (
                <div key={dept}>
                  <h4 className="text-xs text-gray-400 uppercase mb-3 font-medium">
                    {dept} ({deptDocs.length})
                  </h4>
                  <div className="space-y-2">
                    {deptDocs.map((doc) => (
                      <div
                        key={doc.s3_key}
                        className="p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
                      >
                        <p className="text-sm text-gray-900 truncate font-medium" title={doc.filename}>
                          {doc.filename}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatFileSize(doc.size_bytes)} · {formatDate(doc.last_modified)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
