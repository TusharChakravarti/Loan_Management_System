'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '📂',
  action,
}) => {
  return (
    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
      <div className="text-3xl opacity-80">{icon}</div>
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
