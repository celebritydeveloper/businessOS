import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch, setAccessToken } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { AuthTokenResponse, VerifyEmailPayload } from '../../core/types';
import { AuthSplitLayout } from '../../shared/layouts/AuthSplitLayout';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { toast } from '../../shared/ui/ToastProvider';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState(params.get('email') || '');
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const hasQueryEmail = Boolean(params.get('email'));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const code = digits.join('');
  const codeValid = /^\d{6}$/.test(code);
  const isFormValid = emailValid && codeValid;

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submitCode = async (targetEmail: string, targetCode: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail) || !/^\d{6}$/.test(targetCode)) return;
    setLoading(true);

    const payload: VerifyEmailPayload = { email: targetEmail.trim(), code: targetCode };
    const res = await apiFetch<AuthTokenResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok || !res.body.data?.access_token) {
      toast.error(res.body.message || 'Invalid or expired verification code.', 'Verification Failed');
      return;
    }

    setAccessToken(res.body.data.access_token);
    await refreshProfile();
    toast.success('Email verified! Let’s set up your business.', 'Verified');
    navigate('/onboarding', { replace: true });
  };

  const handleDigitChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    const joined = next.join('');
    if (joined.length === 6 && emailValid) {
      void submitCode(email, joined);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, idx) => {
      next[idx] = char;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6 && emailValid) {
      void submitCode(email, pasted);
    }
  };

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    void submitCode(email, code);
  };

  const handleResend = async () => {
    if (!emailValid) return;
    const res = await apiFetch('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    });
    if (res.ok) {
      toast.success('A new 6-digit verification code has been sent.', 'Code Sent');
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
      setCooldown(60);
    } else {
      toast.error(res.body.message || 'Could not resend code.', 'Request Failed');
    }
  };

  return (
    <AuthSplitLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${email || 'your email'}. Enter it below to continue.`}
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {!hasQueryEmail && (
          <Input
            label="Email address"
            type="email"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={email.length > 0 && !emailValid ? 'Enter a valid email address' : undefined}
            required
          />
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Enter 6-Digit Verification Code
          </label>
          <div className="grid grid-cols-6 gap-2.5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-full h-12 sm:h-14 text-center text-xl font-bold text-slate-900 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/25 focus:border-brand-600 transition-all"
              />
            ))}
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={loading} disabled={!isFormValid}>
          Verify &amp; Continue
        </Button>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <Link to="/auth/login" className="text-slate-600 hover:underline">
            Back to login
          </Link>
          <button
            type="button"
            disabled={cooldown > 0 || !emailValid}
            onClick={handleResend}
            className="text-brand-600 font-semibold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
