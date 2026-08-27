import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-light-border dark:border-dark-border bg-slate-50/40 dark:bg-dark-card/40',
          className
        )
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-light-text dark:text-dark-text tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="sm" className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
