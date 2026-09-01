import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, LogIn, WifiOff, ServerCrash } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import { parseApiError, ParsedApiError } from '../utils/errorHandler';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid work email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  useDocumentTitle('Create Profile', 'Join Nexora Network — the distributed social and professional platform.');
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<ParsedApiError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const enteredEmail = watch('email');

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);
    try {
      await signup({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      showToast('success', 'Verification Code Sent', 'Please check your inbox for the 6-digit activation code.');
      navigate(`/verify-email?email=${encodeURIComponent(data.email.trim())}`);
    } catch (err: any) {
      const parsed = parseApiError(err, 'Failed to create account. Email may already be in use.');
      setApiError(parsed);

      showToast('error', parsed.title, parsed.message);

      if (parsed.message.toLowerCase().includes('already exists') || parsed.message.toLowerCase().includes('already in use')) {
        setError('email', {
          type: 'manual',
          message: 'An account with this email already exists',
        });
      }
    }
  };

  const isEmailConflict =
    apiError?.message.toLowerCase().includes('already exists') ||
    apiError?.message.toLowerCase().includes('already in use');

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
            Create your profile
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Join the professional network for engineers and tech leaders
          </p>
        </div>

        {/* Registration Form Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-200">
                  {apiError.isNetworkError ? (
                    <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : apiError.isServerError ? (
                    <ServerCrash className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{apiError.title}</span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  {apiError.message}
                </p>
                {isEmailConflict && (
                  <div className="pt-1">
                    <Link
                      to={`/login?email=${encodeURIComponent(enteredEmail || '')}`}
                      className="inline-flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign in to your existing account ➔
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              leftIcon={<UserIcon className="w-4 h-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="alex@company.com"
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

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              isPasswordToggle
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-light-muted dark:text-dark-muted">
          Already have a Nexora account?{' '}
          <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
