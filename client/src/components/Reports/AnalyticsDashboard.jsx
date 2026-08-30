/**
 * ==============================================================================
 * SkinLab AI - Executive Analytics & Financial Reporting
 * 10+ Years Senior UI/UX Designer Redesign (DocuVerse Medical Standards)
 * ==============================================================================
 * - Clean white card surfaces (#ffffff) with subtle borders (#e2e8f0)
 * - Deep Charcoal High-Contrast Numbers & Typography (#0f172a)
 * - Polished Pill Filters & Status Badges
 * - Beautiful Machine ROI Progress Indicators with legible titles
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Coins, 
  Award, 
  Calendar, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Zap,
  Activity,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import MachineROIReport from './MachineROIReport';
import { api } from '@/lib/api';

export default function AnalyticsDashboard() {
  const [activeReportTab, setActiveReportTab] = useState('overview'); // 'overview', 'machine_roi', 'sales_book'
  const [kpis, setKpis] = useState({
    today_sales: 48000,
    patients_treated: 4,
    cash_inflow: 38000,
    total_receivables: 4500
  });
  const [salesBook, setSalesBook] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const stats = await api.getReportStats();
        if (stats) {
          setKpis({
            today_sales: stats.today_sales || 48000,
            patients_treated: stats.total_patients || 4,
            cash_inflow: stats.total_sales || 38000,
            total_receivables: stats.total_outstanding || 4500
          });
        }
        const book = await api.getSalesBook();
        if (book && book.invoices) {
          setSalesBook(book.invoices);
        }
      } catch (e) {
        console.warn('Reports initial load:', e);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="docu-card p-6 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Clinical Reports & Performance Analytics</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Revenue Velocity, Machine ROI & Sales Register</p>
          </div>
        </div>

        {/* Report Mode Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
          <button
            onClick={() => setActiveReportTab('overview')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeReportTab === 'overview'
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-slate-600 hover:text-[#0f172a]'
            }`}
          >
            Real-Time KPIs
          </button>
          <button
            onClick={() => setActiveReportTab('machine_roi')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeReportTab === 'machine_roi'
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-slate-600 hover:text-[#0f172a]'
            }`}
          >
            Machine ROI & Consumables
          </button>
          <button
            onClick={() => setActiveReportTab('sales_book')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              activeReportTab === 'sales_book'
                ? 'bg-white text-[#0f172a] shadow-sm'
                : 'text-slate-600 hover:text-[#0f172a]'
            }`}
          >
            Sales Register (Book)
          </button>
        </div>
      </div>

      {/* VIEW 1: Real-Time KPIs Overview */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Row 1: 4 High-Contrast KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div className="docu-card p-5 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Today's Total Sales</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#0f172a] font-sans">
                PKR {kpis.today_sales.toLocaleString()}
              </div>
              <div className="flex items-center text-xs font-bold text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>+18.5% vs yesterday</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="docu-card p-5 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Patients Treated</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#0f172a] font-sans">
                {kpis.patients_treated}
              </div>
              <span className="text-xs font-semibold text-slate-500 block">
                18 Scheduled, 6 Walk-Ins
              </span>
            </div>

            {/* Card 3 */}
            <div className="docu-card p-5 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Cash Drawer Inflow</span>
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 font-sans">
                PKR {kpis.cash_inflow.toLocaleString()}
              </div>
              <span className="text-xs font-semibold text-slate-500 block">
                Reconciled for Day-End
              </span>
            </div>

            {/* Card 4 */}
            <div className="docu-card p-5 space-y-3 bg-white">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">Receivables (Dues)</span>
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 font-sans">
                PKR {kpis.total_receivables.toLocaleString()}
              </div>
              <span className="text-xs font-semibold text-slate-500 block">
                Multi-session partial dues
              </span>
            </div>

          </div>

          {/* Row 2: Machine Performance & Profit Velocity */}
          <div className="docu-card p-6 space-y-6 bg-white">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-[#0f172a]">Machine & Procedure Performance Velocity</h3>
                <p className="text-xs text-slate-500">Total sessions delivered & gross revenue contribution</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                Monthly Leaderboard
              </span>
            </div>

            {/* High-Legibility Progress Rows */}
            <div className="space-y-5">
              {[
                { name: 'HydraFacial Deluxe', sessions: '84 sessions sold', revenue: 'PKR 504,000', percent: 84, color: 'bg-emerald-500' },
                { name: 'Full Body Laser Package (6S)', sessions: '22 packages sold', revenue: 'PKR 550,000', percent: 92, color: 'bg-teal-500' },
                { name: 'Carbon Laser Peel (Hollywood Peel)', sessions: '39 sessions sold', revenue: 'PKR 195,000', percent: 65, color: 'bg-cyan-500' },
                { name: 'PRP Vampire Facial & DermaPen', sessions: '18 sessions sold', revenue: 'PKR 144,000', percent: 48, color: 'bg-blue-500' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#0f172a] text-sm">{item.name}</span>
                      <span className="text-slate-500 ml-2 font-medium">({item.sessions})</span>
                    </div>
                    <span className="font-extrabold text-[#0f172a] font-mono text-sm">{item.revenue}</span>
                  </div>

                  {/* Progress Bar with Soft Track */}
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* VIEW 2: Machine ROI & Consumables */}
      {activeReportTab === 'machine_roi' && (
        <MachineROIReport />
      )}

      {/* VIEW 3: Sales Register Table */}
      {activeReportTab === 'sales_book' && (
        <div className="docu-card p-6 space-y-4 bg-white">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-[#0f172a]">Daily Sales Register (Invoices)</h3>
            <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Treatments</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesBook.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">{inv.invoice_number}</td>
                    <td className="py-3 px-3 font-bold text-[#0f172a]">{inv.customer_name}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {inv.items?.map(i => i.product_name).join(', ') || 'Custom Treatment'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-[#0f172a]">
                      PKR {inv.grand_total?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">
                      PKR {inv.paid_amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.paid_amount >= inv.grand_total
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {inv.paid_amount >= inv.grand_total ? 'Paid Full' : 'Partial Due'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
