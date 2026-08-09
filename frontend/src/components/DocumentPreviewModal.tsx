'use client';

import React, { useEffect } from 'react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  blobUrl: string | null;
  isImage: boolean;
  isLoading?: boolean;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  blobUrl,
  isImage,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden z-10 max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2.5 truncate pr-4">
            <span className="text-xl">📄</span>
            <span className="font-bold text-sm text-white truncate">{fileName}</span>
            {isImage ? (
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                IMAGE PREVIEW
              </span>
            ) : (
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                PDF DOCUMENT
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>✕</span>
            <span>Close Preview</span>
          </button>
        </div>

        {/* Viewer Content Area */}
        <div className="relative flex-1 bg-slate-950 p-4 sm:p-6 min-h-[400px] flex items-center justify-center overflow-auto">
          {isLoading ? (
            <div className="text-center space-y-3 text-slate-400">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold">Loading authenticated document stream...</p>
            </div>
          ) : !blobUrl ? (
            <div className="text-center text-rose-400 text-xs font-bold p-6">
              Unable to load document preview.
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center w-full h-full p-2">
              <img
                src={blobUrl}
                alt={fileName}
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-xl border border-slate-800"
              />
            </div>
          ) : (
            <iframe
              src={blobUrl}
              title={fileName}
              className="w-full h-[75vh] border-0 rounded-lg bg-slate-800"
            />
          )}
        </div>
      </div>
    </div>
  );
};
