/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MotionConfig, AnimatePresence } from 'motion/react';
import { dbService, hasPermission, isSuperAdminRole } from './services/db';
import { GymDatabase, Member, User } from './types/gym';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { Navigation, DesktopTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { MembersView } from './components/MembersView';
import { MembershipsView } from './components/MembershipsView';
import { PaymentsView } from './components/PaymentsView';
import { ActivityLogView } from './components/ActivityLogView';
import { BackupsView } from './components/BackupsView';
import { TailscaleHubView } from './components/TailscaleHubView';
import { AccountSettingsView } from './components/AccountSettingsView';
import { SuperAdminPermissionsView } from './components/SuperAdminPermissionsView';
import { AndroidExpoView } from './components/AndroidExpoView';
import { LoginPage } from './components/LoginPage';
import { AuthModal } from './components/AuthModal';
import { UndoModal } from './components/UndoModal';
import { ReceiptModal } from './components/ReceiptModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
import { SectionWrapper } from './components/MotionPrimitives';
import {
  AddMemberModal,
  RecordPaymentModal,
  AssignMembershipModal,
  QuickCheckInModal,
} from './components/ActionModals';

export default function App() {
  const [db, setDb] = useState<GymDatabase>(dbService.getDb());
  const [currentUser, setCurrentUser] = useState<User | null>(dbService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<DesktopTab>('dashboard');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'split'>('desktop');

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [recordPaymentData, setRecordPaymentData] = useState<{ isOpen: boolean; memberId?: string }>({
    isOpen: false,
  });
  const [assignMembershipData, setAssignMembershipData] = useState<{ isOpen: boolean; memberId?: string }>({
    isOpen: false,
  });
  const [quickCheckInOpen, setQuickCheckInOpen] = useState(false);
  const [undoModalLogId, setUndoModalLogId] = useState<string | null>(null);

  const [reminderModalData, setReminderModalData] = useState<{
    member: Member;
    balance: number;
    dueDate?: string;
  } | null>(null);

  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [focusedPaymentId, setFocusedPaymentId] = useState<string | null>(null);

  // Sync with Database Service subscriptions
  useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      setDb({ ...dbService.getDb() });
      setCurrentUser(dbService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  // Automatically redirect away from Super Admin or permission-restricted tabs if account switches
  useEffect(() => {
    if (!currentUser) return;
    if (currentTab === 'super_admin_permissions' && !isSuperAdminRole(currentUser.role)) {
      setCurrentTab('dashboard');
    } else if (currentTab === 'analytics' && !hasPermission(currentUser, 'canViewAnalytics')) {
      setCurrentTab('dashboard');
    } else if (currentTab === 'tailscale' && !hasPermission(currentUser, 'canManageTailscale')) {
      setCurrentTab('dashboard');
    }

    if (!isSuperAdminRole(currentUser.role) && !hasPermission(currentUser, 'canAccessExpoMobile') && viewMode !== 'desktop') {
      setViewMode('desktop');
    }
  }, [currentUser, currentTab, viewMode]);

  const handleSignOut = () => {
    dbService.signOut();
    setSelectedMember(null);
    setFocusedPaymentId(null);
    setCurrentTab('dashboard');
  };

  const activeMembersCount = db.members.filter((m) => m.status === 'active').length;
  const todayCheckInsCount = db.checkIns.length;

  const paymentForReceipt = receiptPaymentId
    ? db.payments.find((p) => p.id === receiptPaymentId)
    : null;
  const memberForReceipt = paymentForReceipt
    ? db.members.find((m) => m.id === paymentForReceipt.memberId)
    : null;

  const renderActiveDesktopTab = () => {
    switch (currentTab) {
      case 'analytics':
        return <AnalyticsView db={db} currentUser={currentUser} />;
      case 'members':
        return (
          <MembersView
            db={db}
            currentUser={currentUser}
            onOpenAddMember={() => setAddMemberOpen(true)}
            onOpenRecordPayment={(memberId) => setRecordPaymentData({ isOpen: true, memberId })}
            onOpenAssignMembership={(memberId) =>
              setAssignMembershipData({ isOpen: true, memberId })
            }
            onOpenReminderModal={(member, balance, dueDate) =>
              setReminderModalData({ member, balance, dueDate })
            }
            onOpenReceiptModal={(paymentId) => setReceiptPaymentId(paymentId)}
            selectedMember={selectedMember}
            setSelectedMember={setSelectedMember}
          />
        );
      case 'memberships':
        return (
          <MembershipsView
            db={db}
            currentUser={currentUser}
            onOpenAssignMembership={(memberId) =>
              setAssignMembershipData({ isOpen: true, memberId })
            }
            onSelectMemberById={(memberId) => {
              const member = db.members.find((m) => m.id === memberId);
              if (member) {
                setSelectedMember(member);
                setCurrentTab('members');
              }
            }}
          />
        );
      case 'payments':
        return (
          <PaymentsView
            db={db}
            currentUser={currentUser}
            onOpenRecordPayment={() => setRecordPaymentData({ isOpen: true })}
            onOpenReceiptModal={(paymentId) => setReceiptPaymentId(paymentId)}
            onSelectMemberById={(memberId) => {
              const member = db.members.find((m) => m.id === memberId);
              if (member) {
                setSelectedMember(member);
                setCurrentTab('members');
              }
            }}
            focusedPaymentId={focusedPaymentId}
            onClearFocusedPayment={() => setFocusedPaymentId(null)}
          />
        );
      case 'activity':
        return (
          <ActivityLogView
            db={db}
            currentUser={currentUser}
            onOpenUndoModal={(logId) => setUndoModalLogId(logId)}
          />
        );
      case 'backups':
        return <BackupsView db={db} currentUser={currentUser} />;
      case 'tailscale':
        return (
          <TailscaleHubView
            db={db}
            currentUser={currentUser}
            onLaunchMobileSimulator={() => setViewMode('mobile')}
          />
        );
      case 'settings':
        return <AccountSettingsView db={db} currentUser={currentUser} />;
      case 'super_admin_permissions':
        return isSuperAdminRole(currentUser?.role) ? (
          <SuperAdminPermissionsView db={db} currentUser={currentUser} />
        ) : (
          <DashboardView
            db={db}
            currentUser={currentUser}
            onNavigate={setCurrentTab}
            onOpenAddMember={() => setAddMemberOpen(true)}
            onOpenRecordPayment={(memberId) => setRecordPaymentData({ isOpen: true, memberId })}
            onOpenQuickCheckIn={() => setQuickCheckInOpen(true)}
            onOpenReminderModal={(member, balance, dueDate) =>
              setReminderModalData({ member, balance, dueDate })
            }
            onOpenUndoModal={(logId) => setUndoModalLogId(logId)}
            onSelectMember={(member) => {
              setSelectedMember(member);
              setCurrentTab('members');
            }}
          />
        );
      case 'dashboard':
      case 'attendance':
      default:
        return (
          <DashboardView
            db={db}
            currentUser={currentUser}
            onNavigate={setCurrentTab}
            onOpenAddMember={() => setAddMemberOpen(true)}
            onOpenRecordPayment={(memberId) => setRecordPaymentData({ isOpen: true, memberId })}
            onOpenQuickCheckIn={() => setQuickCheckInOpen(true)}
            onOpenReminderModal={(member, balance, dueDate) =>
              setReminderModalData({ member, balance, dueDate })
            }
            onOpenUndoModal={(logId) => setUndoModalLogId(logId)}
            onSelectMember={(member) => {
              setSelectedMember(member);
              setCurrentTab('members');
            }}
          />
        );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {/* Windows 11 Desktop Title Bar (Super Admin Exclusive) */}
        {isSuperAdminRole(currentUser?.role) && (
          <WindowsTitleBar
            currentUser={currentUser}
            tailscale={db.tailscale}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onOpenTailscaleModal={() => {
              if (hasPermission(currentUser, 'canManageTailscale')) {
                setCurrentTab('tailscale');
              }
            }}
          />
        )}

        {/* Main Workspace Frame */}
        <AnimatePresence mode="wait">
          {!currentUser ? (
            <SectionWrapper key="login-view" className="flex-1 overflow-y-auto">
              <LoginPage db={db} />
            </SectionWrapper>
          ) : (
            <SectionWrapper key="workspace-view" className="flex-1 flex overflow-hidden">
              {/* Render Windows Desktop UI if in desktop or split mode */}
              {(viewMode === 'desktop' || viewMode === 'split') && (
                <div
                  className={`flex flex-1 overflow-hidden ${
                    viewMode === 'split' ? 'border-r-2 border-neutral-800' : ''
                  }`}
                >
                  {/* Desktop Navigation Sidebar */}
                  <Navigation
                    currentTab={currentTab}
                    onSelectTab={(tab) => {
                      if (tab !== 'payments') setFocusedPaymentId(null);
                      setCurrentTab(tab);
                    }}
                    currentUser={currentUser}
                    activeMembersCount={activeMembersCount}
                    todayCheckInsCount={todayCheckInsCount}
                    members={db.members}
                    payments={db.payments}
                    onSelectMember={(member) => {
                      setSelectedMember(member);
                      setCurrentTab('members');
                    }}
                    onSelectPayment={(payment) => {
                      setFocusedPaymentId(payment.id);
                      setCurrentTab('payments');
                    }}
                    onSignOut={handleSignOut}
                    onOpenExpoMobile={() => setViewMode('mobile')}
                  />

                  {/* Active Desktop Viewport with Section Opening Transition */}
                  <main className="flex-1 overflow-y-auto bg-neutral-950">
                    <AnimatePresence mode="wait">
                      <SectionWrapper key={currentTab}>{renderActiveDesktopTab()}</SectionWrapper>
                    </AnimatePresence>
                  </main>
                </div>
              )}

              {/* Render Android Expo Client Simulator if in mobile or split mode */}
              {(viewMode === 'mobile' || viewMode === 'split') && (
                <div
                  className={`${
                    viewMode === 'split' ? 'w-[440px] shrink-0 overflow-y-auto' : 'flex-1 overflow-y-auto'
                  }`}
                >
                  <AndroidExpoView
                    db={db}
                    currentUser={currentUser}
                    onOpenReminderModal={(member, balance, dueDate) =>
                      setReminderModalData({ member, balance, dueDate })
                    }
                    onOpenReceiptModal={(paymentId) => setReceiptPaymentId(paymentId)}
                    onBackToDesktop={() => setViewMode('desktop')}
                  />
                </div>
              )}
            </SectionWrapper>
          )}
        </AnimatePresence>

        {/* Global Modals */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          currentUser={currentUser}
          db={db}
        />

        <UndoModal
          logId={undoModalLogId}
          db={db}
          onClose={() => setUndoModalLogId(null)}
        />

        {paymentForReceipt && memberForReceipt && (
          <ReceiptModal
            payment={paymentForReceipt}
            member={memberForReceipt}
            onClose={() => setReceiptPaymentId(null)}
          />
        )}

        {reminderModalData && (
          <WhatsAppReminderModal
            member={reminderModalData.member}
            outstandingBalanceInr={reminderModalData.balance}
            dueDate={reminderModalData.dueDate}
            onClose={() => setReminderModalData(null)}
          />
        )}

        <AddMemberModal
          isOpen={addMemberOpen}
          onClose={() => setAddMemberOpen(false)}
          onMemberCreated={(newMember) => {
            setSelectedMember(newMember);
            setCurrentTab('members');
          }}
        />

        <RecordPaymentModal
          isOpen={recordPaymentData.isOpen}
          initialMemberId={recordPaymentData.memberId}
          db={db}
          onClose={() => setRecordPaymentData({ isOpen: false })}
          onPaymentRecorded={(paymentId) => {
            setReceiptPaymentId(paymentId);
          }}
        />

        <AssignMembershipModal
          isOpen={assignMembershipData.isOpen}
          initialMemberId={assignMembershipData.memberId}
          db={db}
          onClose={() => setAssignMembershipData({ isOpen: false })}
        />

        <QuickCheckInModal
          isOpen={quickCheckInOpen}
          db={db}
          onClose={() => setQuickCheckInOpen(false)}
        />
      </div>
    </MotionConfig>
  );
}
