import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-brand-200/60 dark:border-brand-800/40',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-dark-elevated dark:text-dark-muted border-light-border dark:border-dark-border',
    outline: 'bg-transparent text-light-muted dark:text-dark-muted border-light-border dark:border-dark-border',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium border transition-colors select-none',
          variants[variant],
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'brand' && 'bg-brand-500',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-rose-500',
            variant === 'neutral' && 'bg-slate-400',
            variant === 'outline' && 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  );
};
