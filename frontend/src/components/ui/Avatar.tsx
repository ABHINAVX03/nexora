import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getInitials } from '../../utils/formatters';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline,
  className,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeStyles = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl font-bold',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
    '2xl': 'w-5 h-5 ring-3',
  };

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'relative inline-flex items-center justify-center rounded-full flex-shrink-0 select-none overflow-hidden',
          onClick ? 'cursor-pointer transition-transform hover:scale-105' : '',
          sizeStyles[size],
          className
        )
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-600 to-indigo-700 text-white font-semibold tracking-wider">
          {getInitials(name)}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={twMerge(
            clsx(
              'absolute bottom-0 right-0 rounded-full ring-white dark:ring-dark-bg',
              statusDotSizes[size],
              isOnline ? 'bg-emerald-500' : 'bg-slate-400'
            )
          )}
        />
      )}
    </div>
  );
};
