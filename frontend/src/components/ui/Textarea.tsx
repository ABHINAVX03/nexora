import { TextareaHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={twMerge(
            clsx(
              'w-full rounded-xl p-3.5 text-sm transition-all duration-200 resize-none min-h-[100px]',
              'bg-white dark:bg-dark-card text-light-text dark:text-dark-text',
              'border border-light-border dark:border-dark-border',
              'placeholder:text-light-muted/60 dark:placeholder:text-dark-muted/60',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
              className
            )
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-light-muted dark:text-dark-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
