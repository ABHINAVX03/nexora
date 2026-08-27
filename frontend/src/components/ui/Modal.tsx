import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog content */}
      <div
        className={twMerge(
          clsx(
            'relative w-full rounded-2xl shadow-elevated-dark border p-6 z-10 transition-all animate-scale-in',
            'bg-white dark:bg-dark-card border-light-border dark:border-dark-border text-light-text dark:text-dark-text',
            maxWidths[maxWidth]
          )
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-light-border/60 dark:border-dark-border/60">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-light-muted dark:text-dark-muted mt-1">{description}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
