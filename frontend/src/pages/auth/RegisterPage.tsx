import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../core/api/httpClient';
import type { RegisterPayload } from '../../core/types';
import { AuthSplitLayout } from '../../shared/layouts/AuthSplitLayout';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { PasswordInput } from '../../shared/ui/PasswordInput';
import { toast } from '../../shared/ui/ToastProvider';

export function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid &&
    phone.trim().length >= 7 &&
    passwordLongEnough &&
    passwordsMatch &&
    agreed;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);

    const payload: RegisterPayload = {
      owner_name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      phone: phone.trim(),
      password,
    };

    const res = await apiFetch<{ email: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error(res.body.message || 'Registration failed.', 'Signup Error');
      return;
    }

    toast.success('Verification code sent to your email.', 'Account Created');
    navigate(`/auth/verify-email?email=${encodeURIComponent(payload.email)}`);
  };

  return (
    <AuthSplitLayout title="Get Started Now" subtitle="Enter your credentials to create your BusinessOS account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input label="First name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Email address"
            type="email"
            placeholder="you@business.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={email.length > 0 && !emailValid ? 'Enter a valid email address' : undefined}
            required
          />
          <Input label="Phone number" type="tel" placeholder="08012345678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <PasswordInput
            label="Password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={password.length > 0 && !passwordLongEnough ? 'Must be at least 8 characters' : undefined}
            required
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
          />
          <span>
            I agree to the <span className="underline text-slate-900 font-medium">Terms</span> &amp;{' '}
            <span className="underline text-slate-900 font-medium">Privacy</span>
          </span>
        </label>

        <Button type="submit" fullWidth isLoading={loading} disabled={!isFormValid}>
          Create Account
        </Button>

        <p className="text-xs text-slate-500 pt-1">
          Have an account?{' '}
          <Link to="/auth/login" className="text-brand-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
