import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setErrorMsg(null);
    try {
      const res = await authApi.forgotPassword({ email: data.email.trim() });
      showToast('success', 'Reset Code Sent', res.message || 'Check your inbox for the password reset code.');
      navigate(`/reset-password?email=${encodeURIComponent(data.email.trim())}`);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Unable to send reset code. Please verify your email and try again.';
      setErrorMsg(message);
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
                <KeyRound className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text">
              Nexora
            </span>
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text">
            Forgot Password?
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted max-w-xs mx-auto">
            Enter your registered email address and we'll send you a 6-digit recovery code.
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Send Reset Code
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-light-border/60 dark:border-dark-border/60 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
