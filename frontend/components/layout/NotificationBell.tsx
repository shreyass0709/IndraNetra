'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { copy } from '../../lib/copy';

interface Note {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Note[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Live signal from the gateway; bumping the badge is enough -- the list is fetched
  // when the panel opens, so we don't need the payload itself here.
  const { notification } = useSocket();

  function refreshCount() {
    api
      .getUnreadNotificationCount()
      .then((r) => setUnread(r?.count ?? 0))
      .catch(() => {});
  }

  useEffect(refreshCount, []);
  useEffect(() => {
    if (notification) refreshCount();
  }, [notification]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;

    // Opening the panel loads the list and marks everything read (the badge clears
    // immediately; the request just persists it).
    try {
      const list = await api.getNotifications();
      setItems(Array.isArray(list) ? list : []);
      if (unread > 0) {
        setUnread(0);
        await api.markAllNotificationsRead().catch(() => {});
      }
    } catch {
      setItems([]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={copy.shell.notifications}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            aria-label={`${unread} unread`}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            {copy.shell.notifications}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {copy.shell.noNotifications}
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
