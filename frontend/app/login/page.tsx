'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';

import { api } from '../../services/api';
import { copy } from '../../lib/copy';
import { AuthShell, FormError } from '../../components/ui/AuthShell';
import { Field, PasswordField } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';

/**
 * Where each role lands after signing in.
 *
 * Phase 1: every role shares /dashboard, which picks its own content by role.
 * Phase 2 gives each role its own route and this becomes one entry per role.
 * Kept in step with homeForRole() in lib/session.ts.
 */
function homeForRole(_role: string): string {
  return '/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // proxy.ts already redirects signed-in visitors away from this page, so there is
  // no need to call /auth/me on mount the way the old page did.

  function goAfterLogin(user: { role: string; needsProfileSetup?: boolean }) {
    if (user.needsProfileSetup) {
      router.push('/profile-setup');
      return;
    }
    // Only accept an internal path from ?next= -- an absolute URL here would let a
    // crafted link bounce someone to another site straight after signing in.
    const next = searchParams.get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    router.push(safeNext ?? homeForRole(user.role));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      goAfterLogin(res.user);
    } catch (err: any) {
      // The server's message is the useful one ("waiting for approval", "confirm
      // your email"). Fall back only when there isn't one.
      setError(err?.message || copy.login.failed);
      setLoading(false);
    }
  }

  async function handleGoogle(credential?: string) {
    if (!credential) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.googleLogin({ idToken: credential });
      goAfterLogin(res.user);
    } catch (err: any) {
      setError(err?.message || copy.login.failed);
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError message={error} />

        <Field
          label={copy.login.email}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <PasswordField
          label={copy.login.password}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            {copy.login.forgot}
          </Link>
        </div>

        <Button type="submit" loading={loading}>
          {loading ? copy.login.submitting : copy.login.submit}
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
        {copy.login.noAccount}{' '}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          {copy.login.signupLink}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title={copy.login.title} subtitle={copy.login.subtitle}>
      {/* useSearchParams() (for ?next=) opts the subtree into client rendering, so
          Next requires a Suspense boundary around it or the page can't prerender. */}
      <Suspense fallback={<div className="h-96" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
