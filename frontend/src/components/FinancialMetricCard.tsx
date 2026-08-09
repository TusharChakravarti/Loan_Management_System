'use client';

import React from 'react';

interface FinancialMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const FinancialMetricCard: React.FC<FinancialMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'text-slate-900 dark:text-white',
    primary: 'text-credora-600 dark:text-credora-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-rose-600 dark:text-rose-400',
  }[variant];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2 transition-colors duration-200">
      <div className="flex justify-between items-start">
        <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
          {title}
        </span>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between gap-2 pt-1">
        <span className={`text-2xl sm:text-3xl font-black tracking-tight ${variantStyles}`}>
          {value}
        </span>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
};
