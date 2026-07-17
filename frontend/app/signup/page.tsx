'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { MailCheck } from 'lucide-react';

import { api } from '../../services/api';
import { copy } from '../../lib/copy';
import { AuthShell, FormError } from '../../components/ui/AuthShell';
import { Field, PasswordField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

// Roles a person can pick for themselves. ADMIN is absent by design, and the backend
// rejects it independently -- this list is convenience, not the security boundary.
const SELECTABLE_ROLES = ['PUBLIC', 'VOLUNTEER', 'ORGANIZER'] as const;
type SelectableRole = (typeof SELECTABLE_ROLES)[number];

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<SelectableRole>('PUBLIC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.register({ name, email, password, role });
      // No session yet -- the account exists but the email isn't confirmed. Show the
      // next step rather than pretending they're signed in.
      setRegisteredEmail(email);
    } catch (err: any) {
      setError(err?.message || copy.signup.failed);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential?: string) {
    if (!credential) return;
    setError('');
    setLoading(true);
    try {
      // Google accounts arrive already verified, so this signs them straight in.
      // The role chosen above still goes through the same approval gates server-side.
      const res = await api.googleLogin({ idToken: credential, role });
      router.push(
        res.user?.needsProfileSetup
          ? '/profile-setup'
          : `/${String(res.user.role).toLowerCase()}/dashboard`,
      );
    } catch (err: any) {
      setError(err?.message || copy.signup.failed);
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return (
      <AuthShell title={copy.signup.checkEmail.title}>
        <div className="space-y-4">
          <MailCheck className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-foreground">{copy.signup.checkEmail.body(registeredEmail)}</p>
          <p className="text-sm text-muted-foreground">{copy.signup.checkEmail.hint}</p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.signup.loginLink}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={copy.signup.title} subtitle={copy.signup.subtitle}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError message={error} />

        <Field
          label={copy.signup.name}
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Field
          label={copy.signup.email}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          label={copy.signup.password}
          name="password"
          autoComplete="new-password"
          required
          hint={copy.signup.passwordHint}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Radio cards rather than a <select>: the choice changes what the account
            can do and what approval it needs, so keep the trade-offs on screen. */}
        <fieldset className="space-y-2">
          <legend className="mb-2 block text-sm font-medium text-foreground">
            {copy.signup.roleLabel}
          </legend>
          {SELECTABLE_ROLES.map((r) => {
            const selected = role === r;
            return (
              <label
                key={r}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={selected}
                  onChange={() => setRole(r)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span>
                  <span className="block font-medium text-foreground">{copy.roles[r].label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {copy.roles[r].description}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <Button type="submit" loading={loading}>
          {loading ? copy.signup.submitting : copy.signup.submit}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">{copy.login.orGoogle}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={(res) => handleGoogle(res.credential)}
          onError={() => setError(copy.errors.generic)}
          width="352"
        />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {copy.signup.haveAccount}{' '}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {copy.signup.loginLink}
        </Link>
      </p>
    </AuthShell>
  );
}
