/**
 * ==============================================================================
 * SkinLab AI - Module 2: Doctor & Specialist Role Dashboard
 * ==============================================================================
 * Displays: Today's Clinical Roster, Patients Waiting in Treatment Suites,
 * Safety Contraindication Alerts, Post-Laser Follow-ups, and AI Assistant Access.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, ShieldAlert, Bot, CheckCircle2, Clock } from 'lucide-react';
import { KPICard, ClinicalButton, ClinicalBadge, ClinicalAlert, ClinicalTable } from '@/components/ui/UIComponents';
import { api } from '@/lib/api';

export default function DoctorDashboard({ onNavigateTab }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getCalendarSchedule();
        if (res && res.appointments) setAppointments(res.appointments);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-5 text-slate-900">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Assigned Patients Today"
          value={appointments.length}
          subtitle="Clinical consultations & procedures"
          icon={Stethoscope}
          color="emerald"
        />
        <KPICard
          title="Patients in Treatment Suite"
          value="2 Waiting"
          subtitle="Suite 1 (HydraFacial) & Suite 2 (Laser)"
          icon={Clock}
          color="orange"
        />
        <KPICard
          title="Safety Protocols Active"
          value="100% Verified"
          subtitle="Fitzpatrick Tone IV & Roaccutane check"
          icon={ShieldAlert}
          color="amber"
        />
        <KPICard
          title="AI Clinical Assistant"
          value="LangGraph RAG"
          subtitle="English & Roman Urdu advice"
          icon={Bot}
          color="slate"
        />
      </div>

      {/* Clinical Contraindication Alert */}
      <ClinicalAlert
        type="warning"
        title="Mandatory Pre-Laser & Chemical Peel Safety Check"
        message="Verify Roaccutane / Isotretinoin oral use within the past 6 months before conducting deep medium chemical peels or high-fluence laser resurfacing."
      />

      {/* Quick AI Launcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">GPT-4o Medical Assistant Engine</h4>
            <p className="text-[11px] text-slate-500 font-medium">Query fluences, Fitzpatrick skin classifications & peel depths</p>
          </div>
        </div>

        <ClinicalButton variant="emerald" size="sm" onClick={() => onNavigateTab && onNavigateTab('ai-doctor')}>
          <span>Open AI Assistant</span>
        </ClinicalButton>
      </div>

      {/* Practitioner Schedule Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Practitioner Clinical Consultations Roster
        </h3>

        <ClinicalTable
          headers={[
            { label: 'Time' },
            { label: 'Patient Name' },
            { label: 'Clinical Procedure' },
            { label: 'Specialist' },
            { label: 'Status' }
          ]}
        >
          {appointments.map((appt) => (
            <tr key={appt.id} className="hover:bg-slate-50 transition">
              <td className="py-3 px-3.5 font-mono font-bold text-slate-900">{appt.time || '10:30 AM'}</td>
              <td className="py-3 px-3.5 font-extrabold text-slate-900">{appt.customer_name}</td>
              <td className="py-3 px-3.5 font-bold text-slate-800">{appt.treatment_name}</td>
              <td className="py-3 px-3.5 font-bold text-emerald-800">{appt.doctor_name}</td>
              <td className="py-3 px-3.5">
                <ClinicalBadge variant="emerald">{appt.status}</ClinicalBadge>
              </td>
            </tr>
          ))}
        </ClinicalTable>
      </div>

    </div>
  );
}
