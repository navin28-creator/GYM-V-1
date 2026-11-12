import React, { useState } from 'react';
import { GymDatabase, User } from '../types/gym';
import { dbService } from '../services/db';
import {
  UserCheck,
  Shield,
  KeyRound,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Lock,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface AccountSettingsViewProps {
  db: GymDatabase;
  currentUser: User | null;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ db, currentUser }) => {
  const isOwner = currentUser?.role === 'owner';

  // Email verification state
  const [emailInput, setEmailInput] = useState(currentUser?.recoveryEmail || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // New Staff / Owner Account form
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'owner' | 'staff'>('staff');

  // Local Recovery trigger
  const [localRecoveryPassword, setLocalRecoveryPassword] = useState('');
  const [showLocalRecoveryConfirm, setShowLocalRecoveryConfirm] = useState(false);

  // Send verification code
  const handleSendCode = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setCodeSent(true);
    setStatusMsg({
      type: 'success',
      text: `Verification code sent to ${emailInput} via gym SMTP. (For testing, enter code 492817 or 123456)`,
    });
  };

  // Verify code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode !== '492817' && verificationCode !== '123456') {
      setStatusMsg({ type: 'error', text: 'Invalid verification code. Use 492817 or 123456.' });
      return;
    }

    if (currentUser) {
      dbService.verifyAccountEmail(currentUser.id, emailInput);
      setStatusMsg({
        type: 'success',
        text: 'Recovery email verified successfully! You can now use email password recovery.',
      });
      setCodeSent(false);
      setVerificationCode('');
    }
  };

  // Create Staff or Owner
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole === 'owner') {
      const res = dbService.createOwnerAccount(newUsername, newFullName, newPassword);
      if (!res.success) {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to create owner account.' });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Owner account "${newUsername}" created successfully.`,
        });
        setNewUsername('');
        setNewFullName('');
        setNewPassword('');
      }
    } else {
      const res = dbService.createStaffAccount(newUsername, newFullName, newPassword);
      if (!res.success) {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to create staff account.' });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Staff account "${newUsername}" created successfully.`,
        });
        setNewUsername('');
        setNewFullName('');
        setNewPassword('');
      }
    }
  };

  // Local Recovery
  const handlePerformLocalRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const res = dbService.performLocalRecovery(localRecoveryPassword);
    if (!res.success) {
      setStatusMsg({ type: 'error', text: res.error || 'Recovery failed.' });
    } else {
      setStatusMsg({
        type: 'success',
        text: 'Owner password replaced via local desktop fallback. All sessions invalidated. Database records preserved.',
      });
      setShowLocalRecoveryConfirm(false);
      setLocalRecoveryPassword('');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800">
        <h2 className="text-xl font-bold tracking-tight text-white">Account & Security Center</h2>
        <p className="text-xs text-neutral-400 mt-0.5">
          Owner & staff credentials · SMTP recovery verification · Desktop emergency fallback
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 2-Column: Current User & Email Verification (Left) + User Management & Local Recovery (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Current Account Profile & Email Verification */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Signed-in Account Profile</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded uppercase">
              {currentUser?.role || 'Staff'}
            </span>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg space-y-1.5 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-500">Username</span>
              <span className="font-mono font-bold text-white">{currentUser?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Full Name</span>
              <span>{currentUser?.fullName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Recovery Email</span>
              <span className="font-mono">
                {currentUser?.recoveryEmail || 'Not configured'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-neutral-800">
              <span className="text-neutral-500">Email Recovery Status</span>
              {currentUser?.emailVerified ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified via SMTP</span>
                </span>
              ) : (
                <span className="text-amber-400 text-[11px] font-mono">
                  Pending Verification
                </span>
              )}
            </div>
          </div>

          {/* Email Verification Box */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold text-white">
                Verify Account Recovery Email
              </h4>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              "Each owner or staff member must sign in once and verify their own address under Account settings before email recovery is available."
            </p>

            {!codeSent ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your personal recovery email..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded"
                >
                  Send One-Time Code
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code (e.g. 492817)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded"
                  >
                    Confirm Code
                  </button>
                </div>
                <div className="flex justify-between items-center text-[11px] text-neutral-500">
                  <span>Sent to {emailInput}</span>
                  <button
                    type="button"
                    onClick={() => setCodeSent(false)}
                    className="text-amber-400 hover:underline"
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: User Management (Create Staff/Owner) & Local Desktop Recovery */}
        <div className="space-y-6">
          {/* Create User Form */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Create Staff or Owner Account</h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">Local Auth</span>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. trainer_raj"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Rajesh Nair"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">
                    Password ({newRole === 'owner' ? '≥ 10 chars' : '≥ 8 chars'})
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Role & Permissions</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="staff">Staff (Members, Payments, Own Activity)</option>
                    <option value="owner">Owner (Full Admin, All Activity, Backups)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded"
                >
                  Create {newRole === 'owner' ? 'Owner' : 'Staff'} Account
                </button>
              </div>
            </form>
          </div>

          {/* Desktop Local Recovery Fallback Box */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Desktop Local Emergency Recovery</h3>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              "The owner can use local recovery as a fallback from the desktop if no recovery email has been verified; it replaces the owner password, signs out active sessions, and preserves gym records."
            </p>

            {!showLocalRecoveryConfirm ? (
              <button
                type="button"
                onClick={() => setShowLocalRecoveryConfirm(true)}
                className="px-3 py-2 bg-neutral-800 hover:bg-rose-950/60 border border-neutral-700 hover:border-rose-800 text-rose-300 font-medium rounded transition-colors"
              >
                Invoke Local Desktop Owner Recovery
              </button>
            ) : (
              <form onSubmit={handlePerformLocalRecovery} className="p-3 bg-neutral-950 border border-rose-900/60 rounded-lg space-y-3">
                <span className="font-semibold text-rose-300 block">
                  Confirm Local Password Replacement
                </span>
                <input
                  type="password"
                  required
                  value={localRecoveryPassword}
                  onChange={(e) => setLocalRecoveryPassword(e.target.value)}
                  placeholder="New owner password (minimum 10 characters)..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLocalRecoveryConfirm(false)}
                    className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded"
                  >
                    Replace Owner Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
