import React, { useState, useMemo } from 'react';
import { GymDatabase, User } from '../types/gym';
import { compute12MonthAnalytics, MonthlyMetric } from '../services/analytics';
import { formatINR } from '../services/crypto';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  Users,
  UserMinus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ShieldCheck,
  Download,
  Filter,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart2,
  Activity,
} from 'lucide-react';

interface AnalyticsViewProps {
  db: GymDatabase;
  currentUser: User | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ db, currentUser }) => {
  const [activeChartSection, setActiveChartSection] = useState<'all' | 'revenue' | 'signups' | 'churn'>('all');
  const [timeframeView, setTimeframeView] = useState<'12M' | '6M'>('12M');

  const analytics = useMemo(() => compute12MonthAnalytics(db), [db]);

  const displayedMetrics = useMemo(() => {
    if (timeframeView === '6M') {
      return analytics.monthlyMetrics.slice(6);
    }
    return analytics.monthlyMetrics;
  }, [analytics, timeframeView]);

  // Format currency tooltip
  const customCurrencyFormatter = (value: number) => {
    return [formatINR(value), 'Revenue'];
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">12-Month Performance Analytics</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
              Trailing 12 Months
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Revenue trends · Member signup velocity · Churn rate & retention · Indian Rupee (₹)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setTimeframeView('12M')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeframeView === '12M'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Full 12 Months
            </button>
            <button
              onClick={() => setTimeframeView('6M')}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeframeView === '6M'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Last 6 Months
            </button>
          </div>

          {/* Section Filter */}
          <div className="hidden md:flex items-center bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-xs">
            {(['all', 'revenue', 'signups', 'churn'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveChartSection(sec)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeChartSection === sec
                    ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {sec === 'all'
                  ? 'All Views'
                  : sec === 'revenue'
                  ? 'Revenue'
                  : sec === 'signups'
                  ? 'Signups'
                  : 'Churn'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4-Stat Primary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: 12-Month Revenue */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>12-Month Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {formatINR(analytics.total12MonthRevenueInr)}
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.4% MoM</span>
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1 border-t border-neutral-800/80">
            <span>Monthly Avg: {formatINR(analytics.avgMonthlyRevenueInr)}</span>
            <span className="text-neutral-500">Peak: Nov 26</span>
          </div>
        </div>

        {/* KPI 2: Signups Growth */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Total Signups (12M)</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {analytics.total12MonthSignups}
            </span>
            <span className="text-xs font-mono text-sky-400">
              ~{analytics.avgMonthlySignups}/mo pace
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1 border-t border-neutral-800/80">
            <span>Current Roster: {analytics.monthlyMetrics[analytics.monthlyMetrics.length - 1]?.cumulativeMembers} lifters</span>
            <span className="text-emerald-400">+112 Net</span>
          </div>
        </div>

        {/* KPI 3: Churn Rate */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Avg Monthly Churn Rate</span>
            <UserMinus className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
              {analytics.avgChurnRatePercent}%
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {analytics.currentRetentionRatePercent}% Retention
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1 border-t border-neutral-800/80">
            <span>Benchmark: &lt; 6.0%</span>
            <span className="text-emerald-400">Healthy</span>
          </div>
        </div>

        {/* KPI 4: Estimated Customer LTV */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Estimated Member LTV</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
              {formatINR(analytics.estimatedLtvInr)}
            </span>
            <span className="text-xs font-mono text-neutral-400">
              ~18 mo lifespan
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between pt-1 border-t border-neutral-800/80">
            <span>ARPU: ₹1,250/mo</span>
            <span className="text-amber-400">Recurring</span>
          </div>
        </div>
      </div>

      {/* CHART 1: Monthly Revenue Trends (Area + Target) */}
      {(activeChartSection === 'all' || activeChartSection === 'revenue') && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Monthly Revenue Progression (INR ₹)</h3>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Actual external collections vs target revenue threshold across the last {timeframeView === '12M' ? '12' : '6'} months
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-400" />
                <span className="text-neutral-300">Actual Collections</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-sky-400" />
                <span className="text-neutral-400">Target Budget</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayedMetrics} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                />
                <YAxis
                  stroke="#737373"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlyMetric;
                      return (
                        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 shadow-xl text-xs space-y-1.5">
                          <span className="font-bold text-white block">{data.fullMonth}</span>
                          <div className="flex justify-between gap-4 text-amber-400 font-mono font-semibold">
                            <span>Revenue:</span>
                            <span>{formatINR(data.revenueInr)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-neutral-400 font-mono text-[11px]">
                            <span>Target:</span>
                            <span>{formatINR(data.targetRevenueInr)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-emerald-400 font-mono text-[11px]">
                            <span>MoM Growth:</span>
                            <span>{data.momRevenueGrowthPercent > 0 ? `+${data.momRevenueGrowthPercent}%` : `${data.momRevenueGrowthPercent}%`}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenueInr"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="targetRevenueInr"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue By Mode Stacked Bar */}
          <div className="pt-3 border-t border-neutral-800">
            <span className="text-xs font-semibold text-neutral-300 block mb-2">
              Collections by Settlement Channel (UPI vs Cash vs Bank Transfer)
            </span>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedMetrics} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as MonthlyMetric;
                        return (
                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                            <span className="font-bold text-white block mb-1">{data.fullMonth}</span>
                            <div className="text-emerald-400 flex justify-between gap-4">
                              <span>UPI:</span>
                              <span>{formatINR(data.upiRevenueInr)}</span>
                            </div>
                            <div className="text-sky-400 flex justify-between gap-4">
                              <span>Cash:</span>
                              <span>{formatINR(data.cashRevenueInr)}</span>
                            </div>
                            <div className="text-amber-400 flex justify-between gap-4">
                              <span>Bank/POS:</span>
                              <span>{formatINR(data.bankRevenueInr)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="upiRevenueInr" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="UPI" />
                  <Bar dataKey="cashRevenueInr" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} name="Cash" />
                  <Bar dataKey="bankRevenueInr" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Bank Transfer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column: Member Signup Growth (Left) + Churn & Retention Rates (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 2: Member Signup Growth */}
        {(activeChartSection === 'all' || activeChartSection === 'signups') && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Member Signup Velocity</h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Monthly new member intake & cumulative active lifters
                </p>
              </div>
              <span className="text-[11px] font-mono text-sky-400">
                12M Total: +{analytics.total12MonthSignups}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedMetrics} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as MonthlyMetric;
                        return (
                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                            <span className="font-bold text-white block mb-1">{data.fullMonth}</span>
                            <div className="text-sky-300 flex justify-between gap-4">
                              <span>New Signups:</span>
                              <span>+{data.newSignups}</span>
                            </div>
                            <div className="text-neutral-400 flex justify-between gap-4">
                              <span>Total Active:</span>
                              <span>{data.cumulativeMembers} lifters</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="newSignups" fill="#38bdf8" radius={[4, 4, 0, 0]} name="New Signups" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-lg text-xs space-y-1 text-neutral-300">
              <span className="font-semibold text-white block">Seasonal Intake Insights:</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Significant acquisition spikes occur in <strong>January</strong> (+32) following New Year resolutions and <strong>November</strong> (+38) driven by the winter strength challenge.
              </p>
            </div>
          </div>
        )}

        {/* CHART 3: Member Churn Rates & Reasons */}
        {(activeChartSection === 'all' || activeChartSection === 'churn') && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserMinus className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Monthly Churn & Retention Rates</h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Percentage of active memberships expired / not renewed
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                Avg: {analytics.avgChurnRatePercent}%
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayedMetrics} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#737373" fontSize={11} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={11} tickLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 10]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as MonthlyMetric;
                        return (
                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                            <span className="font-bold text-white block mb-1">{data.fullMonth}</span>
                            <div className="text-rose-400 flex justify-between gap-4">
                              <span>Churn Rate:</span>
                              <span>{data.churnRatePercent}% ({data.churnedMembers} members)</span>
                            </div>
                            <div className="text-emerald-400 flex justify-between gap-4">
                              <span>Retention:</span>
                              <span>{data.retentionRatePercent}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="churnRatePercent"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={{ fill: '#f43f5e', r: 3 }}
                    name="Monthly Churn %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Churn Reasons Breakdown */}
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-xs font-semibold text-neutral-300 block mb-2">
                Primary Churn Reasons (Exit Survey Data)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {analytics.churnReasons.map((reason) => (
                  <div key={reason.name} className="flex items-center justify-between p-2 bg-neutral-950/60 border border-neutral-800 rounded">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: reason.color }} />
                      <span className="text-neutral-300 text-[11px] truncate">{reason.name}</span>
                    </div>
                    <span className="text-neutral-400 font-bold ml-1">{reason.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 12-Month Performance Ledger Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Historical 12-Month Metrics Ledger</h3>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {displayedMetrics.length} Months Tabulated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase font-mono text-[11px] border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-3 text-right">Collections (INR)</th>
                <th className="py-3 px-3 text-right">MoM Growth</th>
                <th className="py-3 px-3 text-right">New Signups</th>
                <th className="py-3 px-3 text-right">Active Lifters</th>
                <th className="py-3 px-3 text-right">Churn %</th>
                <th className="py-3 px-4">Dominant Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 font-mono text-xs">
              {displayedMetrics.map((row) => (
                <tr key={row.monthKey} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white font-sans">
                    {row.fullMonth}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-amber-400 tabular-nums">
                    {formatINR(row.revenueInr)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <span
                      className={
                        row.momRevenueGrowthPercent > 0
                          ? 'text-emerald-400'
                          : row.momRevenueGrowthPercent < 0
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }
                    >
                      {row.momRevenueGrowthPercent > 0 ? `+${row.momRevenueGrowthPercent}%` : `${row.momRevenueGrowthPercent}%`}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-sky-400 tabular-nums">
                    +{row.newSignups}
                  </td>
                  <td className="py-3 px-3 text-right text-neutral-200 tabular-nums">
                    {row.cumulativeMembers}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-400 tabular-nums">
                    {row.churnRatePercent}%
                  </td>
                  <td className="py-3 px-4 text-neutral-300 font-sans text-[11px]">
                    UPI ({Math.round((row.upiRevenueInr / row.revenueInr) * 100)}%) · Cash ({Math.round((row.cashRevenueInr / row.revenueInr) * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
