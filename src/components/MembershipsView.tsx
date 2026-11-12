import React, { useState } from 'react';
import { GymDatabase, User } from '../types/gym';
import { formatINR, formatKolkataDate } from '../services/crypto';
import { dbService } from '../services/db';
import { Layers, Plus, Calendar, Clock, Check, Users, Dumbbell, Shield } from 'lucide-react';

interface MembershipsViewProps {
  db: GymDatabase;
  currentUser: User | null;
  onOpenAssignMembership: (memberId?: string) => void;
  onSelectMemberById: (memberId: string) => void;
}

export const MembershipsView: React.FC<MembershipsViewProps> = ({
  db,
  currentUser,
  onOpenAssignMembership,
  onSelectMemberById,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'active_enrollments'>('plans');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Membership Plans & Enrollments</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Transparent INR tariff structures · Stored locally in gym.sqlite
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'plans'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Plan Catalog ({db.plans.length})
            </button>
            <button
              onClick={() => setActiveTab('active_enrollments')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'active_enrollments'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Enrollments ({db.memberships.length})
            </button>
          </div>

          <button
            onClick={() => onOpenAssignMembership()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Assign / Renew Plan</span>
          </button>
        </div>
      </div>

      {activeTab === 'plans' ? (
        /* Plans Catalog Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {db.plans.map((plan) => {
            const enrolledCount = db.memberships.filter(
              (m) => m.planId === plan.id && m.status === 'active'
            ).length;

            return (
              <div
                key={plan.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-mono text-neutral-500 uppercase">
                      {plan.category}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                      {plan.durationDays} Days
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2">{plan.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-neutral-800 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                        {formatINR(plan.priceInr)}
                      </span>
                      <span className="text-xs text-neutral-500 ml-1">/ tenure</span>
                    </div>
                    <span className="text-xs text-neutral-400 font-mono">
                      {enrolledCount} active members
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500 font-mono">
                    ₹{Math.round(plan.priceInr / (plan.durationDays / 30))}/mo equiv.
                  </span>
                  <button
                    onClick={() => onOpenAssignMembership()}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>Assign Plan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Enrollments Table */
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[11px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-3">Plan Enrolled</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3 text-right">Fee (INR)</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {db.memberships.map((mship) => {
                  const member = db.members.find((m) => m.id === mship.memberId);
                  return (
                    <tr
                      key={mship.id}
                      onClick={() => member && onSelectMemberById(member.id)}
                      className="hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-200">
                          {member?.fullName || 'Unknown Member'}
                        </span>
                        <span className="text-neutral-500 text-[11px] font-mono block">
                          {member?.memberNumber}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-neutral-300 font-medium">
                        {mship.planName}
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-400">
                        {formatKolkataDate(mship.startDate)}
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-300">
                        {formatKolkataDate(mship.endDate)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 tabular-nums">
                        {formatINR(mship.totalPriceInr)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                            mship.status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {mship.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
