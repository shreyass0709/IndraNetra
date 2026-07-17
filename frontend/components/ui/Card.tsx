import React from 'react';

/**
 * The one card surface every page sits its content on. Rounded-xl border, no glass,
 * no glow -- those were removed with the old look (REBUILD_SPEC.md §10).
 */
export function Card({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-border bg-card text-card-foreground ${className}`}
    />
  );
}

export function CardHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`border-b border-border p-4 sm:p-6 ${className}`} />;
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 {...props} className={`text-lg font-semibold tracking-tight ${className}`} />
  );
}

export function CardBody({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`p-4 sm:p-6 ${className}`} />;
}
