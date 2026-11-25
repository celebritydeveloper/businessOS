import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch, setAccessToken } from '../../core/api/httpClient';
import { useAuth } from '../../core/auth/AuthContext';
import type { AuthTokenResponse, LoginPayload } from '../../core/types';
import { AuthSplitLayout } from '../../shared/layouts/AuthSplitLayout';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { PasswordInput } from '../../shared/ui/PasswordInput';
import { toast } from '../../shared/ui/ToastProvider';

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const isFormValid = emailValid && passwordValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);

    const payload: LoginPayload = { email: email.trim(), password };
    const res = await apiFetch<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      if (res.body.code === 'EMAIL_NOT_VERIFIED') {
        toast.warning('Please verify your email before logging in.', 'Email Unverified');
        navigate(`/auth/verify-email?email=${encodeURIComponent(payload.email)}`);
        return;
      }
      toast.error(res.body.message || 'Invalid email or password.', 'Login Failed');
      return;
    }

    if (res.body.data?.access_token) {
      setAccessToken(res.body.data.access_token);
      const profile = await refreshProfile();
      toast.success('Welcome back to BusinessOS!');
      if (!profile || profile.businesses.length === 0) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  return (
    <AuthSplitLayout title="Welcome back" subtitle="Sign in to manage your business.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={email.length > 0 && !emailValid ? 'Enter a valid email address' : undefined}
          required
        />

        <PasswordInput
          label="Password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={password.length > 0 && !passwordValid ? 'Password must be at least 8 characters' : undefined}
          rightSlot={
            <Link to="/auth/forgot-password" className="text-xs font-semibold text-brand-600 hover:underline">
              Forgot password?
            </Link>
          }
          required
        />

        <Button type="submit" fullWidth isLoading={loading} disabled={!isFormValid}>
          Login
        </Button>

        <p className="text-xs text-slate-500 pt-1">
          New to Business OS?{' '}
          <Link to="/auth/register" className="text-brand-600 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
