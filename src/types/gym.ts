export type UserRole = 'owner' | 'staff';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  recoveryEmail?: string;
  emailVerified: boolean;
  createdAt: string;
}

export type MemberStatus = 'active' | 'expired' | 'pending_renewal' | 'frozen';

export interface Member {
  id: string;
  memberNumber: string; // e.g., FF-1001
  fullName: string;
  phone: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: MemberStatus;
  joinedDate: string; // YYYY-MM-DD
  avatarUrl?: string;
  fitnessGoal: string;
  healthNotes?: string;
  internalNotes?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  priceInr: number;
  category: 'Gym' | 'CrossFit' | 'Personal Training' | 'Combo';
  description: string;
}

export interface MemberMembership {
  id: string;
  memberId: string;
  planId: string;
  planName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalPriceInr: number;
  status: 'active' | 'expired' | 'cancelled';
  createdAt: string;
}

export type PaymentMethod = 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'POS Card';

export interface PaymentRecord {
  id: string;
  paymentNumber: string; // e.g., RCPT-2026-0042
  memberId: string;
  membershipId?: string;
  amountInr: number;
  method: PaymentMethod;
  referenceNumber: string; // UPI txn ID, UTR, or cheque no.
  paymentDate: string; // ISO string with Asia/Kolkata context
  recordedByUserId: string;
  recordedByUsername: string;
  isVoided: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedByUserId?: string;
  notes?: string;
}

export interface CheckInRecord {
  id: string;
  memberId: string;
  memberName: string;
  checkInTime: string; // ISO string
  recordedByUsername: string;
}

export type ActivityActionType =
  | 'create_member'
  | 'update_member'
  | 'delete_member'
  | 'assign_membership'
  | 'cancel_membership'
  | 'record_payment'
  | 'void_payment'
  | 'undo_action'
  | 'backup_export'
  | 'backup_restore'
  | 'owner_created'
  | 'password_reset'
  | 'local_recovery'
  | 'member_checkin';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO string (Asia/Kolkata)
  userId: string;
  username: string;
  role: UserRole;
  actionType: ActivityActionType;
  targetType: 'member' | 'membership' | 'payment' | 'user' | 'system' | 'checkin';
  targetId: string;
  targetName?: string;
  description: string;
  reversalOfLogId?: string;
  isReversible: boolean;
  isReversed?: boolean;
  snapshotBefore?: any;
  snapshotAfter?: any;
}

export interface BackupConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  senderEmail: string;
  recipientEmail: string;
  backupEncryptionKey: string; // 32-byte Base64 key
  initialDelayMinutes: number;
  intervalHours: number;
  autoBackupEnabled: boolean;
  lastBackupTimestamp?: string;
  lastBackupStatus?: 'success' | 'failed' | 'scheduled';
}

export interface TailscaleState {
  nodeName: string;
  tailnetIp: string;
  tailnetDomain: string;
  port: number;
  isServing: boolean;
  activeSessions: {
    deviceId: string;
    deviceName: string;
    username: string;
    lastSeen: string;
    ip: string;
  }[];
}

export interface GymDatabase {
  version: number;
  dbPath: string;
  users: User[];
  plans: MembershipPlan[];
  members: Member[];
  memberships: MemberMembership[];
  payments: PaymentRecord[];
  checkIns: CheckInRecord[];
  activityLogs: ActivityLogEntry[];
  backupConfig: BackupConfig;
  tailscale: TailscaleState;
}
