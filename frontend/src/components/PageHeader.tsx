'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badgeText,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors duration-200">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {badgeText && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-credora-50 dark:bg-credora-950/60 text-credora-700 dark:text-credora-300 border border-credora-200 dark:border-credora-800 uppercase tracking-wider">
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
};
