'use client';

import React, { useState } from 'react';
import { UserCheck, X, Check } from 'lucide-react';

interface PendingVolunteersProps {
  pending: any[];
  events: any[];
  onAssign: (volunteerId: string, eventId: string) => void;
  onReject: (volunteerId: string) => void;
}

/**
 * Approval panel for volunteer applications. Shown to ADMIN (Users tab) and
 * ORGANIZER (Volunteers tab). Each pending volunteer is assigned to an event
 * and approved in one action. Organizers only pass their own events in `events`,
 * so they can only assign to events they own (the backend re-checks this).
 */
export default function PendingVolunteers({ pending, events, onAssign, onReject }: PendingVolunteersProps) {
  // Per-row selected event id.
  const [selected, setSelected] = useState<Record<string, string>>({});

  const assignableEvents = events.filter(
    (e) => e.status !== 'Completed' && e.status !== 'Cancelled',
  );

  return (
    <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
      <h3 className="font-bold text-xs text-foreground mb-4 uppercase tracking-wider flex items-center gap-2 font-mono">
        <UserCheck className="w-4 h-4 text-blue-600" /> Pending Volunteer Approvals ({pending.length})
      </h3>

      {pending.length === 0 ? (
        <div className="text-center py-8 border border-border rounded-xl bg-background text-xs text-zinc-400 font-mono">
          [NO VOLUNTEERS AWAITING APPROVAL]
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((vol) => (
            <div
              key={vol.id}
              className="p-4 rounded-xl border border-border bg-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-sm text-zinc-800">{vol.user?.name || 'Volunteer'}</div>
                <div className="text-[11px] text-zinc-500 font-mono">{vol.user?.email}</div>
                {vol.skills && (
                  <div className="text-[10px] text-zinc-500">Skills: {vol.skills}</div>
                )}
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto">
                <select
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-xs text-zinc-900 focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
                  value={selected[vol.id] || ''}
                  onChange={(e) => setSelected((prev) => ({ ...prev, [vol.id]: e.target.value }))}
                >
                  <option value="">-- Assign to event --</option>
                  {assignableEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.location})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => onAssign(vol.id, selected[vol.id] || '')}
                  disabled={!selected[vol.id]}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={() => onReject(vol.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
