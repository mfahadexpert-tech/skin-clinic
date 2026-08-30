/**
 * ==============================================================================
 * SkinLab AI - Executive Overview Dashboard
 * Pixel-Perfect Implementation of DocuVerse Medical UI/UX Architecture
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronRight,
  Bookmark,
  Plus,
  ArrowUp,
  Sparkles,
  Clock,
  MapPin
} from 'lucide-react';

export default function OverviewDashboard({ onNavigate }) {
  const [activeDateIndex, setActiveDateIndex] = useState(7); // Active date 19
  const [activeTimeSlot, setActiveTimeSlot] = useState('12:00 PM');

  // Dates row for Doctor Schedule widget
  const dates = [
    { day: 12, doc: 'D1' }, { day: 13, doc: 'D2' }, { day: 14, doc: 'D3' }, 
    { day: 15, doc: 'D4' }, { day: 16, doc: 'D5' }, { day: 17, doc: 'D6' },
    { day: 18, doc: 'D7' }, { day: 19, doc: 'D8' }, { day: 20, doc: 'D9' },
    { day: 21, doc: 'D10' }, { day: 22, doc: 'D11' }, { day: 23, doc: 'D12' }, { day: 24, doc: 'D13' }
  ];

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', 
    '02:00 PM', '03:00 PM', '04:00 PM', '06:00 PM'
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
      </div>

      {/* ROW 1: 4 DocuVerse Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Patients */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Patients</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">178</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-emerald-600">Active</span>
              <span className="text-slate-400">Recovered</span>
            </div>

            {/* Vertical Multi-Bar Graph */}
            <div className="flex items-end space-x-[3px] h-8 pt-1">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-emerald-500"
                  style={{ height: `${20 + (i % 5) * 2}px` }}
                />
              ))}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-slate-200"
                  style={{ height: `${16 + (i % 3) * 3}px` }}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>142</span>
              <span>36</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Doctors */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Active Doctors</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">33</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-rose-500">Available</span>
              <span className="text-slate-400">On Leave</span>
            </div>

            {/* Vertical Multi-Bar Graph */}
            <div className="flex items-end space-x-[3px] h-8 pt-1">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-rose-500"
                  style={{ height: `${20 + (i % 4) * 2.5}px` }}
                />
              ))}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-slate-200"
                  style={{ height: `${14 + (i % 3) * 2}px` }}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>28</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Card 3: Todays Appointments */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Todays Appointments</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">76</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-amber-500">Completed</span>
              <span className="text-slate-400">Upcoming</span>
            </div>

            {/* Vertical Multi-Bar Graph */}
            <div className="flex items-end space-x-[3px] h-8 pt-1">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-amber-400"
                  style={{ height: `${18 + (i % 5) * 2}px` }}
                />
              ))}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-slate-200"
                  style={{ height: `${14 + (i % 2) * 3}px` }}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>54</span>
              <span>22</span>
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Monthly Revenue</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">$2,8156</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-emerald-600">Collected</span>
              <span className="text-slate-400">Outstanding</span>
            </div>

            {/* Vertical Multi-Bar Graph */}
            <div className="flex items-end space-x-[3px] h-8 pt-1">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-emerald-500"
                  style={{ height: `${20 + (i % 4) * 2}px` }}
                />
              ))}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="mini-bar bg-slate-200"
                  style={{ height: `${12 + (i % 3) * 3}px` }}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
              <span>$24.30k</span>
              <span>$3.8k</span>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: 3 Columns (Appointments Trends, Revenue Wave, Doctors Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Col 1 (4 Cols): Appointments Trends */}
        <div className="lg:col-span-4 docu-card p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Appointments Trends</h3>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">Spend this week</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">820</span>
              <span className="text-xs text-rose-500 font-semibold flex items-center">
                ↘ 345.34
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
              124 <span className="text-[10px] text-slate-400 font-normal">Completed</span>
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
              20 <span className="text-[10px] text-slate-400 font-normal">Pending</span>
            </span>
          </div>

          {/* Smooth Green Wave Line Chart with Floating Tooltip Badge */}
          <div className="relative pt-4 h-28 flex items-end">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              <path
                d="M 0,80 Q 40,90 80,75 T 160,50 T 220,20 T 300,60"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <circle cx="220" cy="20" r="5" fill="#10b981" />
            </svg>
            <div className="absolute top-1 right-12 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              15,699
            </div>
          </div>
        </div>

        {/* Col 2 (3 Cols): Revenue Overlapping Wave */}
        <div className="lg:col-span-3 docu-card p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Revenue</h3>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-emerald-600 font-bold flex items-center">
            ↗ 20,873.00
          </div>

          {/* Overlapping Waves Chart */}
          <div className="relative pt-4 h-36 flex items-end">
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
              <path
                d="M 0,70 C 50,20 100,90 150,30 C 180,5 190,50 200,60"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
              />
              <path
                d="M 0,50 C 40,80 90,10 140,70 C 170,90 190,40 200,45"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2"
              />
              <circle cx="140" cy="70" r="4" fill="#0f172a" />
            </svg>
            <div className="absolute top-8 left-24 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              820
            </div>
          </div>
        </div>

        {/* Col 3 (5 Cols): Doctors Schedule Widget */}
        <div className="lg:col-span-5 docu-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Doctors Schedule</h3>
            <button 
              onClick={() => onNavigate('calendar')}
              className="p-1 rounded hover:bg-slate-100 text-slate-400"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-baseline pt-1">
            <div>
              <span className="text-lg font-bold text-slate-900">$92</span>
              <span className="text-xs text-slate-400 ml-1">Per Session</span>
            </div>
            <div className="text-xs text-slate-500 font-medium flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>300 Pasteur DR, Stanford</span>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700">Schedule</span>
            
            {/* Interactive Date Row with Avatars & Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
              {dates.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveDateIndex(idx)}
                  className={`flex flex-col items-center p-1.5 rounded-full cursor-pointer transition ${
                    activeDateIndex === idx ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-bold">{item.day}</span>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-300 mt-1 flex items-center justify-center text-[9px] text-slate-900 font-bold">
                    {item.doc[0]}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Chips */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setActiveTimeSlot(time)}
                  className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold transition ${
                    activeTimeSlot === time
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Ongoing Treatments vs Awaiting Follow up */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-slate-200 rounded-full w-[65%]" />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <div>
                  <div className="font-semibold text-slate-700 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>8 Ongoing Treatments</span>
                  </div>
                  <div className="flex -space-x-1.5 mt-1">
                    {['#10b981', '#06b6d4', '#6366f1'].map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-white text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: c }}>
                        P{i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-500 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span>4 Awaiting Follow up</span>
                  </div>
                  <div className="flex -space-x-1.5 mt-1 justify-end">
                    {['#94a3b8', '#cbd5e1'].map((c, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-white text-[8px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: c }}>
                        F{i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ROW 3: Patient Demographic Cohorts (DocuVerse Style) */}
      <div className="docu-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Patient Demographic</h3>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900">820</span>
              <span className="text-xs text-slate-400 font-medium">Total Patients</span>
              <span className="text-xs text-rose-500 font-semibold">↘ 3.5%</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
              <Bookmark className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cohort Columns Bar Chart */}
        <div className="grid grid-cols-5 gap-4 items-end pt-4 border-b border-slate-100 pb-4">
          {[
            { age: '18-30 yrs', count: 220, height: '85%', tag: '25.0%' },
            { age: '31-45 yrs', count: 195, height: '72%', tag: '35.0%' },
            { age: '46-60 yrs', count: 175, height: '62%', tag: '30.0%' },
            { age: '61-70 yrs', count: 130, height: '45%', tag: '10.0%' },
            { age: '70+ yrs', count: 100, height: '28%', tag: '10.0%' },
          ].map((col, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-2">
              <div className="text-[11px] text-slate-400 font-medium">Active Patients</div>
              <div className="text-sm font-bold text-slate-900 font-mono">{col.count}</div>

              {/* Bar with gradient and hatch pattern */}
              <div className="w-full h-40 bg-slate-50 rounded-xl overflow-hidden flex items-end p-1">
                <div
                  className="w-full bg-gradient-to-t from-lime-500 via-emerald-400 to-teal-500 rounded-lg hatch-pattern shadow-inner transition-all hover:brightness-105"
                  style={{ height: col.height }}
                />
              </div>

              <span className="text-xs font-semibold text-slate-600">{col.age}</span>
            </div>
          ))}
        </div>

        {/* Bottom Percentage Pills */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span><strong>70+:</strong> 10.0%</span>
            <span><strong>18-30:</strong> 25.0%</span>
            <span><strong>51-70:</strong> 30.0%</span>
            <span><strong>31-50:</strong> 35.0%</span>
          </div>
          <span className="text-[11px] text-teal-600 font-semibold cursor-pointer hover:underline">
            Download Demographic Report (.csv)
          </span>
        </div>
      </div>

    </div>
  );
}
