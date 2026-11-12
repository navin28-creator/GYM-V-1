import React from 'react';
import { User } from '../types/gym';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  History,
  HardDriveDownload,
  Radio,
  Settings,
  ClipboardCheck,
  Dumbbell,
  Shield,
  Layers,
  TrendingUp,
} from 'lucide-react';

export type DesktopTab =
  | 'dashboard'
  | 'analytics'
  | 'members'
  | 'memberships'
  | 'payments'
  | 'attendance'
  | 'activity'
  | 'backups'
  | 'tailscale'
  | 'settings';

interface NavigationProps {
  currentTab: DesktopTab;
  onSelectTab: (tab: DesktopTab) => void;
  currentUser: User | null;
  activeMembersCount: number;
  todayCheckInsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  activeMembersCount,
  todayCheckInsCount,
}) => {
  const isOwner = currentUser?.role === 'owner';

  const navItems = [
    {
      id: 'dashboard' as DesktopTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'analytics' as DesktopTab,
      label: 'Analytics',
      icon: TrendingUp,
      badge: '12M',
    },
    {
      id: 'members' as DesktopTab,
      label: 'Members',
      icon: Users,
      badge: activeMembersCount,
    },
    {
      id: 'memberships' as DesktopTab,
      label: 'Memberships & Plans',
      icon: Layers,
      badge: null,
    },
    {
      id: 'payments' as DesktopTab,
      label: 'Payments Ledger',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'attendance' as DesktopTab,
      label: 'Daily Attendance',
      icon: ClipboardCheck,
      badge: todayCheckInsCount,
    },
    {
      id: 'activity' as DesktopTab,
      label: 'Activity & Undo Log',
      icon: History,
      badge: null,
    },
    {
      id: 'backups' as DesktopTab,
      label: 'Backups & Recovery',
      icon: HardDriveDownload,
      badge: isOwner ? 'AES-256' : null,
    },
    {
      id: 'tailscale' as DesktopTab,
      label: 'Tailscale & Mobile Hub',
      icon: Radio,
      badge: 'Port 3000',
    },
    {
      id: 'settings' as DesktopTab,
      label: 'Account & Security',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between shrink-0 select-none">
      {/* Gym Brand Banner */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>Flex & Flow</span>
            </h1>
            <p className="text-[11px] text-neutral-400 font-mono">Single-Gym Desktop v1.2</p>
          </div>
        </div>

        <div className="mt-3 px-2 py-1 bg-neutral-900 border border-neutral-800/80 rounded text-[11px] text-neutral-400 flex items-center justify-between font-mono">
          <span>Source of Truth:</span>
          <span className="text-amber-400">SQLite (Local)</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                isActive
                  ? 'bg-neutral-800/90 text-white font-semibold border border-neutral-700/60 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'bg-neutral-900 text-neutral-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Specs */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/70 text-[11px] text-neutral-400 space-y-1 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Timezone</span>
          <span className="text-neutral-300">Asia/Kolkata</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Currency</span>
          <span className="text-neutral-300">INR (₹)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Storage</span>
          <span className="text-neutral-300 truncate max-w-[120px]" title="desktop/data/gym.sqlite">
            gym.sqlite
          </span>
        </div>
      </div>
    </aside>
  );
};
