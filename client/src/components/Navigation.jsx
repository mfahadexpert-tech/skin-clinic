/**
 * ==============================================================================
 * SkinLab AI - Left Navigation Sidebar (DocuVerse UI Clone)
 * Pixel-Perfect match to DocuVerse Left Sidebar Reference
 * ==============================================================================
 */

'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart2, 
  Settings, 
  PhoneCall, 
  MessageSquare, 
  Sparkles,
  X
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-doctor', label: 'Doctor', icon: Stethoscope },
    { id: 'prm', label: 'Patients', icon: Users },
    { id: 'calendar', label: 'Appointments', icon: Calendar },
    { id: 'pos', label: 'Billing', icon: CreditCard },
    { id: 'voice-agent', label: 'Voice Booking', icon: PhoneCall },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white p-6 flex flex-col justify-between rounded-l-3xl border-r border-slate-100 min-h-[900px] shrink-0">
      
      {/* Brand Header */}
      <div className="space-y-8">
        
        {/* Logo (DocuVerse Clover Style) */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
          <div className="w-8 h-8 grid grid-cols-2 gap-0.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600" />
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-300" />
          </div>
          <span className="font-extrabold text-lg text-slate-900 tracking-tight">DocuVerse</span>
        </div>

        {/* Menu Navigation Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom Profile & AI Health Update Card */}
      <div className="space-y-4 pt-6">
        
        {/* Profile Chip */}
        <div className="flex items-center space-x-3 px-2">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-xs text-slate-900">Darlene Robertson</div>
            <div className="text-[10px] text-slate-400 font-mono">ID: 72630284</div>
          </div>
        </div>

        {/* AI Health Update Card (DocuVerse Floating Widget) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-100/70 via-teal-50 to-lime-50 border border-emerald-200/50 space-y-3 relative overflow-hidden">
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">AI Health Update</span>
            <button className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 space-y-1">
            <div className="text-[10px] font-bold text-emerald-800">Advantages</div>
            <p className="text-[10px] text-slate-600 leading-tight">
              New AI engine improves diagnosis accuracy by 27%
            </p>
            {/* Wave Graphic */}
            <svg className="w-full h-5 pt-1" viewBox="0 0 100 20">
              <path d="M 0 15 Q 25 5, 50 15 T 100 8" fill="none" stroke="#10b981" strokeWidth="1.5" />
            </svg>
          </div>

          <button
            onClick={() => setActiveTab('ai-doctor')}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Update Now
          </button>

        </div>

      </div>

    </aside>
  );
}
