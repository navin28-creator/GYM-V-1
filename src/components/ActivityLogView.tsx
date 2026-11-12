import React, { useState } from 'react';
import { GymDatabase, ActivityLogEntry, User } from '../types/gym';
import { dbService } from '../services/db';
import { formatKolkataDateTime } from '../services/crypto';
import {
  History,
  Undo2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Filter,
  UserCheck,
  Shield,
  X,
  FileText,
} from 'lucide-react';

interface ActivityLogViewProps {
  db: GymDatabase;
  currentUser: User | null;
  onOpenUndoModal: (logId: string) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  db,
  currentUser,
  onOpenUndoModal,
}) => {
  const isOwner = currentUser?.role === 'owner';
  const [filterType, setFilterType] = useState<string>('all');

  // Owners can review all activity; staff can review their own activity
  const visibleLogs = isOwner
    ? db.activityLogs
    : db.activityLogs.filter((l) => l.userId === currentUser?.id);

  const filteredLogs = visibleLogs.filter((log) => {
    if (filterType === 'all') return true;
    if (filterType === 'reversible') return log.isReversible && !log.isReversed;
    if (filterType === 'reversed') return log.isReversed || log.reversalOfLogId;
    return log.targetType === filterType;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Activity & Audit Log</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {isOwner ? 'Owner Mode (Full Gym Audit)' : 'Staff Mode (Personal Log)'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Append-only audit trail · Undo appends linked reversal entries without deleting original records
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Events ({visibleLogs.length})
          </button>
          <button
            onClick={() => setFilterType('reversible')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'reversible'
                ? 'bg-neutral-800 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Undoable Actions
          </button>
          <button
            onClick={() => setFilterType('payment')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filterType === 'payment'
                ? 'bg-neutral-800 text-sky-300 font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      {/* Audit Policy Notice */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Reversible Undo Policy:</strong> Reversing an action keeps the original event and attaches a linked reversal record. Members or memberships with subsequent history cannot be deleted; external payments are voided rather than erased to preserve balance integrity.
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[11px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Timestamp (Asia/Kolkata)</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-3">Audit State</th>
                <th className="py-3 px-3 text-right">Undo Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No activity entries matching this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const check = dbService.canUndoAction(log.id);
                  return (
                    <tr key={log.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-neutral-400 whitespace-nowrap">
                        {formatKolkataDateTime(log.timestamp)}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {log.role === 'owner' ? (
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          <span className="font-semibold text-neutral-200">{log.username}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 uppercase font-mono text-[10px] text-neutral-500 whitespace-nowrap">
                        {log.targetType}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-neutral-300 max-w-md">
                        <div>{log.description}</div>
                        {log.reversalOfLogId && (
                          <span className="text-[10px] font-mono text-purple-400 block mt-0.5">
                            Reverses event ID: {log.reversalOfLogId}
                          </span>
                        )}
                      </td>

                      {/* Audit State */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {log.isReversed ? (
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                            Reversed
                          </span>
                        ) : log.reversalOfLogId ? (
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900">
                            Linked Reversal
                          </span>
                        ) : log.isReversible ? (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">
                            Safe to Reverse
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-neutral-500">
                            Permanent
                          </span>
                        )}
                      </td>

                      {/* Undo Action */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {check.canUndo ? (
                          <button
                            onClick={() => onOpenUndoModal(log.id)}
                            className="flex items-center gap-1 ml-auto text-xs font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 transition-colors"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Undo</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-neutral-600 font-mono">
                            {log.isReversed ? 'Undone' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
