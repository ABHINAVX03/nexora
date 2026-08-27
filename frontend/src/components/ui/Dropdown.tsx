import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface DropdownItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={twMerge(
            clsx(
              'absolute z-40 mt-2 w-56 rounded-2xl p-1.5 shadow-elevated-dark border transition-all animate-scale-in',
              'bg-white/95 dark:bg-dark-card/95 backdrop-blur-md border-light-border dark:border-dark-border',
              align === 'right' ? 'right-0' : 'left-0',
              className
            )
          )}
        >
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.divider && (
                <div className="my-1 border-t border-light-border/60 dark:border-dark-border/60" />
              )}
              <button
                type="button"
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left',
                  item.variant === 'danger'
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-rose-400'
                    : 'text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated'
                )}
              >
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
