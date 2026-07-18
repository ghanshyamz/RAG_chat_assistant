'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchDocuments, uploadDocument, deleteDocument } from '@/store/documentSlice';
import { UploadCloud, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DocumentManager() {
  const dispatch = useAppDispatch();
  const { documents, loading, uploading, error } = useAppSelector((state) => state.documents);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Fetch
  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  // Polling for processing/uploaded status files
  useEffect(() => {
    const hasPending = documents.some(
      (doc) => doc.status === 'uploaded' || doc.status === 'processing'
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      // Dispatch fetch in background without putting the page in global loading state
      // We can just fetch, since fetchDocuments clears loading state at the end
      dispatch(fetchDocuments());
    }, 3000);

    return () => clearInterval(interval);
  }, [documents, dispatch]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // Check file extension
    const validExtensions = ['.pdf', '.txt', '.md'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Only .pdf, .txt, and .md files are supported.');
      return;
    }

    try {
      await dispatch(uploadDocument(file));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await dispatch(deleteDocument(id));
      } catch (err: any) {
        alert(`Failed to delete document: ${err.message}`);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 size={10} />
            Indexed
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full pulse-badge">
            <Loader2 size={10} className="animate-spin" />
            Processing
          </span>
        );
      case 'uploaded':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full pulse-badge">
            Queued
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            <AlertCircle size={10} />
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-[50%] pt-4 min-h-[250px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Document Store
        </h3>
        {loading && !uploading && (
          <Loader2 size={12} className="animate-spin text-slate-500" />
        )}
      </div>

      {/* Upload Box */}
      <div
        onClick={triggerFileInput}
        className={`group border-2 border-dashed border-white/10 hover:border-brand-violet/40 bg-white/[0.01] hover:bg-brand-violet/[0.02] rounded-xl p-4 mb-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
          uploading ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.md"
          className="hidden"
        />
        {uploading ? (
          <>
            <Loader2 size={24} className="animate-spin text-brand-purple" />
            <p className="text-xs font-medium text-slate-300">Processing file...</p>
          </>
        ) : (
          <>
            <UploadCloud
              size={24}
              className="text-slate-400 group-hover:text-brand-purple transition-all group-hover:scale-105"
            />
            <p className="text-xs font-medium text-slate-300">
              Upload PDF, TXT, or MD
            </p>
            <p className="text-[10px] text-slate-500">Max size 20MB</p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg mb-3 flex items-start gap-1.5">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {documents.length === 0 && !loading ? (
          <div className="text-center py-6 border border-white/5 bg-slate-900/10 rounded-xl">
            <FileText size={20} className="mx-auto text-slate-600 mb-1.5" />
            <p className="text-xs text-slate-500">No documents uploaded.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="flex items-start gap-2.5 min-w-0">
                  <FileText size={16} className="text-brand-purple shrink-0 mt-0.5" />
                  <span
                    className="text-xs font-medium text-slate-200 truncate"
                    title={doc.filename}
                  >
                    {doc.filename}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.filename)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-all cursor-pointer"
                  title="Delete Document"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] text-slate-500">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                {getStatusBadge(doc.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
