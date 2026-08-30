/**
 * ==============================================================================
 * SkinLab AI - Executive Overview Dashboard (DocuVerse UI Clone)
 * Pixel-Perfect match to DocuVerse Design Reference
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Bell, 
  UserPlus, 
  FileText, 
  MoreHorizontal, 
  Bookmark, 
  Plus, 
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function OverviewDashboard({ patients = [], doctors = [], sales = [], onNavigate }) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(7); // 19 active
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('12:00 PM');

  // Dates for doctor schedule row
  const scheduleDates = [
    { day: 12, hasDoc: false },
    { day: 13, hasDoc: true, img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80' },
    { day: 14, hasDoc: false },
    { day: 15, hasDoc: true, img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80' },
    { day: 16, hasDoc: true, img: 'https://images.unsplash.com/photo-1594824813583-b9b69b56f8f7?w=100&auto=format&fit=crop&q=80' },
    { day: 17, hasDoc: false },
    { day: 18, hasDoc: false },
    { day: 19, hasDoc: true, active: true, img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&auto=format&fit=crop&q=80' },
    { day: 20, hasDoc: false },
    { day: 21, hasDoc: true, img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&auto=format&fit=crop&q=80' },
    { day: 22, hasDoc: false },
    { day: 23, hasDoc: true, img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100&auto=format&fit=crop&q=80' },
    { day: 24, hasDoc: true, img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80' },
  ];

  const timeSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '06:00 PM'
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar (DocuVerse Style) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Search Pill */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
          <input
            type="text"
            placeholder="Search patients, doctors, records..."
            className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-2.5 text-xs text-slate-800 outline-none shadow-sm focus:border-emerald-500 transition"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition">
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Date Indicator */}
          <div className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>October 23, 2026</span>
          </div>

          {/* Green CTA Button */}
          <button 
            onClick={() => onNavigate('reports')}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>

      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
      </div>

      {/* Row 1: 4 Metric Cards with Miniature Vertical Status Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Patients */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Total Patients</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">178</div>
            </div>
            <div className="p-2 rounded-full bg-slate-100 text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Active</span>
              <span>Recovered</span>
            </div>
            <div className="flex items-center space-x-1">
              {/* Green active mini bars */}
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="mini-bar bar-green h-4" />
              ))}
              {/* Gray recovered mini bars */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="mini-bar bar-gray h-4" />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-0.5">
              <span>142</span>
              <span>36</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Doctors */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Active Doctors</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">33</div>
            </div>
            <div className="p-2 rounded-full bg-slate-100 text-slate-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Available</span>
              <span>On Leave</span>
            </div>
            <div className="flex items-center space-x-1">
              {/* Orange available mini bars */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="mini-bar bar-orange h-4" />
              ))}
              {/* Gray on leave mini bars */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mini-bar bar-gray h-4" />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-0.5">
              <span>28</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Card 3: Todays Appointments */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Todays Appointments</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">76</div>
            </div>
            <div className="p-2 rounded-full bg-slate-100 text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Completed</span>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center space-x-1">
              {/* Yellow completed mini bars */}
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="mini-bar bar-yellow h-4" />
              ))}
              {/* Gray upcoming mini bars */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="mini-bar bar-gray h-4" />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-0.5">
              <span>54</span>
              <span>22</span>
            </div>
          </div>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div className="docu-card p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400">Monthly Revenue</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">$2,8156</div>
            </div>
            <div className="p-2 rounded-full bg-slate-100 text-slate-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Collected</span>
              <span>Outstanding</span>
            </div>
            <div className="flex items-center space-x-1">
              {/* Green collected mini bars */}
              {Array.from({ length: 19 }).map((_, i) => (
                <div key={i} className="mini-bar bar-green h-4" />
              ))}
              {/* Gray outstanding mini bars */}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="mini-bar bar-gray h-4" />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold pt-0.5">
              <span>$24.30k</span>
              <span>$3.8k</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Appointments Trends, Revenue & Doctors Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Appointments Trends (4 Cols) */}
        <div className="lg:col-span-4 docu-card p-5 space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Appointments Trends</h3>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Spend this week</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900 font-mono">820</span>
              <span className="text-xs text-rose-500 font-semibold">↘ 345.34</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
              124 <span className="font-normal text-slate-400">Completed</span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold">
              20 <span className="font-normal text-slate-400">Pending</span>
            </span>
          </div>

          {/* Smooth Wave SVG Chart */}
          <div className="relative h-28 pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
              <path
                d="M 0 45 Q 30 55, 60 40 T 120 20 T 160 10 T 200 35"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
              />
              <circle cx="160" cy="10" r="4" fill="#10b981" />
            </svg>
            <div className="absolute top-0 right-8 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow">
              15,699
            </div>
          </div>
        </div>

        {/* Revenue Multi-Curve Wave (3 Cols) */}
        <div className="lg:col-span-3 docu-card p-5 space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Revenue</h3>
              <span className="text-xs text-emerald-600 font-bold">↗ 20,873.00</span>
            </div>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Multi-line Wave SVG */}
          <div className="relative h-36 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 150 80">
              <path d="M 0 50 Q 40 20, 75 40 T 150 30" fill="none" stroke="#10b981" strokeWidth="1.5" />
              <path d="M 0 60 Q 45 80, 85 45 T 150 50" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M 0 35 Q 50 10, 95 50 T 150 65" fill="none" stroke="#6ee7b7" strokeWidth="1.5" />
            </svg>
            <div className="absolute top-4 bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow">
              820
            </div>
          </div>
        </div>

        {/* Doctors Schedule (5 Cols) */}
        <div className="lg:col-span-5 docu-card p-5 space-y-3.5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-900">Doctors Schedule</h3>
            <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <div className="text-base font-bold text-slate-900 font-mono">$92</div>
              <span className="text-[10px] text-slate-400">Per Session</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">300 Pasteur DR</div>
              <span className="text-[10px] text-slate-400">Stanford</span>
            </div>
          </div>

          {/* Date Selector Pills */}
          <div>
            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Schedule</span>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
              {scheduleDates.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDateIndex(idx)}
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 transition ${
                    selectedDateIndex === idx
                      ? 'bg-slate-900 text-white shadow'
                      : item.hasDoc
                      ? 'bg-slate-200 text-slate-800'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {item.day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot Pills */}
          <div className="flex flex-wrap gap-1.5">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTimeSlot(time)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                  selectedTimeSlot === time
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {time}
              </button>
            ))}
          </div>

          {/* Gradient Slider Bar */}
          <div className="relative pt-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-yellow-300 via-emerald-400 to-teal-500 w-full" />
            <div className="absolute top-3 left-3/4 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-white shadow -translate-y-1/2" />
          </div>

          {/* Ongoing & Follow up Summary */}
          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
            <div>
              <div className="flex items-center space-x-1 text-slate-700 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>8 Ongoing Treatments</span>
              </div>
              <div className="flex -space-x-1.5 mt-1">
                {['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50'].map((src, i) => (
                  <img key={i} src={src} className="w-5 h-5 rounded-full border border-white object-cover" />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-1 text-slate-700 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>4 Awaiting Follow up</span>
              </div>
              <div className="flex -space-x-1.5 mt-1">
                {['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50'].map((src, i) => (
                  <img key={i} src={src} className="w-5 h-5 rounded-full border border-white object-cover" />
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Row 3: Patient Demographic Age-Striped Bar Chart */}
      <div className="docu-card p-6 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Patient Demographic</h3>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 font-mono">820</span>
              <span className="text-xs text-slate-400">Total Patients</span>
              <span className="text-xs text-rose-500 font-semibold">↘ 3.5%</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
              <Bookmark className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Striped Demographic Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-end">
          
          {/* Age Labels on Left */}
          <div className="md:col-span-2 space-y-4 text-xs font-semibold text-slate-500 pb-2">
            <div>18-30 yrs</div>
            <div>31-45 yrs</div>
            <div>46-60 yrs</div>
            <div>61-70 yrs</div>
            <div>70+ yrs</div>
          </div>

          {/* 5 Striped Demographic Bar Columns */}
          <div className="md:col-span-10 grid grid-cols-5 gap-3 items-end h-44">
            
            {/* Col 1 */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="text-[11px] font-bold text-slate-800 font-mono">220</div>
              <div className="w-full striped-bar-green h-36" />
              <span className="text-[10px] text-slate-400 font-semibold">Active</span>
            </div>

            {/* Col 2 */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="text-[11px] font-bold text-slate-800 font-mono">195</div>
              <div className="w-full striped-bar-green h-28" />
              <span className="text-[10px] text-slate-400 font-semibold">Active</span>
            </div>

            {/* Col 3 */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="text-[11px] font-bold text-slate-800 font-mono">175</div>
              <div className="w-full striped-bar-lime h-24" />
              <span className="text-[10px] text-slate-400 font-semibold">Active</span>
            </div>

            {/* Col 4 */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="text-[11px] font-bold text-slate-800 font-mono">130</div>
              <div className="w-full striped-bar-yellow h-16" />
              <span className="text-[10px] text-slate-400 font-semibold">Active</span>
            </div>

            {/* Col 5 */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="text-[11px] font-bold text-slate-800 font-mono">100</div>
              <div className="w-full striped-bar-yellow h-10" />
              <span className="text-[10px] text-slate-400 font-semibold">Active</span>
            </div>

          </div>

        </div>

        {/* Ratio Tooltip Footer */}
        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Age Breakdown Distribution:</span>
          <span className="font-mono text-emerald-700">70+: 10.0% • 18-30: 25.0% • 51-70: 30.0% • 31-50: 35.0%</span>
        </div>

      </div>

    </div>
  );
}
