'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'PENDING':
        return 'bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800';
      case 'SALES_REVIEW':
        return 'bg-indigo-100/90 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-800';
      case 'SANCTION_PENDING':
        return 'bg-blue-100/90 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800';
      case 'SANCTIONED':
        return 'bg-cyan-100/90 text-cyan-900 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-200 dark:border-cyan-800';
      case 'DISBURSEMENT_PENDING':
        return 'bg-purple-100/90 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800';
      case 'ACTIVE':
      case 'DISBURSED':
        return 'bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800';
      case 'CLOSED':
        return 'bg-slate-200/90 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'REJECTED':
        return 'bg-rose-100/90 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formatText = (st: string) => {
    if (!st) return 'UNKNOWN';
    return st.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${getBadgeStyle(
        status
      )} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {formatText(status)}
    </span>
  );
};
