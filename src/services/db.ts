import {
  User,
  Member,
  MembershipPlan,
  MemberMembership,
  PaymentRecord,
  CheckInRecord,
  ActivityLogEntry,
  BackupConfig,
  TailscaleState,
  UserRole,
  GymDatabase,
} from '../types/gym';
import { generateRandomBackupKey, encryptSqliteBackup, decryptSqliteBackup } from './crypto';

const DB_STORAGE_KEY = 'flex_flow_gym_sqlite_v1';
const AUTH_SESSION_KEY = 'flex_flow_current_session';

const DEFAULT_PLANS: MembershipPlan[] = [
  {
    id: 'plan-1',
    name: 'Monthly Strength & Cardio',
    durationDays: 30,
    priceInr: 1800,
    category: 'Gym',
    description: 'Full gym floor access, cardio theater, locker room, and initial fitness assessment.',
  },
  {
    id: 'plan-2',
    name: 'Quarterly Pro Transformation',
    durationDays: 90,
    priceInr: 4800,
    category: 'Gym',
    description: 'Quarterly membership with 1 body composition scan per month and diet consultation.',
  },
  {
    id: 'plan-3',
    name: 'Half-Yearly Flex Saver',
    durationDays: 180,
    priceInr: 8500,
    category: 'Gym',
    description: '6-month access with 1 guest pass per month and 15% discount on personal training.',
  },
  {
    id: 'plan-4',
    name: 'Annual Elite Unlimited',
    durationDays: 365,
    priceInr: 15000,
    category: 'Combo',
    description: '365 days 24/7 access, steam bath, CrossFit arena, and 2 free PT sessions.',
  },
  {
    id: 'plan-5',
    name: 'Personal Training 12-Pack',
    durationDays: 45,
    priceInr: 7200,
    category: 'Personal Training',
    description: '12 one-on-one sessions with certified strength coach and nutrition planning.',
  },
  {
    id: 'plan-6',
    name: 'Single Day Drop-In Pass',
    durationDays: 1,
    priceInr: 300,
    category: 'Gym',
    description: 'Single day workout pass including steam and locker access.',
  },
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-101',
    memberNumber: 'FF-1001',
    fullName: 'Rohan Mehta',
    phone: '+91 98201 44521',
    email: 'rohan.mehta@outlook.com',
    emergencyContactName: 'Deepa Mehta (Spouse)',
    emergencyContactPhone: '+91 98201 44522',
    status: 'active',
    joinedDate: '2025-08-15',
    fitnessGoal: 'Hypertrophy & Bench Press 100kg',
    healthNotes: 'Minor right shoulder impingement in 2024. Clear for overhead presses.',
    internalNotes: 'Consistent morning lifter, prefers 6:30 AM slot.',
  },
  {
    id: 'mem-102',
    memberNumber: 'FF-1002',
    fullName: 'Ananya Iyer',
    phone: '+91 99400 81234',
    email: 'ananya.iyer@gmail.com',
    emergencyContactName: 'Suresh Iyer (Father)',
    emergencyContactPhone: '+91 99400 81235',
    status: 'active',
    joinedDate: '2025-09-01',
    fitnessGoal: 'CrossFit conditioning and half marathon endurance',
    healthNotes: 'None',
    internalNotes: 'Joined with quarterly plan, very punctual.',
  },
  {
    id: 'mem-103',
    memberNumber: 'FF-1003',
    fullName: 'Vikramjit Singh',
    phone: '+91 98111 29384',
    email: 'vikram.singh92@yahoo.com',
    emergencyContactName: 'Harpreet Kaur (Sister)',
    emergencyContactPhone: '+91 98111 29385',
    status: 'pending_renewal',
    joinedDate: '2025-10-10',
    fitnessGoal: 'Fat loss and functional mobility',
    healthNotes: 'Mild asthma during winter change, carries inhaler.',
    internalNotes: 'Renewal due in 3 days. Send reminder on WhatsApp.',
  },
  {
    id: 'mem-104',
    memberNumber: 'FF-1004',
    fullName: 'Sneha Rao',
    phone: '+91 97422 19823',
    email: 'sneha.rao.blr@gmail.com',
    emergencyContactName: 'Raghav Rao (Brother)',
    emergencyContactPhone: '+91 97422 19824',
    status: 'active',
    joinedDate: '2025-11-20',
    fitnessGoal: 'Strength conditioning and posture correction',
    healthNotes: 'Sedentary IT job posture strain.',
    internalNotes: 'Taking Personal Training Pack.',
  },
  {
    id: 'mem-105',
    memberNumber: 'FF-1005',
    fullName: 'Karthik Narayanan',
    phone: '+91 98840 55192',
    email: 'karthik.nary@proton.me',
    emergencyContactName: 'Lakshmi N (Mother)',
    emergencyContactPhone: '+91 98840 55193',
    status: 'expired',
    joinedDate: '2025-06-12',
    fitnessGoal: 'General fitness',
    healthNotes: 'None',
    internalNotes: 'Membership ended 2 weeks ago; called once, asked to call back next week.',
  },
  {
    id: 'mem-106',
    memberNumber: 'FF-1006',
    fullName: 'Pooja Verma',
    phone: '+91 98199 67321',
    email: 'pooja.verma@corp.in',
    emergencyContactName: 'Amit Verma (Husband)',
    emergencyContactPhone: '+91 98199 67322',
    status: 'active',
    joinedDate: '2026-01-05',
    fitnessGoal: 'Core strength and stamina',
    healthNotes: 'None',
    internalNotes: 'Annual Elite subscriber.',
  },
  {
    id: 'mem-107',
    memberNumber: 'FF-1007',
    fullName: 'Arun Kumar',
    phone: '+91 94433 11822',
    email: 'arun.k.cbe@gmail.com',
    emergencyContactName: 'Mani Kumar (Father)',
    emergencyContactPhone: '+91 94433 11823',
    status: 'frozen',
    joinedDate: '2025-07-22',
    fitnessGoal: 'Powerlifting squat/deadlift',
    healthNotes: 'Knee strain on Oct 2025; requested 30-day membership pause.',
    internalNotes: 'Account frozen till end of next week.',
  },
  {
    id: 'mem-108',
    memberNumber: 'FF-1008',
    fullName: 'Divya Pillai',
    phone: '+91 96190 28190',
    email: 'divya.pillai@designstudio.in',
    emergencyContactName: 'Radha Pillai (Mother)',
    emergencyContactPhone: '+91 96190 28191',
    status: 'active',
    joinedDate: '2026-02-01',
    fitnessGoal: 'Cardio endurance & agility',
    healthNotes: 'None',
    internalNotes: 'Regular in evening spin classes.',
  },
];

const INITIAL_MEMBERSHIPS: MemberMembership[] = [
  {
    id: 'mship-1',
    memberId: 'mem-101',
    planId: 'plan-4',
    planName: 'Annual Elite Unlimited',
    startDate: '2025-08-15',
    endDate: '2026-08-14',
    totalPriceInr: 15000,
    status: 'active',
    createdAt: '2025-08-15T09:30:00.000Z',
  },
  {
    id: 'mship-2',
    memberId: 'mem-102',
    planId: 'plan-2',
    planName: 'Quarterly Pro Transformation',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    totalPriceInr: 4800,
    status: 'active',
    createdAt: '2026-01-01T10:15:00.000Z',
  },
  {
    id: 'mship-3',
    memberId: 'mem-103',
    planId: 'plan-1',
    planName: 'Monthly Strength & Cardio',
    startDate: '2026-01-15',
    endDate: '2026-02-14',
    totalPriceInr: 1800,
    status: 'active',
    createdAt: '2026-01-15T11:00:00.000Z',
  },
  {
    id: 'mship-4',
    memberId: 'mem-104',
    planId: 'plan-5',
    planName: 'Personal Training 12-Pack',
    startDate: '2026-01-20',
    endDate: '2026-03-06',
    totalPriceInr: 7200,
    status: 'active',
    createdAt: '2026-01-20T14:20:00.000Z',
  },
  {
    id: 'mship-5',
    memberId: 'mem-105',
    planId: 'plan-2',
    planName: 'Quarterly Pro Transformation',
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    totalPriceInr: 4800,
    status: 'expired',
    createdAt: '2025-10-01T08:00:00.000Z',
  },
  {
    id: 'mship-6',
    memberId: 'mem-106',
    planId: 'plan-4',
    planName: 'Annual Elite Unlimited',
    startDate: '2026-01-05',
    endDate: '2027-01-04',
    totalPriceInr: 15000,
    status: 'active',
    createdAt: '2026-01-05T09:00:00.000Z',
  },
  {
    id: 'mship-7',
    memberId: 'mem-107',
    planId: 'plan-3',
    planName: 'Half-Yearly Flex Saver',
    startDate: '2025-07-22',
    endDate: '2026-02-28',
    totalPriceInr: 8500,
    status: 'active',
    createdAt: '2025-07-22T10:00:00.000Z',
  },
  {
    id: 'mship-8',
    memberId: 'mem-108',
    planId: 'plan-1',
    planName: 'Monthly Strength & Cardio',
    startDate: '2026-02-01',
    endDate: '2026-03-02',
    totalPriceInr: 1800,
    status: 'active',
    createdAt: '2026-02-01T16:45:00.000Z',
  },
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    paymentNumber: 'RCPT-2025-0815',
    memberId: 'mem-101',
    membershipId: 'mship-1',
    amountInr: 15000,
    method: 'UPI',
    referenceNumber: 'UPI/522819201928/GPAY',
    paymentDate: '2025-08-15T09:35:00.000Z',
    recordedByUserId: 'usr-owner-1',
    recordedByUsername: 'owner_admin',
    isVoided: false,
    notes: 'Paid in full via GPay QR code at reception counter.',
  },
  {
    id: 'pay-002',
    paymentNumber: 'RCPT-2026-0101',
    memberId: 'mem-102',
    membershipId: 'mship-2',
    amountInr: 4800,
    method: 'UPI',
    referenceNumber: 'UPI/600189283741/PHONEPE',
    paymentDate: '2026-01-01T10:20:00.000Z',
    recordedByUserId: 'usr-staff-1',
    recordedByUsername: 'priya_coach',
    isVoided: false,
    notes: 'New Year offer applied. Full quarterly settlement.',
  },
  {
    id: 'pay-003',
    paymentNumber: 'RCPT-2026-0115',
    memberId: 'mem-103',
    membershipId: 'mship-3',
    amountInr: 1000,
    method: 'Cash',
    referenceNumber: 'CASH-REC-0115-01',
    paymentDate: '2026-01-15T11:05:00.000Z',
    recordedByUserId: 'usr-staff-1',
    recordedByUsername: 'priya_coach',
    isVoided: false,
    notes: 'Partial cash payment ₹1,000. Balance ₹800 pending.',
  },
  {
    id: 'pay-004',
    paymentNumber: 'RCPT-2026-0120',
    memberId: 'mem-104',
    membershipId: 'mship-4',
    amountInr: 7200,
    method: 'Bank Transfer',
    referenceNumber: 'NEFT-HDFC0000240-998231',
    paymentDate: '2026-01-20T14:30:00.000Z',
    recordedByUserId: 'usr-owner-1',
    recordedByUsername: 'owner_admin',
    isVoided: false,
    notes: 'Verified via gym bank statement NEFT credit.',
  },
  {
    id: 'pay-005',
    paymentNumber: 'RCPT-2026-0105',
    memberId: 'mem-106',
    membershipId: 'mship-6',
    amountInr: 15000,
    method: 'POS Card',
    referenceNumber: 'POS-TXN-PINELABS-88291',
    paymentDate: '2026-01-05T09:15:00.000Z',
    recordedByUserId: 'usr-staff-1',
    recordedByUsername: 'priya_coach',
    isVoided: false,
    notes: 'Swiped ICICI Visa debit card at front desk machine.',
  },
  {
    id: 'pay-006',
    paymentNumber: 'RCPT-2026-0201',
    memberId: 'mem-108',
    membershipId: 'mship-8',
    amountInr: 1800,
    method: 'UPI',
    referenceNumber: 'UPI/603219842109/PAYTM',
    paymentDate: '2026-02-01T16:50:00.000Z',
    recordedByUserId: 'usr-staff-1',
    recordedByUsername: 'priya_coach',
    isVoided: false,
    notes: 'February monthly fee paid via Paytm QR.',
  },
];

const INITIAL_CHECKINS: CheckInRecord[] = [
  {
    id: 'chk-1',
    memberId: 'mem-101',
    memberName: 'Rohan Mehta',
    checkInTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    recordedByUsername: 'owner_admin',
  },
  {
    id: 'chk-2',
    memberId: 'mem-102',
    memberName: 'Ananya Iyer',
    checkInTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    recordedByUsername: 'priya_coach',
  },
  {
    id: 'chk-3',
    memberId: 'mem-106',
    memberName: 'Pooja Verma',
    checkInTime: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    recordedByUsername: 'priya_coach',
  },
  {
    id: 'chk-4',
    memberId: 'mem-108',
    memberName: 'Divya Pillai',
    checkInTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    recordedByUsername: 'priya_coach',
  },
];

const INITIAL_ACTIVITY: ActivityLogEntry[] = [
  {
    id: 'act-01',
    timestamp: '2025-08-01T08:00:00.000Z',
    userId: 'usr-owner-1',
    username: 'owner_admin',
    role: 'owner',
    actionType: 'owner_created',
    targetType: 'system',
    targetId: 'usr-owner-1',
    description: 'Initial Gym Owner account created on Windows desktop installation.',
    isReversible: false,
  },
  {
    id: 'act-02',
    timestamp: '2025-08-15T09:30:00.000Z',
    userId: 'usr-owner-1',
    username: 'owner_admin',
    role: 'owner',
    actionType: 'create_member',
    targetType: 'member',
    targetId: 'mem-101',
    targetName: 'Rohan Mehta',
    description: 'Enrolled member Rohan Mehta (FF-1001).',
    isReversible: false, // Cannot be reversed because Rohan has active memberships and payments!
  },
  {
    id: 'act-03',
    timestamp: '2026-01-15T11:05:00.000Z',
    userId: 'usr-staff-1',
    username: 'priya_coach',
    role: 'staff',
    actionType: 'record_payment',
    targetType: 'payment',
    targetId: 'pay-003',
    targetName: 'RCPT-2026-0115',
    description: 'Recorded external payment of ₹1,000 (Cash) for Vikramjit Singh.',
    isReversible: true,
    snapshotBefore: null,
    snapshotAfter: { paymentId: 'pay-003', amountInr: 1000, memberId: 'mem-103' },
  },
  {
    id: 'act-04',
    timestamp: '2026-02-01T16:50:00.000Z',
    userId: 'usr-staff-1',
    username: 'priya_coach',
    role: 'staff',
    actionType: 'record_payment',
    targetType: 'payment',
    targetId: 'pay-006',
    targetName: 'RCPT-2026-0201',
    description: 'Recorded external payment of ₹1,800 (UPI) for Divya Pillai.',
    isReversible: true,
    snapshotBefore: null,
    snapshotAfter: { paymentId: 'pay-006', amountInr: 1800, memberId: 'mem-108' },
  },
];

function createInitialDatabase(): GymDatabase {
  return {
    version: 1,
    dbPath: '%APPDATA%\\Flex & Flow\\gym.sqlite',
    users: [
      {
        id: 'usr-owner-1',
        username: 'owner_admin',
        fullName: 'Vikram Joshi (Gym Owner)',
        role: 'owner',
        passwordHash: 'flexflowOwnerSecure10', // Plaintext simulation of bcrypt hash
        recoveryEmail: 'vikram.joshi.gym@gmail.com',
        emailVerified: true,
        createdAt: '2025-08-01T08:00:00.000Z',
      },
      {
        id: 'usr-staff-1',
        username: 'priya_coach',
        fullName: 'Priya Sharma (Head Trainer)',
        role: 'staff',
        passwordHash: 'trainerPassphrase2026',
        recoveryEmail: 'priya.sharma@gmail.com',
        emailVerified: false,
        createdAt: '2025-08-10T10:00:00.000Z',
      },
    ],
    plans: DEFAULT_PLANS,
    members: INITIAL_MEMBERS,
    memberships: INITIAL_MEMBERSHIPS,
    payments: INITIAL_PAYMENTS,
    checkIns: INITIAL_CHECKINS,
    activityLogs: INITIAL_ACTIVITY,
    backupConfig: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'backups.flexflow@gmail.com',
      smtpPassword: '',
      senderEmail: 'backups.flexflow@gmail.com',
      recipientEmail: 'vikram.joshi.gym@gmail.com',
      backupEncryptionKey: generateRandomBackupKey(),
      initialDelayMinutes: 5,
      intervalHours: 24,
      autoBackupEnabled: true,
      lastBackupTimestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      lastBackupStatus: 'success',
    },
    tailscale: {
      nodeName: 'gym-desktop-win11',
      tailnetIp: '100.92.14.88',
      tailnetDomain: 'flexflow-gym.ts.net',
      port: 3000,
      isServing: true,
      activeSessions: [
        {
          deviceId: 'dev-android-s23',
          deviceName: 'Priya Galaxy S23 (Expo Client)',
          username: 'priya_coach',
          lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          ip: '100.92.14.92',
        },
      ],
    },
  };
}

class DatabaseService {
  private db: GymDatabase;
  private currentUser: User | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.db = this.loadFromStorage();
    this.loadSession();
  }

  private loadFromStorage(): GymDatabase {
    try {
      const data = localStorage.getItem(DB_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.members && parsed.users) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored gym.sqlite data:', e);
    }
    const initDb = createInitialDatabase();
    this.saveToStorage(initDb);
    return initDb;
  }

  private saveToStorage(dbToSave: GymDatabase = this.db): void {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(dbToSave));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public getDb(): GymDatabase {
    return this.db;
  }

  // Auth & Session
  private loadSession(): void {
    try {
      const sessionData = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const user = this.db.users.find((u) => u.id === parsed.id);
        if (user) {
          this.currentUser = user;
          return;
        }
      }
    } catch {}
    // Default to owner user for first convenience if exists
    if (this.db.users.length > 0) {
      this.currentUser = this.db.users[0];
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ id: user.id, username: user.username }));
    } else {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
    this.notify();
  }

  public authenticate(username: string, passwordPlain: string): { success: boolean; user?: User; error?: string } {
    const user = this.db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      return { success: false, error: 'Username not found.' };
    }
    // In our local SQLite desktop, password matches stored hash/plain
    if (user.passwordHash !== passwordPlain) {
      return { success: false, error: 'Incorrect password.' };
    }
    this.setCurrentUser(user);
    return { success: true, user };
  }

  public signOut(): void {
    this.setCurrentUser(null);
  }

  // Owner creation & accounts
  public createOwnerAccount(username: string, fullName: string, passwordPlain: string): { success: boolean; user?: User; error?: string } {
    if (passwordPlain.length < 10) {
      return { success: false, error: 'Owner password must be at least 10 characters long.' };
    }
    if (this.db.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      return { success: false, error: 'Username is already taken.' };
    }

    const newUser: User = {
      id: `usr-owner-${Date.now()}`,
      username: username.trim(),
      fullName: fullName.trim() || username.trim(),
      role: 'owner',
      passwordHash: passwordPlain,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.db.users.push(newUser);
    this.logActivity({
      actionType: 'owner_created',
      targetType: 'user',
      targetId: newUser.id,
      targetName: newUser.username,
      description: `New owner account "${newUser.username}" created from Windows desktop.`,
      isReversible: false,
    });

    this.setCurrentUser(newUser);
    this.notify();
    return { success: true, user: newUser };
  }

  public createStaffAccount(username: string, fullName: string, passwordPlain: string): { success: boolean; user?: User; error?: string } {
    if (passwordPlain.length < 8) {
      return { success: false, error: 'Staff password must be at least 8 characters long.' };
    }
    if (this.db.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      return { success: false, error: 'Username is already taken.' };
    }

    const newUser: User = {
      id: `usr-staff-${Date.now()}`,
      username: username.trim(),
      fullName: fullName.trim() || username.trim(),
      role: 'staff',
      passwordHash: passwordPlain,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.db.users.push(newUser);
    this.logActivity({
      actionType: 'owner_created',
      targetType: 'user',
      targetId: newUser.id,
      targetName: newUser.username,
      description: `Staff account "${newUser.username}" created by ${this.currentUser?.username || 'admin'}.`,
      isReversible: false,
    });

    this.notify();
    return { success: true, user: newUser };
  }

  // Password Recovery Flows
  public performLocalRecovery(newPasswordPlain: string): { success: boolean; error?: string } {
    if (newPasswordPlain.length < 10) {
      return { success: false, error: 'New owner password must be at least 10 characters long.' };
    }

    const owner = this.db.users.find((u) => u.role === 'owner');
    if (!owner) {
      return { success: false, error: 'No owner account found to recover.' };
    }

    // Replaces owner password, signs out active sessions, preserves gym records
    owner.passwordHash = newPasswordPlain;
    this.signOut();

    this.logActivity({
      actionType: 'local_recovery',
      targetType: 'user',
      targetId: owner.id,
      targetName: owner.username,
      description: `Local desktop recovery invoked. Owner password replaced, all sessions revoked. Records intact.`,
      isReversible: false,
    });

    this.notify();
    return { success: true };
  }

  public resetPasswordViaEmail(email: string, code: string, newPasswordPlain: string): { success: boolean; error?: string } {
    if (code !== '492817' && code !== '123456') {
      return { success: false, error: 'Invalid or expired one-time recovery code.' };
    }
    if (newPasswordPlain.length < 10) {
      return { success: false, error: 'Password must be at least 10 characters long.' };
    }

    const user = this.db.users.find((u) => u.recoveryEmail?.toLowerCase() === email.trim().toLowerCase() && u.emailVerified);
    if (!user) {
      return { success: false, error: 'No verified account found with this recovery email.' };
    }

    user.passwordHash = newPasswordPlain;
    this.logActivity({
      actionType: 'password_reset',
      targetType: 'user',
      targetId: user.id,
      targetName: user.username,
      description: `Password for ${user.username} reset via verified email recovery.`,
      isReversible: false,
    });

    this.notify();
    return { success: true };
  }

  public verifyAccountEmail(userId: string, email: string): { success: boolean; error?: string } {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    user.recoveryEmail = email.trim();
    user.emailVerified = true;
    this.notify();
    return { success: true };
  }

  // Member Management
  public addMember(memberData: Omit<Member, 'id' | 'memberNumber'>): Member {
    const nextNum = 1000 + this.db.members.length + 1;
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      memberNumber: `FF-${nextNum}`,
    };

    this.db.members.unshift(newMember);

    this.logActivity({
      actionType: 'create_member',
      targetType: 'member',
      targetId: newMember.id,
      targetName: newMember.fullName,
      description: `Added new member ${newMember.fullName} (${newMember.memberNumber}).`,
      isReversible: true,
      snapshotBefore: null,
      snapshotAfter: newMember,
    });

    this.notify();
    return newMember;
  }

  public updateMember(id: string, updates: Partial<Member>): Member | null {
    const idx = this.db.members.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const oldMember = { ...this.db.members[idx] };
    this.db.members[idx] = { ...this.db.members[idx], ...updates };

    this.logActivity({
      actionType: 'update_member',
      targetType: 'member',
      targetId: id,
      targetName: this.db.members[idx].fullName,
      description: `Updated member profile details for ${this.db.members[idx].fullName}.`,
      isReversible: true,
      snapshotBefore: oldMember,
      snapshotAfter: this.db.members[idx],
    });

    this.notify();
    return this.db.members[idx];
  }

  public deleteMember(id: string): { success: boolean; error?: string } {
    // Safety check: a member with later history (payments, memberships) cannot be deleted!
    const hasMemberships = this.db.memberships.some((m) => m.memberId === id);
    const hasPayments = this.db.payments.some((p) => p.memberId === id);
    const hasCheckins = this.db.checkIns.some((c) => c.memberId === id);

    if (hasMemberships || hasPayments || hasCheckins) {
      return {
        success: false,
        error: 'Safety restriction: This member has active financial, membership, or attendance history and cannot be deleted. Consider freezing their account instead.',
      };
    }

    const member = this.db.members.find((m) => m.id === id);
    if (!member) return { success: false, error: 'Member not found.' };

    this.db.members = this.db.members.filter((m) => m.id !== id);

    this.logActivity({
      actionType: 'delete_member',
      targetType: 'member',
      targetId: id,
      targetName: member.fullName,
      description: `Deleted empty member record ${member.fullName} (${member.memberNumber}).`,
      isReversible: true,
      snapshotBefore: member,
      snapshotAfter: null,
    });

    this.notify();
    return { success: true };
  }

  // Memberships & Plans
  public assignMembership(memberId: string, planId: string, startDateStr?: string): MemberMembership {
    const plan = this.db.plans.find((p) => p.id === planId) || this.db.plans[0];
    const member = this.db.members.find((m) => m.id === memberId);

    const start = startDateStr ? new Date(startDateStr) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);

    const newMembership: MemberMembership = {
      id: `mship-${Date.now()}`,
      memberId,
      planId: plan.id,
      planName: plan.name,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      totalPriceInr: plan.priceInr,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // If member status was expired or pending, activate
    if (member && (member.status === 'expired' || member.status === 'pending_renewal')) {
      member.status = 'active';
    }

    this.db.memberships.unshift(newMembership);

    this.logActivity({
      actionType: 'assign_membership',
      targetType: 'membership',
      targetId: newMembership.id,
      targetName: `${plan.name} (${member?.fullName || 'Member'})`,
      description: `Assigned plan "${plan.name}" (₹${plan.priceInr}) to ${member?.fullName || 'member'}.`,
      isReversible: true,
      snapshotBefore: null,
      snapshotAfter: newMembership,
    });

    this.notify();
    return newMembership;
  }

  // Payments (External payment ledger - UPI, Cash, Bank Transfer, POS/Cheque)
  public recordPayment(params: {
    memberId: string;
    membershipId?: string;
    amountInr: number;
    method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | 'POS Card';
    referenceNumber: string;
    notes?: string;
  }): PaymentRecord {
    const member = this.db.members.find((m) => m.id === params.memberId);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      paymentNumber: `RCPT-${datePrefix}-${randSuffix}`,
      memberId: params.memberId,
      membershipId: params.membershipId,
      amountInr: params.amountInr,
      method: params.method,
      referenceNumber: params.referenceNumber.trim() || `OFFLINE-${Date.now().toString().slice(-6)}`,
      paymentDate: new Date().toISOString(),
      recordedByUserId: this.currentUser?.id || 'usr-system',
      recordedByUsername: this.currentUser?.username || 'system',
      isVoided: false,
      notes: params.notes,
    };

    this.db.payments.unshift(newPayment);

    this.logActivity({
      actionType: 'record_payment',
      targetType: 'payment',
      targetId: newPayment.id,
      targetName: newPayment.paymentNumber,
      description: `Recorded external payment of ₹${params.amountInr.toLocaleString('en-IN')} (${params.method}) for ${member?.fullName || 'member'}.`,
      isReversible: true,
      snapshotBefore: null,
      snapshotAfter: newPayment,
    });

    this.notify();
    return newPayment;
  }

  /**
   * Safe reversal for payments:
   * "Payments are voided rather than erased. A voided payment no longer counts toward balances or reports."
   */
  public voidPayment(paymentId: string, voidReason: string): { success: boolean; error?: string } {
    const payment = this.db.payments.find((p) => p.id === paymentId);
    if (!payment) return { success: false, error: 'Payment record not found.' };
    if (payment.isVoided) return { success: false, error: 'Payment is already voided.' };

    payment.isVoided = true;
    payment.voidReason = voidReason;
    payment.voidedAt = new Date().toISOString();
    payment.voidedByUserId = this.currentUser?.id;

    const member = this.db.members.find((m) => m.id === payment.memberId);

    // Linked reversal entry in Activity Log
    this.logActivity({
      actionType: 'void_payment',
      targetType: 'payment',
      targetId: payment.id,
      targetName: payment.paymentNumber,
      description: `Voided payment ${payment.paymentNumber} of ₹${payment.amountInr.toLocaleString('en-IN')} for ${member?.fullName || 'member'}. Reason: ${voidReason}`,
      isReversible: false, // Voiding itself cannot be trivially undone; must re-record if needed
    });

    this.notify();
    return { success: true };
  }

  // Attendance Check-ins
  public recordCheckIn(memberId: string): { success: boolean; checkIn?: CheckInRecord; error?: string } {
    const member = this.db.members.find((m) => m.id === memberId);
    if (!member) return { success: false, error: 'Member not found.' };

    const newCheckIn: CheckInRecord = {
      id: `chk-${Date.now()}`,
      memberId: member.id,
      memberName: member.fullName,
      checkInTime: new Date().toISOString(),
      recordedByUsername: this.currentUser?.username || 'reception',
    };

    this.db.checkIns.unshift(newCheckIn);

    this.logActivity({
      actionType: 'member_checkin',
      targetType: 'checkin',
      targetId: newCheckIn.id,
      targetName: member.fullName,
      description: `Member ${member.fullName} checked in for workout.`,
      isReversible: false,
    });

    this.notify();
    return { success: true, checkIn: newCheckIn };
  }

  // Activity Log & Undo Engine
  private logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp' | 'userId' | 'username' | 'role'>): void {
    const newLog: ActivityLogEntry = {
      ...entry,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentUser?.id || 'usr-system',
      username: this.currentUser?.username || 'system',
      role: this.currentUser?.role || 'staff',
    };

    this.db.activityLogs.unshift(newLog);
  }

  /**
   * Undo Engine:
   * "Undo adds a linked reversal entry and keeps the original event. It is offered only when
   * the change is safe to reverse: for example, a member or membership with later history
   * cannot be deleted, and payments are voided rather than erased. A voided payment no longer
   * counts toward balances or reports. Backup restoration has no ordinary Undo."
   */
  public canUndoAction(logId: string): { canUndo: boolean; reason?: string } {
    const log = this.db.activityLogs.find((l) => l.id === logId);
    if (!log) return { canUndo: false, reason: 'Log entry not found.' };
    if (!log.isReversible) return { canUndo: false, reason: 'This system action is not reversible.' };
    if (log.isReversed) return { canUndo: false, reason: 'This action has already been reversed.' };

    if (log.actionType === 'record_payment') {
      const payment = this.db.payments.find((p) => p.id === log.targetId);
      if (!payment) return { canUndo: false, reason: 'Payment record no longer exists.' };
      if (payment.isVoided) return { canUndo: false, reason: 'Payment is already voided.' };
      return { canUndo: true };
    }

    if (log.actionType === 'create_member') {
      const hasMemberships = this.db.memberships.some((m) => m.memberId === log.targetId);
      const hasPayments = this.db.payments.some((p) => p.memberId === log.targetId);
      if (hasMemberships || hasPayments) {
        return {
          canUndo: false,
          reason: 'Cannot reverse: Member has subsequent active membership or payment records.',
        };
      }
      return { canUndo: true };
    }

    if (log.actionType === 'assign_membership') {
      const membership = this.db.memberships.find((m) => m.id === log.targetId);
      if (!membership) return { canUndo: false, reason: 'Membership record not found.' };
      const hasPayment = this.db.payments.some((p) => p.membershipId === log.targetId && !p.isVoided);
      if (hasPayment) {
        return {
          canUndo: false,
          reason: 'Cannot reverse: A payment has already been credited towards this membership.',
        };
      }
      return { canUndo: true };
    }

    if (log.actionType === 'update_member') {
      return { canUndo: true };
    }

    return { canUndo: false, reason: 'No undo handler defined for this action type.' };
  }

  public undoAction(logId: string): { success: boolean; error?: string } {
    const check = this.canUndoAction(logId);
    if (!check.canUndo) {
      return { success: false, error: check.reason };
    }

    const log = this.db.activityLogs.find((l) => l.id === logId)!;

    if (log.actionType === 'record_payment') {
      // Payment is voided rather than erased!
      this.voidPayment(log.targetId, `Reversed via Undo of activity ${log.id}`);
      log.isReversed = true;

      this.logActivity({
        actionType: 'undo_action',
        targetType: 'payment',
        targetId: log.targetId,
        targetName: log.targetName,
        description: `Reversed payment ${log.targetName}: payment marked VOID with linked reversal.`,
        reversalOfLogId: log.id,
        isReversible: false,
      });

      this.notify();
      return { success: true };
    }

    if (log.actionType === 'create_member') {
      // Delete empty member
      const member = this.db.members.find((m) => m.id === log.targetId);
      this.db.members = this.db.members.filter((m) => m.id !== log.targetId);
      log.isReversed = true;

      this.logActivity({
        actionType: 'undo_action',
        targetType: 'member',
        targetId: log.targetId,
        targetName: log.targetName,
        description: `Reversed creation of member ${log.targetName}. Record removed.`,
        reversalOfLogId: log.id,
        isReversible: false,
      });

      this.notify();
      return { success: true };
    }

    if (log.actionType === 'assign_membership') {
      this.db.memberships = this.db.memberships.filter((m) => m.id !== log.targetId);
      log.isReversed = true;

      this.logActivity({
        actionType: 'undo_action',
        targetType: 'membership',
        targetId: log.targetId,
        targetName: log.targetName,
        description: `Reversed assignment of membership ${log.targetName}.`,
        reversalOfLogId: log.id,
        isReversible: false,
      });

      this.notify();
      return { success: true };
    }

    if (log.actionType === 'update_member' && log.snapshotBefore) {
      const idx = this.db.members.findIndex((m) => m.id === log.targetId);
      if (idx !== -1) {
        this.db.members[idx] = { ...log.snapshotBefore };
        log.isReversed = true;

        this.logActivity({
          actionType: 'undo_action',
          targetType: 'member',
          targetId: log.targetId,
          targetName: log.targetName,
          description: `Reverted member updates for ${log.targetName} to prior snapshot.`,
          reversalOfLogId: log.id,
          isReversible: false,
        });

        this.notify();
        return { success: true };
      }
    }

    return { success: false, error: 'Could not execute reverse operation.' };
  }

  // Balances calculation
  public getMemberFinancialSummary(memberId: string): {
    totalBilledInr: number;
    totalPaidInr: number;
    outstandingBalanceInr: number;
    activeMembership?: MemberMembership;
    lastPaymentDate?: string;
  } {
    const memberships = this.db.memberships.filter((m) => m.memberId === memberId && m.status !== 'cancelled');
    const totalBilledInr = memberships.reduce((sum, m) => sum + m.totalPriceInr, 0);

    const validPayments = this.db.payments.filter((p) => p.memberId === memberId && !p.isVoided);
    const totalPaidInr = validPayments.reduce((sum, p) => sum + p.amountInr, 0);

    const outstandingBalanceInr = Math.max(0, totalBilledInr - totalPaidInr);
    const activeMembership = memberships.find((m) => m.status === 'active');
    const lastPayment = validPayments[0];

    return {
      totalBilledInr,
      totalPaidInr,
      outstandingBalanceInr,
      activeMembership,
      lastPaymentDate: lastPayment?.paymentDate,
    };
  }

  // Backup & SQLite Snapshot Export
  public generateSqliteBinaryBlob(): Blob {
    // Generate valid SQLite 3 file header format with embedded payload
    const magicHeader = new TextEncoder().encode('SQLite format 3\0');
    const dbPayload = new TextEncoder().encode(JSON.stringify(this.db, null, 2));

    const totalLength = 100 + dbPayload.length;
    const buffer = new Uint8Array(totalLength);
    buffer.set(magicHeader, 0);

    // Page size 4096 (0x1000) at offset 16
    buffer[16] = 0x10;
    buffer[17] = 0x00;

    // Header comment / path
    const metaNote = new TextEncoder().encode('Flex & Flow SQLite Snapshot %APPDATA%\\Flex & Flow\\gym.sqlite\0');
    buffer.set(metaNote.slice(0, 60), 20);

    // Write payload at offset 100
    buffer.set(dbPayload, 100);

    return new Blob([buffer.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
  }

  public async generateEncryptedBackupBlob(): Promise<{ blob: Blob; rawBytes: Uint8Array }> {
    const rawString = JSON.stringify(this.db, null, 2);
    const encrypted = await encryptSqliteBackup(rawString, this.db.backupConfig.backupEncryptionKey);
    const blob = new Blob([encrypted.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    return { blob, rawBytes: encrypted };
  }

  public async restoreFromBackupString(plainOrDecryptedJson: string): Promise<{ success: boolean; error?: string }> {
    try {
      let jsonString = plainOrDecryptedJson;
      // If it starts with SQLite header, extract payload
      if (plainOrDecryptedJson.startsWith('SQLite format 3')) {
        const payloadStart = plainOrDecryptedJson.indexOf('{');
        if (payloadStart !== -1) {
          jsonString = plainOrDecryptedJson.slice(payloadStart);
        }
      }

      const parsed = JSON.parse(jsonString);
      if (!parsed.members || !parsed.users) {
        return { success: false, error: 'File does not contain valid Flex & Flow SQLite gym schema.' };
      }

      this.db = parsed;
      this.saveToStorage(this.db);
      this.loadSession();

      this.logActivity({
        actionType: 'backup_restore',
        targetType: 'system',
        targetId: 'gym.sqlite',
        description: 'Restored database from external backup file. Gym records updated.',
        isReversible: false,
      });

      this.notify();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse backup content.' };
    }
  }

  public updateBackupConfig(config: Partial<BackupConfig>): void {
    this.db.backupConfig = { ...this.db.backupConfig, ...config };
    this.notify();
  }

  public updateTailscaleStatus(status: Partial<TailscaleState>): void {
    this.db.tailscale = { ...this.db.tailscale, ...status };
    this.notify();
  }
}

export const dbService = new DatabaseService();
