import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  elevated = false,
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl transition-all duration-200 border',
          'bg-white dark:bg-dark-card border-light-border dark:border-dark-border',
          elevated
            ? 'shadow-card dark:shadow-card-dark'
            : 'shadow-subtle',
          hoverable
            ? 'hover:shadow-elevated dark:hover:shadow-elevated-dark hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer'
            : '',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={twMerge(clsx('p-5 pb-3 border-b border-light-border/60 dark:border-dark-border/60', className))} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={twMerge(clsx('text-base font-semibold text-light-text dark:text-dark-text tracking-tight', className))} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={twMerge(clsx('p-5', className))} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={twMerge(clsx('p-4 pt-3 border-t border-light-border/60 dark:border-dark-border/60 bg-slate-50/50 dark:bg-dark-elevated/30 rounded-b-2xl', className))} {...props}>
    {children}
  </div>
);
