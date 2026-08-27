import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-dark-elevated/60 border border-light-border/60 dark:border-dark-border/40 overflow-x-auto no-scrollbar',
          className
        )
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap',
              isActive
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300'
                    : 'bg-slate-200/70 dark:bg-dark-border text-light-muted dark:text-dark-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
