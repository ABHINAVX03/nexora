import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      showToast('success', 'Account Created', 'Welcome to Nexora!');
      navigate('/feed');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Failed to create account. Email may already be in use.';
      setErrorMsg(msg);
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
            Create your profile
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Join the professional network for engineers and leaders
          </p>
        </div>

        {/* Registration Form Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
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
