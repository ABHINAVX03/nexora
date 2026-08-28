import React, { useState, useEffect } from 'react';

interface AppLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const DEFAULT_MESSAGES = [
  'Connecting to Nexora...',
  'Securing your professional session...',
  'Preparing your network feed...',
];

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message,
  subMessage,
}) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [message]);

  const activeMessage = message || DEFAULT_MESSAGES[msgIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg transition-colors duration-300 select-none overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 dark:bg-brand-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-xs px-6 text-center space-y-6 animate-fade-in">
        {/* Glowing Nexora Logo with pulsating ring */}
        <div className="relative flex items-center justify-center">
          {/* Breathing outer glow ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 opacity-40 blur-lg animate-pulse" />
          
          {/* Logo container */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 p-0.5 shadow-2xl shadow-brand-500/30 flex items-center justify-center transform transition-transform hover:scale-105">
            <div className="w-full h-full bg-slate-900/30 dark:bg-dark-bg/60 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white drop-shadow-md"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 19V5l12 14V5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Branding & Status */}
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
            Nexora
          </h1>
          <p className="text-xs font-medium text-light-muted dark:text-dark-muted min-h-[18px] transition-all duration-300">
            {subMessage || activeMessage}
          </p>
        </div>

        {/* Elegant Animated Gradient Shimmer Progress Bar */}
        <div className="w-48 h-1 rounded-full bg-slate-200 dark:bg-dark-elevated overflow-hidden relative shadow-inner">
          <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
