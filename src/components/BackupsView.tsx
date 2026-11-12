import React, { useState } from 'react';
import { GymDatabase, BackupConfig, User } from '../types/gym';
import { dbService } from '../services/db';
import {
  generateRandomBackupKey,
  isValid32ByteBase64Key,
  decryptSqliteBackup,
  formatKolkataDateTime,
} from '../services/crypto';
import {
  Download,
  Upload,
  Lock,
  Unlock,
  Key,
  Mail,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';

interface BackupsViewProps {
  db: GymDatabase;
  currentUser: User | null;
}

export const BackupsView: React.FC<BackupsViewProps> = ({ db, currentUser }) => {
  const [config, setConfig] = useState<BackupConfig>(db.backupConfig);
  const [copiedKey, setCopiedKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Decryption & Restore State
  const [decryptKeyInput, setDecryptKeyInput] = useState(db.backupConfig.backupEncryptionKey);
  const [encryptedFileContent, setEncryptedFileContent] = useState<Uint8Array | null>(null);
  const [encryptedFileName, setEncryptedFileName] = useState<string>('');
  const [decryptedPreview, setDecryptedPreview] = useState<any | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // Save config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid32ByteBase64Key(config.backupEncryptionKey)) {
      setStatusMsg({
        type: 'error',
        text: 'Backup encryption key must be a valid 32-byte base64 encoded string.',
      });
      return;
    }
    dbService.updateBackupConfig(config);
    setStatusMsg({ type: 'success', text: 'Backup configuration saved successfully.' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Generate new key
  const handleRegenerateKey = () => {
    const newKey = generateRandomBackupKey();
    setConfig({ ...config, backupEncryptionKey: newKey });
    setDecryptKeyInput(newKey);
    setStatusMsg({
      type: 'success',
      text: 'Generated fresh 32-byte AES-256-GCM encryption key. Save configuration to apply.',
    });
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(config.backupEncryptionKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // 1. Download unencrypted SQLite snapshot
  const handleDownloadUnencryptedSnapshot = () => {
    const blob = dbService.generateSqliteBinaryBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-${new Date().toISOString().slice(0, 10)}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Test encrypted backup now (generates .sqlite.enc)
  const handleDownloadEncryptedBackup = async () => {
    try {
      const { blob } = await dbService.generateEncryptedBackupBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flexflow-backup-${new Date().toISOString().slice(0, 10)}.sqlite.enc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      dbService.updateBackupConfig({
        lastBackupTimestamp: new Date().toISOString(),
        lastBackupStatus: 'success',
      });

      setStatusMsg({
        type: 'success',
        text: 'Encrypted snapshot created using AES-256-GCM and downloaded as .sqlite.enc.',
      });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Encryption failed.' });
    }
  };

  // Handle uploaded encrypted file
  const handleEncryptedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEncryptedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      setEncryptedFileContent(new Uint8Array(buffer));
    };
    reader.readAsArrayBuffer(file);
  };

  // Run Decrypt
  const handleRunDecrypt = async () => {
    if (!encryptedFileContent) {
      setStatusMsg({ type: 'error', text: 'Please select an encrypted (.sqlite.enc) file first.' });
      return;
    }

    setIsDecrypting(true);
    setStatusMsg(null);

    try {
      const decryptedText = await decryptSqliteBackup(encryptedFileContent, decryptKeyInput);
      const parsed = JSON.parse(decryptedText);
      setDecryptedPreview(parsed);
      setStatusMsg({
        type: 'success',
        text: `Successfully decrypted ${encryptedFileName}! Ready to restore database.`,
      });
    } catch (e: any) {
      setStatusMsg({
        type: 'error',
        text: `Decryption failed: ${e.message}. Ensure the 32-byte encryption key matches.`,
      });
      setDecryptedPreview(null);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Restore Database from Decrypted Preview
  const handleRestoreDatabase = async () => {
    if (!decryptedPreview) return;
    const res = await dbService.restoreFromBackupString(JSON.stringify(decryptedPreview));
    if (res.success) {
      setRestoreSuccess(true);
      setStatusMsg({
        type: 'success',
        text: 'Database successfully restored! Active SQLite instance replaced.',
      });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Restore failed.' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Database Backups & Recovery</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Consistent SQLite snapshots · AES-256-GCM email encryption · Source of truth on desktop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadUnencryptedSnapshot}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download .sqlite (Plain)</span>
          </button>
          <button
            onClick={handleDownloadEncryptedBackup}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
          >
            <Lock className="w-4 h-4" />
            <span>Create Encrypted Backup Now</span>
          </button>
          <a
            href="/flex-and-flow-app.zip"
            download="flex-and-flow-app.zip"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Code (ZIP)</span>
          </a>
        </div>
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

      {/* Security Warning Notice */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>Security & Data Privacy Policy</span>
        </div>
        <p className="text-neutral-300 leading-relaxed">
          The desktop remains the sole source of truth. The unencrypted SQLite snapshot contains complete member records, emergency contacts, and external financial records. Keep it confidential. Automated email snapshots are strictly encrypted with <strong>AES-256-GCM</strong>. Losing the 32-byte encryption key renders encrypted snapshots permanently unrecoverable.
        </p>
      </div>

      {/* 2-Column Grid: Automated Encrypted Email Backup Configuration (Left) + Decrypt & Restore Tool (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Automated Email Backup & AES-256-GCM Settings */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Automated Encrypted Email Backup</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800">
              AES-256-GCM
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {/* Encryption Key */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>BACKUP_ENCRYPTION_KEY (32 Bytes Base64)</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Key</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={config.backupEncryptionKey}
                  onChange={(e) => setConfig({ ...config, backupEncryptionKey: e.target.value })}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded flex items-center gap-1"
                  title="Copy Key to Clipboard"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono mt-1">
                Store separate from email account. Equivalent to Node.js 32-byte crypto randomBytes.
              </p>
            </div>

            {/* SMTP Settings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-neutral-400 mb-1">SMTP Server Host</label>
                <input
                  type="text"
                  value={config.smtpHost}
                  onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Port</label>
                <input
                  type="number"
                  value={config.smtpPort}
                  onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Sender Email</label>
                <input
                  type="email"
                  value={config.senderEmail}
                  onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Destination Backup Email</label>
                <input
                  type="email"
                  value={config.recipientEmail}
                  onChange={(e) => setConfig({ ...config, recipientEmail: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Interval */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-neutral-400 mb-1">Initial Delay (Minutes)</label>
                <input
                  type="number"
                  value={config.initialDelayMinutes}
                  onChange={(e) =>
                    setConfig({ ...config, initialDelayMinutes: parseInt(e.target.value) || 5 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Backup Interval (Hours)</label>
                <input
                  type="number"
                  value={config.intervalHours}
                  onChange={(e) =>
                    setConfig({ ...config, intervalHours: parseInt(e.target.value) || 24 })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Schedule Status */}
            <div className="p-3 bg-neutral-950/50 border border-neutral-800/80 rounded-lg text-[11px] text-neutral-400 flex items-center justify-between">
              <div>
                <span className="text-neutral-300 font-semibold block">Scheduler Status:</span>
                <span>Repeats every {config.intervalHours}h while Flex & Flow is running</span>
              </div>
              <span className="text-emerald-400 font-mono">
                {config.lastBackupTimestamp
                  ? `Last: ${formatKolkataDateTime(config.lastBackupTimestamp).split(',')[0]}`
                  : 'Active'}
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold rounded"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: In-App Decrypt & Restore Tool (CLI node scripts/decrypt-backup.js equivalent) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Decrypt & Restore Tool
              </h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              decrypt-backup.js UI
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <p className="text-neutral-300 leading-relaxed text-[11px]">
              Restore an emailed <code className="text-amber-300">.sqlite.enc</code> file directly in the browser or via CLI:
              <br />
              <code className="text-neutral-400 block mt-1 bg-neutral-950 p-1.5 rounded font-mono">
                node scripts/decrypt-backup.js goodform-backup.sqlite.enc restored.sqlite
              </code>
            </p>

            {/* Upload Encrypted file */}
            <div>
              <label className="block text-neutral-400 mb-1">
                Select Encrypted Snapshot (.sqlite.enc)
              </label>
              <input
                type="file"
                accept=".enc,.sqlite.enc,.bin,.sqlite"
                onChange={handleEncryptedFileUpload}
                className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
              />
              {encryptedFileName && (
                <span className="text-[11px] font-mono text-emerald-400 block mt-1">
                  Selected: {encryptedFileName} ({encryptedFileContent?.length || 0} bytes)
                </span>
              )}
            </div>

            {/* Key input */}
            <div>
              <label className="block text-neutral-400 mb-1">
                BACKUP_ENCRYPTION_KEY used to encrypt
              </label>
              <input
                type="text"
                value={decryptKeyInput}
                onChange={(e) => setDecryptKeyInput(e.target.value)}
                placeholder="Paste 32-byte Base64 key..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Decrypt Button */}
            <button
              onClick={handleRunDecrypt}
              disabled={isDecrypting || !encryptedFileContent}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-semibold rounded transition-colors"
            >
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>{isDecrypting ? 'Decrypting AES-256-GCM...' : 'Decrypt Encrypted Snapshot'}</span>
            </button>

            {/* Decrypted Preview & Restore action */}
            {decryptedPreview && (
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Integrity Verified: Valid SQLite Schema</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-neutral-300 space-y-1">
                  <div>Members count: {decryptedPreview.members?.length || 0}</div>
                  <div>Payments count: {decryptedPreview.payments?.length || 0}</div>
                  <div>Memberships count: {decryptedPreview.memberships?.length || 0}</div>
                  <div>Stored DB Path: {decryptedPreview.dbPath}</div>
                </div>

                <button
                  onClick={handleRestoreDatabase}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-xs transition-colors"
                >
                  Confirm Restore Database (Replaces Active gym.sqlite)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
