'use client';

import React from 'react';

interface CredoraLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const CredoraLogo: React.FC<CredoraLogoProps> = ({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: { icon: 'w-6 h-6', title: 'text-sm sm:text-base', subtitle: 'text-[9px]' },
    md: { icon: 'w-7 h-7 sm:w-8 sm:h-8', title: 'text-base sm:text-xl', subtitle: 'text-[10px]' },
    lg: { icon: 'w-9 h-9 sm:w-10 sm:h-10', title: 'text-xl sm:text-2xl', subtitle: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Original Geometric Credora Emblem */}
      <div
        className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-credora-700 to-navy-900 dark:from-credora-600 dark:to-credora-900 text-white shadow-sm ring-1 ring-white/20 shrink-0 ${sizeClasses.icon}`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Outer Shield Geometric Arc */}
          <path
            d="M16 3L27 8V16C27 22.5 22.2 28.1 16 30C9.8 28.1 5 22.5 5 16V8L16 3Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
          {/* Inner Financial Chevron Anchor */}
          <path
            d="M12 14L16 18L20 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="11" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* Wordmark */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span
              className={`font-black tracking-wider text-slate-900 dark:text-white uppercase ${sizeClasses.title}`}
              style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
            >
              CREDORA
            </span>
          </div>
          {showTagline && (
            <span
              className={`font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5 whitespace-nowrap hidden sm:block ${sizeClasses.subtitle}`}
            >
              Smarter Lending. Trusted Decisions.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
