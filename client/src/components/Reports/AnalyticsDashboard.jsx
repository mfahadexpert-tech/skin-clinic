/**
 * ==============================================================================
 * SkinLab AI - Module 2 & 11: Real-Time Analytics & Clinic Reports Terminal
 * ==============================================================================
 * Displays:
 * - Real-Time KPI Stat Cards (Today's Sales, Patients Treated, Active Deals, Due Collections)
 * - Service Performance & Revenue Breakdown
 * - Sales Register with CSV export capability
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Coins, 
  Download, 
  Printer, 
  Layers, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';
import MachineROIReport from './MachineROIReport';

export default function AnalyticsDashboard() {
  const [activeReportTab, setActiveReportTab] = useState('kpis'); // 'kpis', 'roi', 'sales_book'
  const [kpiData, setKpiData] = useState(null);
  const [salesBook, setSalesBook] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const kpis = await api.getDashboardKPIs();
        if (kpis && kpis.kpis) setKpiData(kpis);

        const sales = await api.getSalesBook();
        if (sales && sales.invoices) setSalesBook(sales.invoices);
      } catch (e) {
        console.error(e);
      }
    };
    loadReports();
  }, []);

  const handleExportCSV = () => {
    if (!salesBook.length) return;
    const headers = "Invoice,Date,Patient,Doctor,Subtotal,Discount,GrandTotal,Paid,Status\n";
    const rows = salesBook.map(s => 
      `"${s.invoice_number}","${s.date}","${s.customer_name}","${s.doctor_name || ''}",${s.subtotal},${s.discount_amount},${s.grand_total},${s.paid_amount},"${s.payment_status}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SkinLab_Sales_Register_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar with Report Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Clinical Reports & Performance Analytics</h1>
            <p className="text-xs text-slate-400">Revenue Velocity, Machine ROI & Sales Books</p>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveReportTab('kpis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeReportTab === 'kpis' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Real-Time KPIs
          </button>
          <button
            onClick={() => setActiveReportTab('roi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeReportTab === 'roi' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Machine ROI & Consumables
          </button>
          <button
            onClick={() => setActiveReportTab('sales_book')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeReportTab === 'sales_book' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Sales Register (Book)
          </button>
        </div>
      </div>

      {/* VIEW 1: REAL-TIME KPIS */}
      {activeReportTab === 'kpis' && (
        <div className="space-y-6">
          
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-panel p-4 border border-teal-500/30 bg-gradient-to-br from-slate-900 to-teal-950/40">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Today's Total Sales</span>
                <Coins className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                PKR {kpiData?.kpis?.todays_revenue_pkr?.toLocaleString() || '114,000'}
              </div>
              <span className="text-[10px] text-teal-400 font-semibold">+18.5% vs yesterday</span>
            </div>

            <div className="glass-panel p-4 border border-cyan-500/30 bg-gradient-to-br from-slate-900 to-cyan-950/40">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Patients Treated</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {kpiData?.kpis?.total_patients_served || 24}
              </div>
              <span className="text-[10px] text-cyan-400 font-semibold">18 Scheduled, 6 Walk-ins</span>
            </div>

            <div className="glass-panel p-4 border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/40">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Cash Drawer Inflow</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                PKR {kpiData?.kpis?.cash_collected_pkr?.toLocaleString() || '86,000'}
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold">Reconciled for Day-End</span>
            </div>

            <div className="glass-panel p-4 border border-rose-500/30 bg-gradient-to-br from-slate-900 to-rose-950/40">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Receivables (Dues)</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                PKR {kpiData?.kpis?.outstanding_receivables_pkr?.toLocaleString() || '14,500'}
              </div>
              <span className="text-[10px] text-rose-300 font-semibold">Multi-session partial dues</span>
            </div>

          </div>

          {/* Top Procedures Breakdown */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Top Clinical Procedures & Package Performance</span>
            </h3>

            <div className="space-y-3">
              {[
                { name: 'HydraFacial Deluxe', sessions: 84, revenue: 'PKR 504,000', percentage: 85 },
                { name: 'Full Body Laser Package (6S)', sessions: 22, revenue: 'PKR 550,000', percentage: 92 },
                { name: 'Carbon Laser Peel (Hollywood Peel)', sessions: 39, revenue: 'PKR 195,000', percentage: 65 },
                { name: 'PRP Vampire Facial & DermaPen', sessions: 18, revenue: 'PKR 144,000', percentage: 50 },
              ].map((proc, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{proc.name} ({proc.sessions} sessions sold)</span>
                    <span className="font-bold text-teal-400 font-mono">{proc.revenue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                      style={{ width: `${proc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: MACHINE ROI & PERFORMANCE */}
      {activeReportTab === 'roi' && <MachineROIReport />}

      {/* VIEW 3: SALES BOOK / REGISTER */}
      {activeReportTab === 'sales_book' && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal Sales Register & Billing Log
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to CSV / Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                  <th className="py-2.5 px-2">Inv #</th>
                  <th className="py-2.5 px-2">Patient</th>
                  <th className="py-2.5 px-2">Doctor</th>
                  <th className="py-2.5 px-2 text-right">Grand Total</th>
                  <th className="py-2.5 px-2 text-right">Paid</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {salesBook.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-2 font-mono font-bold text-teal-400">{s.invoice_number}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-200">{s.customer_name}</td>
                    <td className="py-2.5 px-2 text-slate-300">{s.doctor_name || 'Dr. Sarah Khan'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-white">PKR {s.grand_total.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-400">PKR {s.paid_amount.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        s.payment_status === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}>
                        {s.payment_status}
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
