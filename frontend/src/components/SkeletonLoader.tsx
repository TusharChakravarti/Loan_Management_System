'use client';

import React from 'react';

export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800/60">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="px-6 py-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3">
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 4, cols = 5 }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 animate-pulse space-y-2">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: rows }).map((_, idx) => (
              <SkeletonRow key={idx} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
