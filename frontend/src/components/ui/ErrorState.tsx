import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading this content. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 ${className || ''}`}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-light-text dark:text-dark-text tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted max-w-sm mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
