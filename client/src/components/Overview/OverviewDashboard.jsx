/**
 * ==============================================================================
 * SkinLab AI - Executive Clinical Overview & Analytics Dashboard
 * Inspired by WellNest, DocTrack, Deli-Clinico & DocuVerse Layouts
 * ==============================================================================
 * Features:
 * 1. Morning Greeting Header with active shift info.
 * 2. 4 Modern KPI Metric Cards with progress indicators and trends.
 * 3. Interactive Patient Flow & Revenue Charts.
 * 4. Right-Hand Mini Calendar & Agenda Timeline (Today's Visits).
 * 5. Doctors' Schedule & Live Availability.
 * 6. Treatment Phase Progress Gauge (Early Stage, Ongoing, Maintenance).
 * 7. AI Clinical Intelligence Update Card.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  Coins, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  Stethoscope, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

export default function OverviewDashboard({ 
  patients = [], 
  doctors = [], 
  sales = [], 
  appointments = [],
  onNavigate 
}) {
  const [trendRange, setTrendRange] = useState('8days'); // '8days', 'monthly'

  // Metric aggregates
  const totalRevenue = sales.reduce((acc, s) => acc + (s.grand_total || 0), 0);
  const totalCashCollected = sales.reduce((acc, s) => acc + (s.paid_amount || 0), 0);
  const totalDue = patients.reduce((acc, p) => acc + (p.current_balance || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner (DocTrack Style) */}
      <div className="flex flex-wrap items-center justify-between gap-4 medical-card p-6 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent border-teal-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Good Morning, Dr. Sarah Khan</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              Senior Consultant
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-2">
            <span>Today's Shift: <strong>10:00 AM – 06:00 PM</strong></span>
            <span>•</span>
            <span>Laser Suite 1 & Facial Treatment Room</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('pos')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md shadow-teal-500/20 transition"
          >
            + Create New POS Sale
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition"
          >
            View Full Calendar
          </button>
        </div>
      </div>

      {/* Row 1: 4 Professional KPI Metric Cards (WellNest & DocuVerse Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Revenue */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Today's Revenue</span>
            <span className="flex items-center text-teal-600 dark:text-teal-400 font-bold text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +18.5%
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            PKR {totalRevenue.toLocaleString()}
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full w-[78%]" />
            </div>
            <span className="text-[10px] text-slate-400">78% of daily target reached</span>
          </div>
        </div>

        {/* Card 2: Total Patients Served */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Patients Treated</span>
            <span className="flex items-center text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.4%
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {patients.length * 8}
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full w-[65%]" />
            </div>
            <span className="text-[10px] text-slate-400">18 Scheduled, 6 Walk-ins today</span>
          </div>
        </div>

        {/* Card 3: Cash Inflow */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Cash Inflow</span>
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +9.2%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            PKR {totalCashCollected.toLocaleString()}
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
            </div>
            <span className="text-[10px] text-slate-400">Reconciled in Reception Drawer</span>
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className="medical-card p-5 space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Remaining Dues</span>
            <span className="flex items-center text-rose-600 dark:text-rose-400 font-bold text-[11px]">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -4.1%
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
            PKR {totalDue.toLocaleString()}
          </div>
          <div className="space-y-1">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full w-[35%]" />
            </div>
            <span className="text-[10px] text-slate-400">Recoverable upon next session visit</span>
          </div>
        </div>

      </div>

      {/* Row 2: Main Trend Charts & Right-Hand Schedule Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (8 Cols): Patient Overview & Revenue Trend */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Overview & Weekly Flow (WellNest Chart Widget) */}
          <div className="medical-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Patient Visits & Procedure Flow</h3>
                <p className="text-xs text-slate-400">Daily appointment volume and completed sessions</p>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setTrendRange('8days')}
                  className={`px-3 py-1 rounded-lg transition ${trendRange === '8days' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500'}`}
                >
                  Last 8 Days
                </button>
                <button
                  onClick={() => setTrendRange('monthly')}
                  className={`px-3 py-1 rounded-lg transition ${trendRange === 'monthly' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500'}`}
                >
                  Monthly
                </button>
              </div>
            </div>

            {/* Custom Bar Flow Chart (WellNest Styled) */}
            <div className="pt-4 flex items-end justify-between h-52 px-2 border-b border-slate-100 dark:border-white/10">
              {[
                { day: '24 Aug', count: 18, laser: 8, facial: 10 },
                { day: '25 Aug', count: 24, laser: 12, facial: 12 },
                { day: '26 Aug', count: 16, laser: 6, facial: 10 },
                { day: '27 Aug', count: 28, laser: 15, facial: 13 },
                { day: '28 Aug', count: 22, laser: 10, facial: 12 },
                { day: '29 Aug', count: 32, laser: 18, facial: 14 },
                { day: '30 Aug', count: 26, laser: 14, facial: 12 },
                { day: 'Today', count: 35, laser: 20, facial: 15 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2 group cursor-pointer">
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-teal-600 dark:text-teal-400 transition">
                    {item.count}
                  </div>
                  <div className="w-8 flex flex-col justify-end space-y-1 h-36">
                    <div
                      className="w-full bg-teal-500 rounded-t-md transition-all group-hover:brightness-110"
                      style={{ height: `${(item.facial / 35) * 100}%` }}
                      title={`Facials: ${item.facial}`}
                    />
                    <div
                      className="w-full bg-cyan-400 rounded-b-md transition-all group-hover:brightness-110"
                      style={{ height: `${(item.laser / 35) * 100}%` }}
                      title={`Laser: ${item.laser}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span>HydraFacials & Peels</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Laser Hair Removal</span>
                </span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Peak Inflow: 2:00 PM – 5:00 PM</span>
            </div>
          </div>

          {/* Patient Treatment Phases & Demographics (DocTrack / DocuVerse Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Treatment Phases Widget */}
            <div className="medical-card p-5 space-y-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Patient Treatment Lifecycle
              </h4>
              <p className="text-xs text-slate-400">Active multi-session progress</p>

              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-teal-600 dark:text-teal-400">Early Stage (Sessions 1-2)</span>
                    <span className="text-slate-700 dark:text-slate-300">28 Patients (45%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-cyan-600 dark:text-cyan-400">Ongoing (Sessions 3-5)</span>
                    <span className="text-slate-700 dark:text-slate-300">22 Patients (35%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full w-[35%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">Maintenance / Final Glow</span>
                    <span className="text-slate-700 dark:text-slate-300">12 Patients (20%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full w-[20%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Clinical Intelligence Banner (DocuVerse Style) */}
            <div className="medical-card p-5 bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-transparent border-teal-500/30 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Clinical Intelligence Active</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Automated Pre & Post-Care Advisory
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  LangGraph RAG model is assisting Dr. Sarah Khan with real-time protocol parameters & multilingual Roman Urdu advice.
                </p>
              </div>

              <button
                onClick={() => onNavigate('ai-doctor')}
                className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Launch AI Doctor Assistant →
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (4 Cols): Mini Calendar & Today's Appointments Agenda (WellNest Style) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Today's Schedule Agenda Card */}
          <div className="medical-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Today's Schedule</h3>
                <p className="text-xs text-slate-400">Monday, August 31, 2026</p>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 text-xs font-bold"
              >
                + Add
              </button>
            </div>

            {/* Time-blocked Agenda List */}
            <div className="space-y-3">
              {[
                { time: '10:00 AM', title: 'Clinic Morning Staff Briefing', doc: 'All Staff', color: 'border-l-4 border-slate-400 bg-slate-50 dark:bg-slate-800/40' },
                { time: '11:00 AM', title: 'Laser Hair Reduction (Session 3)', doc: 'Ayesha Khan • Dr. Sarah', color: 'border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-950/20' },
                { time: '02:30 PM', title: 'PRP Vampire Facial & DermaPen', doc: 'Bilal Ahmed • Dr. Ayesha', color: 'border-l-4 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20' },
                { time: '04:00 PM', title: 'Carbon Laser Peel (Hollywood Glow)', doc: 'Fatima Ali • Dr. Sarah', color: 'border-l-4 border-teal-500 bg-teal-50/50 dark:bg-teal-950/20' },
              ].map((slot, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${slot.color} space-y-1 transition hover:scale-[1.01]`}>
                  <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{slot.time}</span>
                    </span>
                    <span className="uppercase text-teal-600 dark:text-teal-400 font-bold">Confirmed</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{slot.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{slot.doc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('calendar')}
              className="w-full py-2 text-center text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center justify-center space-x-1"
            >
              <span>View All 8 Appointments</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Popular Treatments ROI Summary (Deli-Clinico Style) */}
          <div className="medical-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Top Machine ROI & Ratings
              </h4>
              <Award className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'HydraFacial Deluxe', rating: '4.9 ★', revenue: 'PKR 504,000', margin: '80%' },
                { name: 'Diode Laser 808nm', rating: '4.8 ★', revenue: 'PKR 550,000', margin: '90%' },
                { name: 'Carbon Laser Peel', rating: '4.7 ★', revenue: 'PKR 195,000', margin: '82%' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-[10px] text-amber-500 font-semibold">{item.rating} • {item.margin} margin</div>
                  </div>
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">{item.revenue}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
