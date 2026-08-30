/**
 * ==============================================================================
 * SkinLab AI - Navigation Sidebar & Top Header Bar
 * Pixel-Perfect Implementation of DocuVerse Medical UI/UX Design System
 * ==============================================================================
 */

'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  Calendar as CalendarIcon, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  UserPlus, 
  CalendarDays, 
  FileText, 
  Sparkles,
  X,
  Plus
} from 'lucide-react';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  currentRole, 
  setCurrentRole,
  isOffline,
  setIsOffline
}) {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hrm', label: 'Doctor', icon: UserCheck },
    { id: 'prm', label: 'Patients', icon: Users },
    { id: 'calendar', label: 'Appointments', icon: CalendarIcon },
    { id: 'pos', label: 'Billing', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* 1. FIXED LEFT SIDEBAR (DocuVerse Style) */}
      <aside className="w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200 z-50 flex flex-col justify-between p-5 overflow-y-auto">
        
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer pl-2" onClick={() => setActiveTab('overview')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm">
              {/* DocuVerse 4-leaf cross icon */}
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">DocuVerse</span>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? 'sidebar-active-item'
                      : 'sidebar-item'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Profile & AI Health Update Card */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          
          {/* User Profile Chip */}
          <div className="flex items-center space-x-3 pl-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-400 to-amber-300 overflow-hidden flex items-center justify-center font-bold text-white text-xs">
              DR
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-tight">Darlene Robertson</div>
              <div className="text-[10px] text-slate-400 font-mono">ID: 72630284</div>
            </div>
          </div>

          {/* DocuVerse Floating AI Health Update Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50 via-teal-50 to-white border border-emerald-200/60 relative shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">AI Health Update</span>
              <button 
                onClick={() => setActiveTab('ai-doctor')}
                className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Advantages</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                New AI engine improves diagnosis accuracy by 27%
              </p>
            </div>

            {/* Wave Illustration Graphic */}
            <div className="h-6 flex items-end">
              <svg viewBox="0 0 100 20" className="w-full h-full">
                <path d="M 0,15 Q 25,5 50,12 T 100,8" fill="none" stroke="#10b981" strokeWidth="2" />
              </svg>
            </div>

            <button
              onClick={() => setActiveTab('ai-doctor')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              Update Now
            </button>
          </div>

        </div>

      </aside>

      {/* 2. TOP HEADER BAR (DocuVerse Style) */}
      <header className="pl-64 sticky top-0 z-40 bg-[#f1f5f9]/90 backdrop-blur-md px-8 py-4 flex items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none shadow-sm focus:border-emerald-500 transition"
          />
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Notification Bell */}
          <button className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm">
            <Bell className="w-4 h-4" />
          </button>

          {/* Add User Icon */}
          <button 
            onClick={() => setActiveTab('prm')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Date Picker Pill */}
          <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <span>October 23, 2026</span>
          </div>

          {/* Primary Action Button (Green DocuVerse Pill) */}
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>

        </div>

      </header>
    </>
  );
}
