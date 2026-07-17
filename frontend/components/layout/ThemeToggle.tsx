'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { copy } from '../../lib/copy';

/**
 * Light/dark toggle. The class is already on <html> before React hydrates (the inline
 * script in layout.tsx), so there is no flash; this only handles clicks and keeps the
 * icon in sync with the current state.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Read the state the no-FOUC script already applied, so the icon matches on load.
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? copy.shell.toLight : copy.shell.toDark}
      className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
