import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setUnverifiedEmail(null);
    try {
      await login({ email: data.email, password: data.password });
      showToast('success', 'Welcome Back', 'Successfully signed into Nexora');
      navigate('/feed');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Invalid email or password. Please verify your credentials.';

      if (message.includes('EMAIL_NOT_VERIFIED') || message.includes('not verified')) {
        setUnverifiedEmail(data.email.trim());
        setErrorMsg('Your account email has not been verified yet.');
      } else {
        setErrorMsg(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-light-bg dark:bg-dark-bg transition-colors">
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
            Sign in to access your professional feed and network
          </p>
        </div>

        {/* Login Form Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400">
                <p>{errorMsg}</p>
                {unverifiedEmail && (
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                    className="inline-flex items-center gap-1 mt-1.5 font-bold text-brand-600 dark:text-brand-400 underline hover:text-brand-500"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Click here to enter verification code
                  </Link>
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
                to="/forgot-password"
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
