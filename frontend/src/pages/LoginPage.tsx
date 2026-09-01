import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  KeyRound,
  UserPlus,
  WifiOff,
  ServerCrash,
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import { parseApiError, ParsedApiError } from '../utils/errorHandler';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  useDocumentTitle('Log In', 'Log in to your Nexora Network account to access your feed and messages.');
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [apiError, setApiError] = useState<ParsedApiError | null>(null);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(() => {
    const msg = sessionStorage.getItem('nexora_session_expired');
    if (msg) {
      sessionStorage.removeItem('nexora_session_expired');
      return msg;
    }
    return null;
  });
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
    resolver: zodResolver(loginSchema),
  });

  const enteredEmail = watch('email');

  const onSubmit = async (data: LoginFormValues) => {
    setApiError(null);
    setUnverifiedEmail(null);
    setSessionExpiredMsg(null);

    try {
      await login({ email: data.email.trim(), password: data.password });
      showToast('success', 'Welcome Back!', 'Signed in successfully. Opening your feed...');
      navigate('/feed', { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err, 'Unable to sign in. Please verify your email and password.');
      setApiError(parsed);

      // Trigger user-facing Toast notification
      showToast(
        parsed.isUnverified ? 'warning' : 'error',
        parsed.title,
        parsed.message
      );

      // Highlight specific input fields
      if (parsed.isNotFound) {
        setError('email', {
          type: 'manual',
          message: 'No account found with this email',
        });
      } else if (parsed.isInvalidPassword) {
        setError('password', {
          type: 'manual',
          message: 'Incorrect password entered',
        });
      } else if (parsed.isUnverified) {
        setUnverifiedEmail(data.email.trim());
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-light-bg dark:bg-dark-bg transition-colors py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-dark-bg/20 rounded-[10px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 19V5l12 14V5" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text">
              Nexora
            </span>
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text">
            Welcome back
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Sign in to access your professional feed, network, and messages
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Single Active Session Warning */}
            {sessionExpiredMsg && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Session Terminated</p>
                  <p className="text-[11px] mt-0.5">{sessionExpiredMsg}</p>
                </div>
              </div>
            )}

            {/* Comprehensive API Error Feedback Alerts */}
            {apiError && (
              <div>
                {/* 1. Account Not Found Banner */}
                {apiError.isNotFound && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{apiError.title}</span>
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      {apiError.message}
                    </p>
                    <div className="pt-1">
                      <Link
                        to={`/register?email=${encodeURIComponent(enteredEmail || '')}`}
                        className="inline-flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Create a free account now ➔
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. Incorrect Password Banner */}
                {apiError.isInvalidPassword && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{apiError.title}</span>
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      {apiError.message}
                    </p>
                    <div className="pt-1">
                      <Link
                        to={`/forgot-password?email=${encodeURIComponent(enteredEmail || '')}`}
                        className="inline-flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Forgot your password? Reset it here ➔
                      </Link>
                    </div>
                  </div>
                )}

                {/* 3. Unverified Email Banner */}
                {apiError.isUnverified && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                      <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{apiError.title}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      {apiError.message}
                    </p>
                    <Link
                      to={`/verify-email?email=${encodeURIComponent(unverifiedEmail || enteredEmail || '')}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors text-center"
                    >
                      <span>Enter 6-Digit Verification Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* 4. Rate Limit / Network / Server / General Error Banner */}
                {!apiError.isNotFound && !apiError.isInvalidPassword && !apiError.isUnverified && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                    {apiError.isNetworkError ? (
                      <WifiOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : apiError.isServerError ? (
                      <ServerCrash className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-rose-800 dark:text-rose-200">{apiError.title}</p>
                      <p className="text-[11px] mt-0.5 text-rose-600 dark:text-rose-400">
                        {apiError.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              placeholder="user@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              isPasswordToggle
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-light-muted dark:text-dark-muted select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-light-border dark:border-dark-border text-brand-600 focus:ring-brand-500"
                />
                <span>Remember me</span>
              </label>

              <Link
                to={`/forgot-password?email=${encodeURIComponent(enteredEmail || '')}`}
                className="font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-light-muted dark:text-dark-muted">
          New to Nexora?{' '}
          <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
