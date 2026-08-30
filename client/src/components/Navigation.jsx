/**
 * ==============================================================================
 * SkinLab AI - Left Navigation Sidebar (High-Contrast DocuVerse UI)
 * Exact Visual Match to Image 1:
 * - Pure White Sidebar (#ffffff)
 * - Deep Charcoal Text & Active Pills
 * - AI Health Update Card with Mint Gradient and Dark Button
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
  X
} from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-doctor', label: 'Doctor', icon: Stethoscope },
    { id: 'prm', label: 'Patients', icon: Users },
    { id: 'calendar', label: 'Appointments', icon: Calendar },
    { id: 'pos', label: 'Billing', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white p-6 flex flex-col justify-between rounded-l-[2rem] border-r border-slate-100 min-h-[900px] shrink-0">
      
      {/* Brand Header */}
      <div className="space-y-8">
        
        {/* Logo (DocuVerse Clover Style) */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
          <div className="w-8 h-8 grid grid-cols-2 gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-[#10b981]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#34d399]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#059669]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#6ee7b7]" />
          </div>
          <span className="font-extrabold text-xl text-[#0f172a] tracking-tight">DocuVerse</span>
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
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#f1f5f9] text-[#0f172a] font-bold shadow-sm'
                    : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-50'
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
        <div className="flex items-center space-x-3 px-1">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
          />
          <div>
            <div className="font-bold text-xs text-[#0f172a]">Darlene Robertson</div>
            <div className="text-[10px] text-slate-400 font-mono font-medium">ID: 72630284</div>
          </div>
        </div>

        {/* AI Health Update Card (DocuVerse Floating Widget) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#dcfce7] via-[#f0fdf4] to-[#fefce8] border border-[#bbf7d0] space-y-3 relative overflow-hidden shadow-sm">
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#0f172a]">AI Health Update</span>
            <button className="text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white/80 backdrop-blur-sm border border-white space-y-1.5 shadow-sm">
            <div className="text-[10px] font-bold text-emerald-900">Advantages</div>
            <p className="text-[11px] text-slate-700 font-medium leading-tight">
              New AI engine improves diagnosis accuracy by 27%
            </p>
            {/* Wave Graphic */}
            <svg className="w-full h-5 pt-1" viewBox="0 0 100 20">
              <path d="M 0 15 Q 25 5, 50 15 T 100 8" fill="none" stroke="#10b981" strokeWidth="2" />
            </svg>
          </div>

          <button
            onClick={() => setActiveTab('ai-doctor')}
            className="w-full py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Update Now
          </button>

        </div>

      </div>

    </aside>
  );
}
