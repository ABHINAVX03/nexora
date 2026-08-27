import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl font-bold">
        404
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text">
        Page Not Found
      </h2>
      <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted max-w-sm">
        The destination you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Link to="/feed">
          <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
            Back to Feed
          </Button>
        </Link>
        <Link to="/discover">
          <Button variant="outline" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
            Discover People
          </Button>
        </Link>
      </div>
    </div>
  );
};
