import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, RefreshCw, ShieldCheck, AlertCircle, WifiOff, ServerCrash } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';
import { parseApiError, ParsedApiError } from '../utils/errorHandler';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [apiError, setApiError] = useState<ParsedApiError | null>(null);

  const { verifyEmailOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // 60-second cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);
    setApiError(null);

    // Auto focus next input
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
    setApiError(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setApiError({
        title: 'Incomplete Code',
        message: 'Please enter the complete 6-digit confirmation code.',
        isNotFound: false,
        isInvalidPassword: false,
        isUnverified: false,
        isRateLimited: false,
        isNetworkError: false,
        isServerError: false,
        isSessionExpired: false,
      });
      return;
    }
    if (!email) {
      setApiError({
        title: 'Missing Email',
        message: 'Email address is missing. Please enter your registered email.',
        isNotFound: false,
        isInvalidPassword: false,
        isUnverified: false,
        isRateLimited: false,
        isNetworkError: false,
        isServerError: false,
        isSessionExpired: false,
      });
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      await verifyEmailOtp(email.trim(), fullOtp);
      showToast('success', 'Account Activated!', 'Your email has been verified. Welcome to Nexora!');
      navigate('/feed', { replace: true });
    } catch (err: any) {
      const parsed = parseApiError(err, 'Verification failed. Please check the code and try again.');
      setApiError(parsed);
      showToast('error', parsed.title, parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !email) return;

    setIsResending(true);
    setApiError(null);

    try {
      const res = await authApi.resendVerificationOtp({ email: email.trim() });
      showToast('success', 'Verification Code Sent', res.message || 'A fresh code has been dispatched to your inbox.');
      setCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const parsed = parseApiError(err, 'Failed to resend verification code. Please wait and try again.');
      setApiError(parsed);
      showToast('error', parsed.title, parsed.message);
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
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text">
              Nexora
            </span>
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text">
            Verify your email
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted max-w-xs mx-auto">
            We sent a 6-digit confirmation code to{' '}
            <strong className="text-light-text dark:text-dark-text">{email || 'your email'}</strong>
          </p>
        </div>

        {/* Verification Card */}
        <Card className="p-6 sm:p-8 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark">
          <form onSubmit={handleVerify} className="space-y-5">
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 space-y-1">
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
              </div>
            )}

            {!initialEmail && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-light-text dark:text-dark-text">
                  Registered Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-light-muted dark:text-dark-muted absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@company.com"
                    required
                    className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* 6-Digit OTP Box Grid */}
            <div className="space-y-2">
              <label className="block text-center text-xs font-semibold text-light-muted dark:text-dark-muted">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
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
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center font-mono font-bold text-lg sm:text-xl rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-all"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3"
              isLoading={isSubmitting}
              disabled={otpDigits.join('').length !== 6}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Verify & Activate Account
            </Button>
          </form>

          {/* Resend Cooldown Section */}
          <div className="mt-5 pt-4 border-t border-light-border/60 dark:border-dark-border/60 text-center space-y-2">
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Didn't receive the email? Check your spam folder or
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Verification Code'}
            </button>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-light-muted dark:text-dark-muted">
          Need to change your email?{' '}
          <Link to="/register" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
            Register again
          </Link>
        </p>
      </div>
    </div>
  );
};
