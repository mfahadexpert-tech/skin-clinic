/**
 * ==============================================================================
 * SkinLab AI - Professional Medical Navigation Sidebar & Header
 * Inspired by WellNest, DocTrack, Youcare, and Deli-Clinico UI Systems
 * ==============================================================================
 */

'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  ShoppingCart, 
  Users, 
  Bot, 
  PhoneCall, 
  MessageSquare, 
  BarChart3, 
  Boxes, 
  UserCheck, 
  Truck, 
  Settings, 
  Wifi, 
  WifiOff, 
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Search,
  Bell,
  ShieldCheck
} from 'lucide-react';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  currentRole, 
  setCurrentRole, 
  isOffline, 
  setIsOffline, 
  outboxCount, 
  onSyncOutbox,
  isDarkMode,
  setIsDarkMode
}) {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Appointments', icon: CalendarIcon, badge: 'Live' },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, badge: 'Desk' },
    { id: 'prm', label: 'Patients (PRM)', icon: Users },
    { id: 'ai-doctor', label: 'Doctor AI (GPT)', icon: Bot, badge: 'RAG' },
    { id: 'voice-agent', label: 'AI Voice Booking', icon: PhoneCall, badge: '24/7' },
    { id: 'whatsapp', label: 'WhatsApp Hub', icon: MessageSquare },
    { id: 'reports', label: 'Analytics & ROI', icon: BarChart3 },
    { id: 'catalog', label: 'Services & Barcodes', icon: Boxes },
    { id: 'hrm', label: 'HRM & Shifts', icon: UserCheck },
    { id: 'purchases', label: 'SRM & Refunds', icon: Truck },
    { id: 'settings', label: 'Settings & Backups', icon: Settings },
  ];

  const roles = [
    { id: 'admin', label: 'Admin / Clinic Owner' },
    { id: 'doctor', label: 'Dr. Sarah Khan (Specialist)' },
    { id: 'manager', label: 'Clinic Manager' },
    { id: 'cashier', label: 'Front Desk Cashier' },
  ];

  return (
    <>
      {/* TOP HEADER BAR (WellNest / Youcare Style) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-6 py-3 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand Logo & Version Pill */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">SkinLab</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Aesthetic & Dermatology Operating System</p>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="hidden md:flex items-center relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patients, invoices, doctors..."
              className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Top Controls: Dark/Light Mode, Role Selector, PWA Offline Status */}
          <div className="flex items-center space-x-3">
            
            {/* Dark / Light Mode Toggle Switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Toggle Dark / Light Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Offline PWA Toggle */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => setIsOffline(!isOffline)}
                className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-lg transition ${
                  isOffline 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
                title="Click to toggle offline mode simulation"
              >
                {isOffline ? <WifiOff className="w-3 h-3 mr-1 text-amber-500 animate-pulse" /> : <Wifi className="w-3 h-3 mr-1 text-emerald-500" />}
                <span className="font-semibold">{isOffline ? 'Offline' : 'Online'}</span>
              </button>

              {outboxCount > 0 && (
                <button
                  onClick={onSyncOutbox}
                  className="flex items-center space-x-1 text-[10px] bg-teal-600 hover:bg-teal-500 text-white font-bold px-2 py-0.5 rounded-lg transition animate-bounce"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Sync ({outboxCount})</span>
                </button>
              )}
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10">
              <ShieldCheck className="w-4 h-4 text-teal-500" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Sub-Header Horizontal Tab Navigation (WellNest Pill Style) */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'nav-pill-active'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/25 text-white font-bold' : 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}
