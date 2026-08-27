import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-light-border/60 dark:border-dark-border/60 py-8 px-4 sm:px-6 lg:px-8 mt-12 bg-white/40 dark:bg-dark-card/20 backdrop-blur-sm text-xs text-light-muted dark:text-dark-muted">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[10px] font-black">
            N
          </div>
          <span className="font-semibold text-light-text dark:text-dark-text">Nexora</span>
          <span>© {new Date().getFullYear()} — Connect. Build. Grow.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link to="/discover" className="hover:text-brand-500 transition-colors">
            Discover
          </Link>
          <Link to="/network" className="hover:text-brand-500 transition-colors">
            Network
          </Link>
          <Link to="/settings" className="hover:text-brand-500 transition-colors">
            Privacy & Terms
          </Link>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            Microservices v2.6.0
          </span>
        </div>
      </div>
    </footer>
  );
};
