/**
 * ==============================================================================
 * SkinLab AI - Navigation & Role-Based Access Control (RBAC) Header
 * ==============================================================================
 * Renders the top clinic navigation bar with:
 * - Clinic Branding Logo & Title
 * - Module Tab Selectors (POS, PRM, Appointments Calendar, AI Doctor, Voice Agent, etc.)
 * - Role Switcher (ADMIN, DOCTOR, MANAGER, CASHIER) with live permission badges
 * - Online / Offline Simulation Toggle with Outbox sync counter
 * ==============================================================================
 */

'use client';

import React from 'react';
import { 
  Sparkles, 
  ShoppingCart, 
  Users, 
  Calendar,
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
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function Navigation({ 
  activeTab, 
  setActiveTab, 
  currentRole, 
  setCurrentRole, 
  isOffline, 
  setIsOffline, 
  outboxCount, 
  onSyncOutbox 
}) {
  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, badge: 'Core' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: 'Live' },
    { id: 'prm', label: 'Patients (PRM)', icon: Users },
    { id: 'ai-doctor', label: 'Doctor AI (GPT)', icon: Bot, badge: 'RAG' },
    { id: 'voice-agent', label: 'Voice Booking', icon: PhoneCall, badge: '24/7' },
    { id: 'whatsapp', label: 'WhatsApp Hub', icon: MessageSquare },
    { id: 'reports', label: 'Analytics & ROI', icon: BarChart3 },
    { id: 'catalog', label: 'Services & Barcodes', icon: Boxes },
    { id: 'hrm', label: 'HRM & Shifts', icon: UserCheck },
    { id: 'purchases', label: 'SRM & Refunds', icon: Truck },
    { id: 'settings', label: 'Settings & Backups', icon: Settings },
  ];

  const roles = [
    { id: 'admin', label: 'Admin / Owner' },
    { id: 'doctor', label: 'Dr. Sarah Khan' },
    { id: 'manager', label: 'Clinic Manager' },
    { id: 'cashier', label: 'Reception Cashier' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Clinic Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pos')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">SkinLab</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AI Clinical OS
              </span>
            </div>
            <p className="text-xs text-slate-400">Aesthetic & Dermatology Practice System</p>
          </div>
        </div>

        {/* Module Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-1 max-w-3xl no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-950/30 text-slate-900 font-bold' : 'bg-teal-900/50 text-teal-300 border border-teal-600/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Controls: Role Switcher & Offline Mode */}
        <div className="flex items-center space-x-3">
          
          {/* Offline / Online Status */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-white/10 px-2.5 py-1 rounded-lg">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded transition ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Click to toggle offline mode simulation"
            >
              {isOffline ? <WifiOff className="w-3 h-3 mr-1 text-amber-400 animate-pulse" /> : <Wifi className="w-3 h-3 mr-1 text-emerald-400" />}
              <span>{isOffline ? 'Offline Mode' : 'Online (PWA)'}</span>
            </button>

            {outboxCount > 0 && (
              <button
                onClick={onSyncOutbox}
                className="flex items-center space-x-1 text-[11px] bg-teal-600 hover:bg-teal-500 text-white px-2 py-0.5 rounded transition animate-bounce"
                title="Sync pending offline outbox records"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Sync ({outboxCount})</span>
              </button>
            )}
          </div>

          {/* Active Role Selector */}
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-white/10 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>
    </header>
  );
}
