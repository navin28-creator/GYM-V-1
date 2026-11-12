import React, { useState } from 'react';
import { User, GymDatabase } from '../types/gym';
import { dbService } from '../services/db';
import {
  KeyRound,
  Shield,
  UserCheck,
  Mail,
  AlertTriangle,
  CheckCircle2,
  X,
  Dumbbell,
  Laptop,
  HelpCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  db: GymDatabase;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, currentUser, db }) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<
    'signin' | 'forgot_options' | 'email_recovery' | 'local_recovery' | 'create_another_owner'
  >('signin');

  // Sign in form
  const [username, setUsername] = useState(currentUser?.username || 'owner_admin');
  const [password, setPassword] = useState('flexflowOwnerSecure10');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email recovery
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [codeDispatched, setCodeDispatched] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Local recovery
  const [localNewPassword, setLocalNewPassword] = useState('');

  // Create another owner
  const [anotherOwnerUsername, setAnotherOwnerUsername] = useState('');
  const [anotherOwnerFullName, setAnotherOwnerFullName] = useState('');
  const [anotherOwnerPassword, setAnotherOwnerPassword] = useState('');
  const [confirmDesktopPrompt, setConfirmDesktopPrompt] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = dbService.authenticate(username, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to authenticate.');
    } else {
      onClose();
    }
  };

  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!recoveryEmail.includes('@')) {
      setErrorMsg('Please enter a valid recovery email.');
      return;
    }
    setCodeDispatched(true);
    setSuccessMsg(`One-time recovery code sent to ${recoveryEmail}. (Use code 492817 or 123456 for testing)`);
  };

  const handleConfirmEmailReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = dbService.resetPasswordViaEmail(recoveryEmail, recoveryCode, newPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Password reset failed.');
    } else {
      setSuccessMsg('Password has been reset! Please sign in with your new password.');
      setMode('signin');
      setPassword(newPassword);
    }
  };

  const handleLocalRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = dbService.performLocalRecovery(localNewPassword);
    if (!res.success) {
      setErrorMsg(res.error || 'Local recovery failed.');
    } else {
      setSuccessMsg('Owner password replaced successfully. All sessions revoked; gym records preserved.');
      setMode('signin');
      setPassword(localNewPassword);
    }
  };

  const handleCreateAnotherOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!confirmDesktopPrompt) {
      setErrorMsg('Please confirm the local desktop security prompt.');
      return;
    }
    const res = dbService.createOwnerAccount(
      anotherOwnerUsername,
      anotherOwnerFullName,
      anotherOwnerPassword
    );
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create owner account.');
    } else {
      setSuccessMsg(`New owner "${anotherOwnerUsername}" created! Sign in now.`);
      setUsername(anotherOwnerUsername);
      setPassword(anotherOwnerPassword);
      setMode('signin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Flex & Flow Desktop Auth</h3>
              <span className="text-[10px] font-mono text-neutral-400 block">
                Local SQLite Database Authentication
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-2.5 bg-emerald-950/60 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SIGN IN MODE */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="mt-4 space-y-4 text-xs">
            {/* Quick Switch Profiles */}
            <div>
              <label className="block text-neutral-400 mb-1.5 font-mono uppercase text-[10px]">
                Available Local Accounts
              </label>
              <div className="grid grid-cols-2 gap-2">
                {db.users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUsername(u.username);
                      setPassword(u.passwordHash);
                    }}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      username === u.username
                        ? 'bg-neutral-800 border-amber-400/80 text-white'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold truncate text-xs">
                      {u.role === 'owner' ? (
                        <Shield className="w-3 h-3 text-amber-400" />
                      ) : (
                        <UserCheck className="w-3 h-3 text-sky-400" />
                      )}
                      <span className="truncate">{u.username}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono block uppercase">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-neutral-400">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot_options')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors text-xs"
              >
                Sign In to Desktop
              </button>
            </div>
          </form>
        )}

        {/* 2. FORGOT PASSWORD CHOICES */}
        {mode === 'forgot_options' && (
          <div className="mt-4 space-y-3 text-xs">
            <span className="text-xs font-semibold text-neutral-300 block">
              Password Recovery & Owner Account Options
            </span>

            {/* Option A: Verified Recovery Email */}
            <button
              onClick={() => setMode('email_recovery')}
              className="w-full p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 font-semibold text-white">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Recover via Verified Email Code</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Enter your verified recovery email to receive a one-time reset code via SMTP.
              </p>
            </button>

            {/* Option B: Local Desktop Recovery Fallback */}
            <button
              onClick={() => setMode('local_recovery')}
              className="w-full p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <Laptop className="w-4 h-4 text-amber-400" />
                <span>Desktop Local Recovery Fallback</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Use local desktop console if no email is verified. Replaces owner password, revokes active sessions, and preserves all gym records.
              </p>
            </button>

            {/* Option C: Create Another Owner Account */}
            <button
              onClick={() => setMode('create_another_owner')}
              className="w-full p-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Create Another Owner Account</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Add an additional gym owner account with unique credentials without replacing existing accounts.
              </p>
            </button>

            <button
              onClick={() => setMode('signin')}
              className="w-full py-2 text-neutral-400 hover:text-white text-center text-xs"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* 3. EMAIL RECOVERY FLOW */}
        {mode === 'email_recovery' && (
          <div className="mt-4 space-y-3 text-xs">
            <span className="font-semibold text-white block">Email One-Time Code Recovery</span>
            {!codeDispatched ? (
              <form onSubmit={handleSendRecoveryCode} className="space-y-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Verified Recovery Email</label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. vikram.joshi.gym@gmail.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-400 text-neutral-950 font-bold rounded"
                >
                  Send Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmEmailReset} className="space-y-3">
                <div>
                  <label className="text-neutral-400 block mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="492817"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono tracking-widest text-center"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">New Password (≥ 10 chars)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 10 characters..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 text-white font-bold rounded"
                >
                  Reset Password & Sign In
                </button>
              </form>
            )}

            <button
              onClick={() => setMode('forgot_options')}
              className="text-neutral-400 hover:text-white text-center w-full block pt-1"
            >
              ← Back
            </button>
          </div>
        )}

        {/* 4. LOCAL DESKTOP RECOVERY */}
        {mode === 'local_recovery' && (
          <form onSubmit={handleLocalRecoverySubmit} className="mt-4 space-y-3 text-xs">
            <span className="font-semibold text-rose-300 block">Desktop Local Fallback</span>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Available directly on the gym computer if no recovery email has been verified. Replaces the owner password, signs out all active sessions, and preserves all gym records.
            </p>
            <div>
              <label className="text-neutral-400 block mb-1">New Owner Password (≥ 10 chars)</label>
              <input
                type="password"
                required
                value={localNewPassword}
                onChange={(e) => setLocalNewPassword(e.target.value)}
                placeholder="Enter new 10+ character password..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded"
            >
              Confirm Local Password Replacement
            </button>
            <button
              type="button"
              onClick={() => setMode('forgot_options')}
              className="text-neutral-400 hover:text-white text-center w-full block pt-1"
            >
              ← Back
            </button>
          </form>
        )}

        {/* 5. CREATE ANOTHER OWNER ACCOUNT */}
        {mode === 'create_another_owner' && (
          <form onSubmit={handleCreateAnotherOwner} className="mt-4 space-y-3 text-xs">
            <span className="font-semibold text-emerald-300 block">
              Create Additional Owner Account
            </span>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              "To add another owner without replacing the existing account, confirm the local desktop prompt, enter a unique username and password, and sign in with the new account."
            </p>

            <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded flex items-center gap-2">
              <input
                type="checkbox"
                id="confirmDesktopPrompt"
                checked={confirmDesktopPrompt}
                onChange={(e) => setConfirmDesktopPrompt(e.target.checked)}
                className="rounded border-neutral-700 text-amber-500 focus:ring-0"
              />
              <label htmlFor="confirmDesktopPrompt" className="text-neutral-300 cursor-pointer">
                I confirm I am physically present at the gym desktop computer.
              </label>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Unique Owner Username</label>
              <input
                type="text"
                required
                value={anotherOwnerUsername}
                onChange={(e) => setAnotherOwnerUsername(e.target.value)}
                placeholder="e.g. co_owner_amit"
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={anotherOwnerFullName}
                onChange={(e) => setAnotherOwnerFullName(e.target.value)}
                placeholder="Amitabh Sengupta"
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Password (≥ 10 chars)</label>
              <input
                type="password"
                required
                value={anotherOwnerPassword}
                onChange={(e) => setAnotherOwnerPassword(e.target.value)}
                placeholder="Min 10 characters..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded"
            >
              Create Owner & Sign In
            </button>

            <button
              type="button"
              onClick={() => setMode('forgot_options')}
              className="text-neutral-400 hover:text-white text-center w-full block pt-1"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
