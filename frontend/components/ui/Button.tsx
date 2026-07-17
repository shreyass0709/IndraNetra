'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'border border-border bg-card text-foreground hover:bg-secondary',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      // A spinner is a visual-only signal; aria-busy states it for screen readers.
      aria-busy={loading || undefined}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium transition focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
