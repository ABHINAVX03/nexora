import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={twMerge(
        clsx('rounded-xl skeleton-shimmer bg-slate-200 dark:bg-dark-elevated', className)
      )}
    />
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card space-y-4 shadow-subtle">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-4/6" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-light-border/40 dark:border-dark-border/40">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
};

export const ConnectionCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center justify-between shadow-subtle">
      <div className="flex items-center gap-3.5">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
      <Skeleton className="h-9 w-24 rounded-xl" />
    </div>
  );
};
