/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import { GymDatabase, Member, User } from './types/gym';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { Navigation, DesktopTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { MembersView } from './components/MembersView';
import { MembershipsView } from './components/MembershipsView';
import { PaymentsView } from './components/PaymentsView';
import { CheckInsView } from './components/CheckInsView';
import { ActivityLogView } from './components/ActivityLogView';
import { BackupsView } from './components/BackupsView';
import { TailscaleHubView } from './components/TailscaleHubView';
import { AccountSettingsView } from './components/AccountSettingsView';
import { AndroidExpoView } from './components/AndroidExpoView';
import { AuthModal } from './components/AuthModal';
import { UndoModal } from './components/UndoModal';
import { ReceiptModal } from './components/ReceiptModal';
import { WhatsAppReminderModal } from './components/WhatsAppReminderModal';
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

  // Sync with Database Service subscriptions
  useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      setDb({ ...dbService.getDb() });
      setCurrentUser(dbService.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    dbService.signOut();
    setAuthModalOpen(true);
  };

  const activeMembersCount = db.members.filter((m) => m.status === 'active').length;
  const todayCheckInsCount = db.checkIns.length;

  const paymentForReceipt = receiptPaymentId
    ? db.payments.find((p) => p.id === receiptPaymentId)
    : null;
  const memberForReceipt = paymentForReceipt
    ? db.members.find((m) => m.id === paymentForReceipt.memberId)
    : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Windows 11 Desktop Title Bar */}
      <WindowsTitleBar
        currentUser={currentUser}
        tailscale={db.tailscale}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenTailscaleModal={() => setCurrentTab('tailscale')}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Render Windows Desktop UI if in desktop or split mode */}
        {(viewMode === 'desktop' || viewMode === 'split') && (
          <div className={`flex flex-1 overflow-hidden ${viewMode === 'split' ? 'border-r-2 border-neutral-800' : ''}`}>
            {/* Desktop Navigation Sidebar */}
            <Navigation
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              currentUser={currentUser}
              activeMembersCount={activeMembersCount}
              todayCheckInsCount={todayCheckInsCount}
            />

            {/* Active Desktop Viewport */}
            <main className="flex-1 overflow-y-auto bg-neutral-950">
              {currentTab === 'dashboard' && (
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
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView db={db} currentUser={currentUser} />
              )}

              {currentTab === 'members' && (
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
              )}

              {currentTab === 'memberships' && (
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
              )}

              {currentTab === 'payments' && (
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
                />
              )}

              {currentTab === 'attendance' && (
                <CheckInsView
                  db={db}
                  currentUser={currentUser}
                  onSelectMemberById={(memberId) => {
                    const member = db.members.find((m) => m.id === memberId);
                    if (member) {
                      setSelectedMember(member);
                      setCurrentTab('members');
                    }
                  }}
                />
              )}

              {currentTab === 'activity' && (
                <ActivityLogView
                  db={db}
                  currentUser={currentUser}
                  onOpenUndoModal={(logId) => setUndoModalLogId(logId)}
                />
              )}

              {currentTab === 'backups' && (
                <BackupsView db={db} currentUser={currentUser} />
              )}

              {currentTab === 'tailscale' && (
                <TailscaleHubView
                  db={db}
                  currentUser={currentUser}
                  onLaunchMobileSimulator={() => setViewMode('mobile')}
                />
              )}

              {currentTab === 'settings' && (
                <AccountSettingsView db={db} currentUser={currentUser} />
              )}
            </main>
          </div>
        )}

        {/* Render Android Expo Client Simulator if in mobile or split mode */}
        {(viewMode === 'mobile' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-[440px] shrink-0 overflow-y-auto' : 'flex-1 overflow-y-auto'}`}>
            <AndroidExpoView
              db={db}
              currentUser={currentUser}
              onOpenReminderModal={(member, balance, dueDate) =>
                setReminderModalData({ member, balance, dueDate })
              }
              onOpenReceiptModal={(paymentId) => setReceiptPaymentId(paymentId)}
            />
          </div>
        )}
      </div>

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
  );
}
