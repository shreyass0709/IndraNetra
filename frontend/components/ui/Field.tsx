'use client';

/**
 * Form primitives shared by the auth pages. Phase 2 grows this into the full
 * components/ui set; these are the pieces the auth screens need today.
 *
 * Accessibility is not optional here (REBUILD_SPEC.md §10): every input is bound to
 * a real <label>, errors are announced, and focus rings are visible.
 */

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { copy } from '../../lib/copy';

const inputStyles =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base ' +
  'text-foreground placeholder:text-muted-foreground outline-none transition ' +
  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-destructive';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, id, ...props }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={inputStyles}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ label, hint, error, id, ...props }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`${inputStyles} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // The icon alone doesn't say what the button does, so the label carries it.
          aria-label={visible ? copy.login.hidePassword : copy.login.showPassword}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
