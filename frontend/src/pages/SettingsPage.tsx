import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Shield,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('info', 'Signed out', 'You have been safely signed out.');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-light-border/60 dark:border-dark-border/60 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text">
          Preferences & Settings
        </h2>
        <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
          Manage your account appearance, verified identity, and session security
        </p>
      </div>

      {/* 1. Account Details */}
      {user && (
        <Card className="border-light-border dark:border-dark-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-brand-500" />
              Account Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated">
              <span className="text-light-muted dark:text-dark-muted">Database Member ID</span>
              <span className="font-mono font-bold">#{user.id}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated">
              <span className="text-light-muted dark:text-dark-muted">Full Name</span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated">
              <span className="text-light-muted dark:text-dark-muted">Work Email</span>
              <span className="font-mono">{user.email}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Appearance & Theme */}
      <Card className="border-light-border dark:border-dark-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Appearance & Interface Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Choose your preferred display mode.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {/* Light */}
            <div
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${
                theme === 'light'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                  : 'border-light-border dark:border-dark-border bg-white dark:bg-dark-card text-light-muted dark:text-dark-muted hover:border-slate-300'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Light</span>
            </div>

            {/* Dark */}
            <div
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${
                theme === 'dark'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                  : 'border-light-border dark:border-dark-border bg-white dark:bg-dark-card text-light-muted dark:text-dark-muted hover:border-slate-300'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Dark</span>
            </div>

            {/* System */}
            <div
              onClick={() => setTheme('system')}
              className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${
                theme === 'system'
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold shadow-xs'
                  : 'border-light-border dark:border-dark-border bg-white dark:bg-dark-card text-light-muted dark:text-dark-muted hover:border-slate-300'
              }`}
            >
              <Laptop className="w-5 h-5" />
              <span className="text-xs">System</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Session & Logout */}
      <Card className="border-light-border dark:border-dark-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Shield className="w-4 h-4" />
            Session Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-light-muted dark:text-dark-muted">
            End your authenticated JWT session and clear stored tokens.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out of Nexora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
