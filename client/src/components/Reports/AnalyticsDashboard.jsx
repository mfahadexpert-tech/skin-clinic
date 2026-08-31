/**
 * ==============================================================================
 * SkinLab AI - Module 2 & 11: Role-Specific Analytics & Reports Controller
 * ==============================================================================
 * Renders role-specific dashboards:
 * - Owner / Admin -> Executive Revenue, Retention, Practitioner Performance & ROI
 * - Doctor / Therapist -> Patient Consultations, Safety Contraindications & AI Assistant
 * - Receptionist / Cashier -> Today's Roster, Waiting Queue & Quick POS Shortcuts
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { BarChart3, ShieldCheck, UserCheck, Crown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import OwnerDashboard from './OwnerDashboard';
import DoctorDashboard from './DoctorDashboard';
import ReceptionDashboard from './ReceptionDashboard';
import { ClinicalButton } from '@/components/ui/UIComponents';

export default function AnalyticsDashboard({ onNavigateTab }) {
  const { currentRole, changeRole } = useAuth();
  const activeRole = currentRole.toLowerCase();

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Top Header & Role Dashboard Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Clinical Performance & Reports Dashboard</h1>
            <p className="text-xs text-slate-500 font-medium">
              Active Dashboard View: <span className="font-extrabold text-slate-900 capitalize">{activeRole} Mode</span>
            </p>
          </div>
        </div>

        {/* Quick Role Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => changeRole('owner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1 ${
              activeRole === 'owner' || activeRole === 'admin'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Owner / Executive</span>
          </button>

          <button
            onClick={() => changeRole('doctor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1 ${
              activeRole === 'doctor' || activeRole === 'therapist'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Doctor / Specialist</span>
          </button>

          <button
            onClick={() => changeRole('receptionist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1 ${
              activeRole === 'receptionist' || activeRole === 'cashier'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
            <span>Reception Desk</span>
          </button>
        </div>
      </div>

      {/* Render Role Dashboard Component */}
      {(activeRole === 'owner' || activeRole === 'admin' || activeRole === 'manager') && (
        <OwnerDashboard />
      )}

      {(activeRole === 'doctor' || activeRole === 'therapist') && (
        <DoctorDashboard onNavigateTab={onNavigateTab} />
      )}

      {(activeRole === 'receptionist' || activeRole === 'cashier') && (
        <ReceptionDashboard onNavigateTab={onNavigateTab} />
      )}

    </div>
  );
}
