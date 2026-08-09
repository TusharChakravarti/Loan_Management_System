'use client';

import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Information',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 space-y-3 shadow-2xs">
      <div className="flex items-start gap-3">
        <span className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">⚠</span>
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-rose-950 dark:text-rose-100 tracking-tight">
            {title}
          </h4>
          <p className="text-xs font-medium text-rose-800 dark:text-rose-300 leading-normal">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={onRetry}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
