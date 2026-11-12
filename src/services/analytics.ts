import { GymDatabase } from '../types/gym';

export interface MonthlyMetric {
  monthKey: string; // e.g. '2025-12'
  monthLabel: string; // e.g. 'Dec 25'
  fullMonth: string; // e.g. 'December 2025'
  revenueInr: number;
  upiRevenueInr: number;
  cashRevenueInr: number;
  bankRevenueInr: number;
  targetRevenueInr: number;
  momRevenueGrowthPercent: number;
  newSignups: number;
  cumulativeMembers: number;
  churnedMembers: number;
  churnRatePercent: number;
  retentionRatePercent: number;
}

export interface ChurnReasonItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PlanDistributionItem {
  name: string;
  count: number;
  revenueInr: number;
  color: string;
}

export interface AnalyticsSummary {
  total12MonthRevenueInr: number;
  avgMonthlyRevenueInr: number;
  highestMonthRevenueInr: number;
  highestMonthLabel: string;
  total12MonthSignups: number;
  avgMonthlySignups: number;
  avgChurnRatePercent: number;
  currentRetentionRatePercent: number;
  estimatedLtvInr: number;
  monthlyMetrics: MonthlyMetric[];
  churnReasons: ChurnReasonItem[];
  planDistributions: PlanDistributionItem[];
  paymentModeBreakdown: { mode: string; amountInr: number; percentage: number; color: string }[];
}

// 12 Months baseline sequence leading to Nov 2026
const BASELINE_MONTHS = [
  { key: '2025-12', label: 'Dec 25', full: 'December 2025', baseRev: 86000, signups: 16, churned: 3, upiRatio: 0.62, cashRatio: 0.22 },
  { key: '2026-01', label: 'Jan 26', full: 'January 2026', baseRev: 148000, signups: 32, churned: 2, upiRatio: 0.68, cashRatio: 0.18 },
  { key: '2026-02', label: 'Feb 26', full: 'February 2026', baseRev: 112000, signups: 19, churned: 4, upiRatio: 0.65, cashRatio: 0.20 },
  { key: '2026-03', label: 'Mar 26', full: 'March 2026', baseRev: 124000, signups: 22, churned: 3, upiRatio: 0.70, cashRatio: 0.16 },
  { key: '2026-04', label: 'Apr 26', full: 'April 2026', baseRev: 136000, signups: 25, churned: 5, upiRatio: 0.72, cashRatio: 0.15 },
  { key: '2026-05', label: 'May 26', full: 'May 2026', baseRev: 142000, signups: 28, churned: 4, upiRatio: 0.74, cashRatio: 0.14 },
  { key: '2026-06', label: 'Jun 26', full: 'June 2026', baseRev: 139000, signups: 21, churned: 6, upiRatio: 0.71, cashRatio: 0.17 },
  { key: '2026-07', label: 'Jul 26', full: 'July 2026', baseRev: 154000, signups: 29, churned: 4, upiRatio: 0.76, cashRatio: 0.13 },
  { key: '2026-08', label: 'Aug 26', full: 'August 2026', baseRev: 168000, signups: 34, churned: 5, upiRatio: 0.78, cashRatio: 0.12 },
  { key: '2026-09', label: 'Sep 26', full: 'September 2026', baseRev: 162000, signups: 26, churned: 6, upiRatio: 0.77, cashRatio: 0.13 },
  { key: '2026-10', label: 'Oct 26', full: 'October 2026', baseRev: 178000, signups: 31, churned: 4, upiRatio: 0.80, cashRatio: 0.11 },
  { key: '2026-11', label: 'Nov 26', full: 'November 2026', baseRev: 194000, signups: 38, churned: 3, upiRatio: 0.82, cashRatio: 0.10 },
];

export function compute12MonthAnalytics(db: GymDatabase): AnalyticsSummary {
  // Aggregate live valid payments by month
  const livePaymentsByMonth: Record<string, { total: number; upi: number; cash: number; bank: number }> = {};
  
  db.payments.forEach((p) => {
    if (p.isVoided) return;
    const monthKey = p.paymentDate.slice(0, 7); // e.g. '2026-01'
    if (!livePaymentsByMonth[monthKey]) {
      livePaymentsByMonth[monthKey] = { total: 0, upi: 0, cash: 0, bank: 0 };
    }
    livePaymentsByMonth[monthKey].total += p.amountInr;
    if (p.method === 'UPI') livePaymentsByMonth[monthKey].upi += p.amountInr;
    else if (p.method === 'Cash') livePaymentsByMonth[monthKey].cash += p.amountInr;
    else livePaymentsByMonth[monthKey].bank += p.amountInr;
  });

  // Count live signups by month
  const liveSignupsByMonth: Record<string, number> = {};
  db.members.forEach((m) => {
    const monthKey = m.joinedDate.slice(0, 7);
    liveSignupsByMonth[monthKey] = (liveSignupsByMonth[monthKey] || 0) + 1;
  });

  let runningMembers = 45; // baseline starting active membership 12 months ago
  let prevMonthRev = 80000;

  const monthlyMetrics: MonthlyMetric[] = BASELINE_MONTHS.map((base, idx) => {
    const live = livePaymentsByMonth[base.key] || { total: 0, upi: 0, cash: 0, bank: 0 };
    const liveSignups = liveSignupsByMonth[base.key] || 0;

    // Combined revenue (baseline historical + user live recorded additions)
    const totalRev = base.baseRev + live.total;
    const upiRev = Math.round(totalRev * base.upiRatio) + live.upi;
    const cashRev = Math.round(totalRev * base.cashRatio) + live.cash;
    const bankRev = Math.max(0, totalRev - upiRev - cashRev) + live.bank;

    const signups = base.signups + liveSignups;
    const churned = base.churned;

    // Churn rate calculation based on active members
    const churnRate = Number(((churned / runningMembers) * 100).toFixed(1));
    const retentionRate = Number((100 - churnRate).toFixed(1));

    // Update running members
    runningMembers = runningMembers + signups - churned;

    const momGrowth = Number((((totalRev - prevMonthRev) / prevMonthRev) * 100).toFixed(1));
    prevMonthRev = totalRev;

    // Target revenue (typically 10-15% above target)
    const targetRevenue = Math.round(base.baseRev * 1.08);

    return {
      monthKey: base.key,
      monthLabel: base.label,
      fullMonth: base.full,
      revenueInr: totalRev,
      upiRevenueInr: upiRev,
      cashRevenueInr: cashRev,
      bankRevenueInr: bankRev,
      targetRevenueInr: targetRevenue,
      momRevenueGrowthPercent: momGrowth,
      newSignups: signups,
      cumulativeMembers: runningMembers,
      churnedMembers: churned,
      churnRatePercent: churnRate,
      retentionRatePercent: retentionRate,
    };
  });

  // Summary Metrics
  const total12MonthRevenueInr = monthlyMetrics.reduce((sum, m) => sum + m.revenueInr, 0);
  const avgMonthlyRevenueInr = Math.round(total12MonthRevenueInr / monthlyMetrics.length);

  let highestMonthRevenueInr = 0;
  let highestMonthLabel = '';
  monthlyMetrics.forEach((m) => {
    if (m.revenueInr > highestMonthRevenueInr) {
      highestMonthRevenueInr = m.revenueInr;
      highestMonthLabel = m.fullMonth;
    }
  });

  const total12MonthSignups = monthlyMetrics.reduce((sum, m) => sum + m.newSignups, 0);
  const avgMonthlySignups = Math.round(total12MonthSignups / monthlyMetrics.length);

  const avgChurnRatePercent = Number(
    (
      monthlyMetrics.reduce((sum, m) => sum + m.churnRatePercent, 0) / monthlyMetrics.length
    ).toFixed(1)
  );

  const currentRetentionRatePercent =
    monthlyMetrics[monthlyMetrics.length - 1]?.retentionRatePercent || 95.2;

  // Estimated LTV (Average Revenue Per User * Average Membership Lifespan in months)
  const avgMonthlyArpu = Math.round(avgMonthlyRevenueInr / (runningMembers || 1));
  const avgLifespanMonths = Math.round(100 / (avgChurnRatePercent || 5));
  const estimatedLtvInr = avgMonthlyArpu * avgLifespanMonths;

  // Churn Reasons Distribution
  const churnReasons: ChurnReasonItem[] = [
    { name: 'Relocation / Office Move', count: 18, percentage: 38, color: '#f59e0b' },
    { name: 'Work Schedule / Time Strain', count: 13, percentage: 27, color: '#38bdf8' },
    { name: 'Injury / Medical Advice', count: 7, percentage: 15, color: '#f43f5e' },
    { name: 'Switched to Home Workout', count: 6, percentage: 12, color: '#a855f7' },
    { name: 'Budget / Financial Constraints', count: 4, percentage: 8, color: '#94a3b8' },
  ];

  // Plan Distribution
  const planDistributions: PlanDistributionItem[] = [
    { name: 'Annual Elite Unlimited', count: 48, revenueInr: 720000, color: '#f59e0b' },
    { name: 'Quarterly Pro Transformation', count: 82, revenueInr: 393600, color: '#38bdf8' },
    { name: 'Monthly Strength & Cardio', count: 126, revenueInr: 226800, color: '#10b981' },
    { name: 'Personal Training 12-Pack', count: 34, revenueInr: 244800, color: '#a855f7' },
    { name: 'Half-Yearly Flex Saver', count: 28, revenueInr: 238000, color: '#ec4899' },
  ];

  // Payment Mode Breakdown
  const totalUpi = monthlyMetrics.reduce((sum, m) => sum + m.upiRevenueInr, 0);
  const totalCash = monthlyMetrics.reduce((sum, m) => sum + m.cashRevenueInr, 0);
  const totalBank = monthlyMetrics.reduce((sum, m) => sum + m.bankRevenueInr, 0);
  const totalAll = totalUpi + totalCash + totalBank || 1;

  const paymentModeBreakdown = [
    {
      mode: 'UPI (GPay / PhonePe / Paytm)',
      amountInr: totalUpi,
      percentage: Number(((totalUpi / totalAll) * 100).toFixed(1)),
      color: '#10b981',
    },
    {
      mode: 'Cash at Reception',
      amountInr: totalCash,
      percentage: Number(((totalCash / totalAll) * 100).toFixed(1)),
      color: '#38bdf8',
    },
    {
      mode: 'Bank Transfer & POS Card',
      amountInr: totalBank,
      percentage: Number(((totalBank / totalAll) * 100).toFixed(1)),
      color: '#f59e0b',
    },
  ];

  return {
    total12MonthRevenueInr,
    avgMonthlyRevenueInr,
    highestMonthRevenueInr,
    highestMonthLabel,
    total12MonthSignups,
    avgMonthlySignups,
    avgChurnRatePercent,
    currentRetentionRatePercent,
    estimatedLtvInr,
    monthlyMetrics,
    churnReasons,
    planDistributions,
    paymentModeBreakdown,
  };
}
