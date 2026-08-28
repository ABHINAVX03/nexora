import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, CheckCircle2, ArrowLeft, KeyRound, Mail, RefreshCw } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';

const resetPasswordSchema = z
  .object({
    email: z.string().email('Please enter a valid work email'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const watchedEmail = watch('email') || initialEmail;

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);
    setErrorMsg(null);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full OTP
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);
    setErrorMsg(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit recovery code sent to your email.');
      return;
    }

    setErrorMsg(null);
    try {
      const res = await authApi.resetPassword({
        email: data.email.trim(),
        otp: fullOtp,
        newPassword: data.newPassword,
      });

      showToast('success', 'Password Updated', res.message || 'Your password has been changed. Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Failed to reset password. Please check your recovery code and try again.';
      setErrorMsg(message);
    }
  };

  const handleResend = async () => {
    if (!watchedEmail || isResending) return;
    setIsResending(true);
    setErrorMsg(null);
    try {
      const res = await authApi.forgotPassword({ email: watchedEmail.trim() });
      showToast('success', 'Code Dispatched', res.message || 'A fresh reset code has been sent.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to resend reset code.';
      setErrorMsg(msg);
    } finally {
      setIsResending(false);
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
            Reset Password
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted max-w-xs mx-auto">
            Enter the 6-digit recovery code sent to your inbox and choose your new password.
          </p>
        </div>

        {/* Reset Password Card */}
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

            {/* 6-Digit OTP Box Grid */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                  6-Digit Recovery Code
                </label>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending || !watchedEmail}
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-11 sm:w-11 sm:h-12 text-center font-mono font-bold text-lg rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition-all"
                  />
                ))}
              </div>
            </div>

            <Input
              label="New Password"
              placeholder="••••••••"
              isPasswordToggle
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Input
              label="Confirm New Password"
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
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Update Password & Sign In
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
