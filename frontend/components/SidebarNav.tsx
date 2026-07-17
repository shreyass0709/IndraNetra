'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import { getNavForRole } from '../app/dashboard/utils';

/**
 * Role-aware sidebar. Renders exactly the modules NAV_BY_ROLE allows, as real
 * links — the same list `canAccessPath` gates routing on, so what is shown and
 * what is reachable cannot drift apart.
 */
export default function SidebarNav({
  user,
  onLogout,
}: {
  user?: { name?: string; role?: string } | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const items = getNavForRole(user?.role);

  return (
    <aside className="w-64 bg-card border-r border-border p-5 flex flex-col justify-between relative z-30 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-foreground tracking-tight block">
              INDRA<span className="text-blue-600">NETRA</span>
            </span>
            <span className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase block">
              SYSTEM COMMAND V3
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide border transition-all ${
                  isActive
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 shadow-sm'
                    : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider">COMMANDER</span>
            <span className="text-xs font-bold text-foreground max-w-[140px] truncate">{user?.name || 'Officer'}</span>
          </div>
          <span className="text-[9px] text-blue-600 font-bold px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase font-mono tracking-wider">
            {user?.role}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-100 hover:bg-red-50 border border-border hover:border-red-200 text-zinc-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
