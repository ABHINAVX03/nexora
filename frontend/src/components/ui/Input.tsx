import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPasswordToggle = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={resolvedType}
            disabled={disabled}
            className={twMerge(
              clsx(
                'w-full h-11 rounded-xl px-3.5 text-sm transition-all duration-200',
                'bg-white dark:bg-dark-card text-light-text dark:text-dark-text',
                'border border-light-border dark:border-dark-border',
                'placeholder:text-light-muted/60 dark:placeholder:text-dark-muted/60',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                leftIcon ? 'pl-10' : '',
                rightIcon || isPasswordToggle ? 'pr-10' : '',
                error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : '',
                className
              )
            )}
            {...props}
          />
          {isPasswordToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-light-muted dark:text-dark-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
