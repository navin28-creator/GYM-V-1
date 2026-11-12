import React from 'react';
import { GymDatabase, User, Member, MemberMembership, PaymentRecord } from '../types/gym';
import { formatINR, formatKolkataDate, formatKolkataDateTime } from '../services/crypto';
import { dbService } from '../services/db';
import {
  Users,
  CreditCard,
  ClipboardCheck,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  MessageSquare,
  Undo2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface DashboardViewProps {
  db: GymDatabase;
  currentUser: User | null;
  onNavigate: (tab: any) => void;
  onOpenAddMember: () => void;
  onOpenRecordPayment: (memberId?: string) => void;
  onOpenQuickCheckIn: () => void;
  onOpenReminderModal: (member: Member, balance: number, dueDate?: string) => void;
  onOpenUndoModal: (logId: string) => void;
  onSelectMember: (member: Member) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  currentUser,
  onNavigate,
  onOpenAddMember,
  onOpenRecordPayment,
  onOpenQuickCheckIn,
  onOpenReminderModal,
  onOpenUndoModal,
  onSelectMember,
}) => {
  // Metrics calculation
  const activeMembers = db.members.filter((m) => m.status === 'active');
  const todayCheckIns = db.checkIns;

  // Monthly revenue in INR (valid payments from this current month)
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyRevenueInr = db.payments
    .filter((p) => !p.isVoided && p.paymentDate.startsWith(currentMonthPrefix))
    .reduce((sum, p) => sum + p.amountInr, 0);

  // Calculate total outstanding balances across all members
  let totalOutstandingDuesInr = 0;
  const membersWithDues: { member: Member; balance: number; membership?: MemberMembership }[] = [];

  db.members.forEach((member) => {
    const summary = dbService.getMemberFinancialSummary(member.id);
    if (summary.outstandingBalanceInr > 0) {
      totalOutstandingDuesInr += summary.outstandingBalanceInr;
      membersWithDues.push({
        member,
        balance: summary.outstandingBalanceInr,
        membership: summary.activeMembership,
      });
    }
  });

  // Expiring memberships (ending in next 7 days or pending renewal)
  const expiringMembers = db.members.filter(
    (m) => m.status === 'pending_renewal' || m.status === 'expired'
  );

  // Recent activity logs (for owner: all; for staff: own)
  const visibleLogs = currentUser?.role === 'owner'
    ? db.activityLogs.slice(0, 6)
    : db.activityLogs.filter((l) => l.userId === currentUser?.id).slice(0, 6);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Gym Management Console
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Local SQLite instance · Single gym source-of-truth · Asia/Kolkata timezone
          </p>
        </div>

        {/* Quick Actions Strip */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('analytics')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>12M Analytics</span>
          </button>
          <button
            onClick={onOpenQuickCheckIn}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>Check-in Member</span>
          </button>
          <button
            onClick={() => onOpenRecordPayment()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4 text-sky-400" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* 4-Stat Primary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Members */}
        <div
          onClick={() => onNavigate('members')}
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Active Lifters</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {activeMembers.length}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              of {db.members.length} enrolled
            </span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            {expiringMembers.length} pending renewal / expired
          </div>
        </div>

        {/* Metric 2: Today's Check-ins */}
        <div
          onClick={() => onNavigate('attendance')}
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Today's Check-ins</span>
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {todayCheckIns.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">Floor active</span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Peak hours: 6:30 AM – 9:00 AM & 6:00 PM – 8:30 PM
          </div>
        </div>

        {/* Metric 3: Monthly Collections */}
        <div
          onClick={() => onNavigate('payments')}
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Month Collections (INR)</span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {formatINR(monthlyRevenueInr)}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">External ledger</span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            UPI, Cash, Bank Transfer, POS records
          </div>
        </div>

        {/* Metric 4: Outstanding Dues */}
        <div
          onClick={() => onNavigate('members')}
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Outstanding Balances</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
              {formatINR(totalOutstandingDuesInr)}
            </span>
            <span className="text-[11px] text-rose-400/80 font-mono">
              {membersWithDues.length} pending
            </span>
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            Instant 1-click WhatsApp reminder
          </div>
        </div>
      </div>

      {/* Main Grid: Dues & Expiring (Left 7 cols) + Recent Activity & Check-ins (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overdue Dues & Renewals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Pending Renewals & Outstanding Balances
              </h3>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {membersWithDues.length} members
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800">
            {membersWithDues.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                All member accounts are fully settled. No outstanding dues!
              </div>
            ) : (
              membersWithDues.map(({ member, balance, membership }) => (
                <div
                  key={member.id}
                  className="p-3.5 flex items-center justify-between hover:bg-neutral-800/40 transition-colors gap-3"
                >
                  <div
                    onClick={() => onSelectMember(member)}
                    className="min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-200 text-xs hover:text-amber-400 transition-colors">
                        {member.fullName}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {member.memberNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          member.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : member.status === 'pending_renewal'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {member.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                      <span>{member.phone}</span>
                      <span>·</span>
                      <span className="truncate">{membership?.planName || 'General Membership'}</span>
                      {membership?.endDate && (
                        <>
                          <span>·</span>
                          <span>Due: {formatKolkataDate(membership.endDate)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions for member with dues */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-rose-400 font-mono tabular-nums">
                      {formatINR(balance)}
                    </span>
                    <button
                      onClick={() => onOpenReminderModal(member, balance, membership?.endDate)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-md transition-colors"
                      title="Prepare WhatsApp/SMS reminder"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Remind</span>
                    </button>
                    <button
                      onClick={() => onOpenRecordPayment(member.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
                      title="Record external payment"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                      <span>Settle</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Check-in Roster Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Today's Check-in Feed</h3>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <span>Full Attendance</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
              {todayCheckIns.slice(0, 4).map((chk) => (
                <div key={chk.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-medium text-neutral-200">{chk.memberName}</span>
                      <span className="text-neutral-500 text-[11px] block font-mono">
                        Logged by {chk.recordedByUsername}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {formatKolkataDateTime(chk.checkInTime).split(',')[1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Log & Reversible Audit Trail */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>Activity & Undo Log</span>
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
            {visibleLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">No recent activity.</div>
            ) : (
              visibleLogs.map((log) => {
                const checkUndo = dbService.canUndoAction(log.id);
                return (
                  <div key={log.id} className="p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-neutral-300">{log.username}</span>
                        <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-neutral-800 text-neutral-400 rounded">
                          {log.role}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {formatKolkataDateTime(log.timestamp).split(',')[1]}
                      </span>
                    </div>

                    <p className="text-neutral-300 text-xs leading-snug">{log.description}</p>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      {log.reversalOfLogId ? (
                        <span className="text-purple-400 font-mono text-[10px]">
                          Linked Reversal Entry
                        </span>
                      ) : log.isReversed ? (
                        <span className="text-rose-400 font-mono text-[10px]">
                          Already Reversed
                        </span>
                      ) : (
                        <span className="text-neutral-500 font-mono text-[10px]">
                          {log.targetType}
                        </span>
                      )}

                      {/* Undo Action if allowed */}
                      {checkUndo.canUndo && (
                        <button
                          onClick={() => onOpenUndoModal(log.id)}
                          className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-950/30 hover:bg-amber-950/60 border border-amber-800/40 transition-colors"
                          title="Undo this action safely"
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Windows Desktop & Tailscale System Status Card */}
          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <span className="text-neutral-400 font-semibold block uppercase font-mono text-[11px]">
              Offline-First Architecture
            </span>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Flex & Flow writes directly to local SQLite (`%APPDATA%\Flex & Flow\gym.sqlite`). It functions completely without internet. Mobile staff connect over your private Tailscale network.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-800/80">
              <span>Tailscale: 100.92.14.88:3000</span>
              <span className="text-emerald-400">Serving Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
