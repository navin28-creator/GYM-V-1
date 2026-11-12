import React, { useState } from 'react';
import { GymDatabase, Member, MemberStatus, User } from '../types/gym';
import { dbService } from '../services/db';
import { formatINR, formatKolkataDate, formatKolkataDateTime } from '../services/crypto';
import {
  Search,
  Plus,
  Filter,
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  CreditCard,
  Layers,
  MessageSquare,
  Edit2,
  Trash2,
  Printer,
  ShieldAlert,
  X,
} from 'lucide-react';

interface MembersViewProps {
  db: GymDatabase;
  currentUser: User | null;
  onOpenAddMember: () => void;
  onOpenRecordPayment: (memberId: string) => void;
  onOpenAssignMembership: (memberId: string) => void;
  onOpenReminderModal: (member: Member, balance: number, dueDate?: string) => void;
  onOpenReceiptModal: (paymentId: string) => void;
  selectedMember: Member | null;
  setSelectedMember: (member: Member | null) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  db,
  currentUser,
  onOpenAddMember,
  onOpenRecordPayment,
  onOpenAssignMembership,
  onOpenReminderModal,
  onOpenReceiptModal,
  selectedMember,
  setSelectedMember,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filtered members list
  const filteredMembers = db.members.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDeleteMember = (memberId: string) => {
    const result = dbService.deleteMember(memberId);
    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete member.');
    } else {
      setSelectedMember(null);
      setDeleteError(null);
    }
  };

  const handleUpdateMemberSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    dbService.updateMember(editingMember.id, editingMember);
    setSelectedMember(editingMember);
    setEditingMember(null);
  };

  // Detailed view of selected member
  const memberSummary = selectedMember
    ? dbService.getMemberFinancialSummary(selectedMember.id)
    : null;

  const memberPayments = selectedMember
    ? db.payments.filter((p) => p.memberId === selectedMember.id)
    : [];

  const memberMemberships = selectedMember
    ? db.memberships.filter((m) => m.memberId === selectedMember.id)
    : [];

  const memberCheckIns = selectedMember
    ? db.checkIns.filter((c) => c.memberId === selectedMember.id)
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Search Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Member Directory</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Total {db.members.length} registered athletes · Stored in local gym.sqlite
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, member #, or email..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filter Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
          {(['all', 'active', 'pending_renewal', 'expired', 'frozen'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {status === 'all'
                ? 'All'
                : status === 'pending_renewal'
                ? 'Pending Renewal'
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {deleteError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            onClick={() => setDeleteError(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Members Layout (Grid/Table + Drawer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Members Table (Left 7 or 12 cols) */}
        <div className={`${selectedMember ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[11px] border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Plan / Validity</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-500">
                        No members found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const summary = dbService.getMemberFinancialSummary(member.id);
                      const isSelected = selectedMember?.id === member.id;
                      return (
                        <tr
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className={`hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-neutral-800/80 border-l-2 border-amber-400' : ''
                          }`}
                        >
                          {/* Name & ID */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-neutral-200">
                              {member.fullName}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-500">
                              {member.memberNumber} · Joined {formatKolkataDate(member.joinedDate)}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-3">
                            <div className="font-mono text-neutral-300">{member.phone}</div>
                            <div className="text-[11px] text-neutral-400 truncate max-w-[150px]">
                              {member.email}
                            </div>
                          </td>

                          {/* Plan Status */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                                  member.status === 'active'
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                                    : member.status === 'pending_renewal'
                                    ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                                    : member.status === 'frozen'
                                    ? 'bg-sky-950/60 text-sky-400 border border-sky-800/60'
                                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                                }`}
                              >
                                {member.status.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate max-w-[160px] mt-0.5">
                              {summary.activeMembership?.planName || 'No Active Plan'}
                            </div>
                          </td>

                          {/* Balance */}
                          <td className="py-3 px-3 text-right">
                            {summary.outstandingBalanceInr > 0 ? (
                              <span className="font-mono font-bold text-rose-400 tabular-nums">
                                {formatINR(summary.outstandingBalanceInr)}
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-mono text-[11px]">
                                Settled
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMember(member);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                              title="View Details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
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

        {/* Selected Member Details Drawer (Right 5 cols) */}
        {selectedMember && memberSummary && (
          <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedMember.fullName}</h3>
                  <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                    {selectedMember.memberNumber}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">{selectedMember.fitnessGoal}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingMember(selectedMember)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                  title="Edit Member Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Action Buttons for Member */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onOpenRecordPayment(selectedMember.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-medium"
              >
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>Record Payment</span>
              </button>

              <button
                onClick={() => onOpenAssignMembership(selectedMember.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors font-medium"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Renew / Plan</span>
              </button>

              {memberSummary.outstandingBalanceInr > 0 && (
                <button
                  onClick={() =>
                    onOpenReminderModal(
                      selectedMember,
                      memberSummary.outstandingBalanceInr,
                      memberSummary.activeMembership?.endDate
                    )
                  }
                  className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 rounded-lg transition-colors font-semibold"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp/SMS Payment Reminder</span>
                </button>
              )}
            </div>

            {/* Financial Ledger Summary */}
            <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-400">
                <span>Total Billed Membership:</span>
                <span className="font-mono text-neutral-200 tabular-nums">
                  {formatINR(memberSummary.totalBilledInr)}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>External Payments Recorded:</span>
                <span className="font-mono text-emerald-400 tabular-nums">
                  {formatINR(memberSummary.totalPaidInr)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-neutral-800 font-semibold">
                <span className="text-neutral-300">Outstanding Balance:</span>
                <span
                  className={`font-mono text-sm tabular-nums ${
                    memberSummary.outstandingBalanceInr > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatINR(memberSummary.outstandingBalanceInr)}
                </span>
              </div>
            </div>

            {/* Profile & Emergency Contact */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-mono uppercase text-neutral-500 block">
                Contact & Emergency
              </span>
              <div className="bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/80 space-y-1.5 text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone</span>
                  <span className="font-mono">{selectedMember.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Email</span>
                  <span className="truncate max-w-[200px]">{selectedMember.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Emergency Contact</span>
                  <span>{selectedMember.emergencyContactName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Emergency Phone</span>
                  <span className="font-mono">{selectedMember.emergencyContactPhone}</span>
                </div>
                {selectedMember.healthNotes && (
                  <div className="pt-1 border-t border-neutral-800 text-amber-300/90 text-[11px]">
                    <strong>Health Declaration:</strong> {selectedMember.healthNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Payment History for this Member */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-neutral-500">
                  Payment History ({memberPayments.length})
                </span>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {memberPayments.length === 0 ? (
                  <div className="text-neutral-500 text-[11px] p-2">No payment records yet.</div>
                ) : (
                  memberPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 bg-neutral-950/50 border border-neutral-800 rounded flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-neutral-200">
                            {formatINR(p.amountInr)}
                          </span>
                          <span className="text-[10px] font-mono px-1 bg-neutral-800 text-neutral-400 rounded">
                            {p.method}
                          </span>
                          {p.isVoided && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-1 rounded">
                              VOID
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono block">
                          {formatKolkataDateTime(p.paymentDate)} · {p.referenceNumber}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenReceiptModal(p.id)}
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        title="Print / View Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Delete Member with Safety Notice */}
            <div className="pt-3 border-t border-neutral-800 flex justify-between items-center text-xs">
              <span className="text-neutral-500 text-[11px]">
                Safe deletion enforces zero historical records
              </span>
              <button
                onClick={() => handleDeleteMember(selectedMember.id)}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded hover:bg-rose-950/30 transition-colors"
                title="Only allowed if no financial or attendance records exist"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Member Details</h3>
              <button
                onClick={() => setEditingMember(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMemberSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingMember.fullName}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, fullName: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editingMember.phone}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, phone: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingMember.email}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, email: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Status</label>
                  <select
                    value={editingMember.status}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        status: e.target.value as MemberStatus,
                      })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">Active</option>
                    <option value="pending_renewal">Pending Renewal</option>
                    <option value="expired">Expired</option>
                    <option value="frozen">Frozen</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Fitness Goal</label>
                  <input
                    type="text"
                    value={editingMember.fitnessGoal}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, fitnessGoal: e.target.value })
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Health & Medical Notes</label>
                <textarea
                  rows={2}
                  value={editingMember.healthNotes || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, healthNotes: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-neutral-800 text-neutral-300 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
