/**
 * ==============================================================================
 * SkinLab AI - Navigation & Role-Based Access Control (RBAC) Header
 * Vibrant Light Theme + Dark Hover Transition + Contrast Colors (Green, Orange, Yellow)
 * ==============================================================================
 */

'use client';

import React, { useRef } from 'react';
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
  RefreshCw,
  ChevronLeft,
  ChevronRight
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
  const navRef = useRef(null);

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, badge: 'Core', color: 'emerald' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: 'Live', color: 'orange' },
    { id: 'prm', label: 'Patients (PRM)', icon: Users, color: 'amber' },
    { id: 'ai-doctor', label: 'Doctor AI (GPT)', icon: Bot, badge: 'RAG', color: 'emerald' },
    { id: 'voice-agent', label: 'Voice Booking', icon: PhoneCall, badge: '24/7', color: 'orange' },
    { id: 'whatsapp', label: 'WhatsApp Hub', icon: MessageSquare, color: 'emerald' },
    { id: 'reports', label: 'Analytics & ROI', icon: BarChart3, color: 'amber' },
    { id: 'catalog', label: 'Services & Barcodes', icon: Boxes, color: 'orange' },
    { id: 'hrm', label: 'HRM & Shifts', icon: UserCheck, color: 'emerald' },
    { id: 'purchases', label: 'SRM & Refunds', icon: Truck, color: 'amber' },
    { id: 'settings', label: 'Settings & Backups', icon: Settings, color: 'orange' },
  ];

  const roles = [
    { id: 'admin', label: 'Admin / Owner' },
    { id: 'doctor', label: 'Dr. Sarah Khan' },
    { id: 'manager', label: 'Clinic Manager' },
    { id: 'cashier', label: 'Reception Cashier' },
  ];

  const scrollLeft = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (navRef.current) {
      navRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 mb-6 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Clinic Logo & Brand */}
        <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('pos')}>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">SkinLab</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                AI Clinical OS
              </span>
            </div>
            <p className="text-xs text-slate-600 font-semibold">Aesthetic & Dermatology Practice System</p>
          </div>
        </div>

        {/* Feature Tabs Container with Modern Arrow Selectors */}
        <div className="flex items-center space-x-1 max-w-3xl flex-1 justify-center">
          
          {/* Scroll Left Arrow Selector */}
          <button
            type="button"
            onClick={scrollLeft}
            className="p-1.5 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-900 hover:text-white text-slate-700 transition shadow-sm shrink-0"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Smooth Scrollable Tabs (Base Light -> Hover Dark) */}
          <nav
            ref={navRef}
            className="flex items-center space-x-1.5 overflow-x-auto py-1 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              // High Contrast Colors: Green, Orange, Yellow
              const badgeBg = item.color === 'emerald'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : item.color === 'orange'
                ? 'bg-orange-100 text-orange-800 border-orange-300'
                : 'bg-amber-100 text-amber-800 border-amber-300';

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${badgeBg}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Scroll Right Arrow Selector */}
          <button
            type="button"
            onClick={scrollRight}
            className="p-1.5 rounded-xl bg-slate-100 border border-slate-300 hover:bg-slate-900 hover:text-white text-slate-700 transition shadow-sm shrink-0"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

        </div>

        {/* Controls: Role Switcher & Offline Mode */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Offline / Online Status */}
          <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded transition ${
                isOffline 
                  ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 mr-1 text-orange-600 animate-pulse" /> : <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
              <span>{isOffline ? 'Offline Mode' : 'Online (PWA)'}</span>
            </button>

            {outboxCount > 0 && (
              <button
                onClick={onSyncOutbox}
                className="flex items-center space-x-1 text-xs bg-amber-500 hover:bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded transition animate-bounce"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync ({outboxCount})</span>
              </button>
            )}
          </div>

          {/* Active Role Selector */}
          <div className="flex items-center space-x-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              className="bg-transparent text-xs text-slate-900 font-extrabold focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-white text-slate-900">
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
