/**
 * ==============================================================================
 * SkinLab AI - Module 2: Receptionist Role Dashboard
 * ==============================================================================
 * Displays: Today's Appointments, Waiting Patients, Pending Forms,
 * Unpaid Deposits, and Quick Booking Actions. Powered by live APIs.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, UserCheck, AlertCircle, Plus, ShoppingCart, UserPlus } from 'lucide-react';
import { KPICard, ClinicalButton, ClinicalBadge, ClinicalTable } from '@/components/ui/UIComponents';
import { api } from '@/lib/api';

export default function ReceptionDashboard({ onNavigateTab }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const apptRes = await api.getCalendarSchedule();
        if (apptRes && apptRes.appointments) setAppointments(apptRes.appointments);

        const patRes = await api.listPatients();
        if (patRes && patRes.patients) setPatients(patRes.patients);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const waitingCount = appointments.filter(a => a.status === 'confirmed').length;
  const unpaidCount = patients.filter(p => (p.current_balance || 0) > 0).length;

  return (
    <div className="space-y-5 text-slate-900">
      
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Appointments"
          value={appointments.length}
          subtitle="Scheduled across treatment rooms"
          icon={Calendar}
          color="emerald"
        />
        <KPICard
          title="Waiting Queue"
          value={waitingCount}
          subtitle="Patients in waiting lounge"
          icon={Clock}
          color="orange"
        />
        <KPICard
          title="Unpaid Balance Ledger"
          value={`${unpaidCount} Patients`}
          subtitle="Pending due collection"
          icon={AlertCircle}
          color="amber"
        />
        <KPICard
          title="Quick Front Desk POS"
          value="Cashier Terminal"
          subtitle="Token allocation P-01"
          icon={ShoppingCart}
          color="slate"
        />
      </div>

      {/* Quick Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Reception Quick Shortcuts:</span>
        <div className="flex items-center space-x-2">
          <ClinicalButton variant="emerald" size="sm" onClick={() => onNavigateTab && onNavigateTab('pos')}>
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS Cashier</span>
          </ClinicalButton>
          <ClinicalButton variant="slate" size="sm" onClick={() => onNavigateTab && onNavigateTab('appointments')}>
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </ClinicalButton>
          <ClinicalButton variant="outline" size="sm" onClick={() => onNavigateTab && onNavigateTab('prm')}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Walk-In Patient</span>
          </ClinicalButton>
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Today's Reception Schedule Roster
        </h3>

        <ClinicalTable
          headers={[
            { label: 'Time & Token' },
            { label: 'Patient Name & Contact' },
            { label: 'Treatment Procedure' },
            { label: 'Treating Doctor' },
            { label: 'Status' }
          ]}
        >
          {appointments.map((appt) => (
            <tr key={appt.id} className="hover:bg-slate-50 transition">
              <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                {appt.time || '10:00 AM'}
              </td>
              <td className="py-3 px-3.5">
                <div className="font-extrabold text-slate-900">{appt.customer_name}</div>
                <div className="text-xs text-slate-500 font-mono">{appt.customer_phone}</div>
              </td>
              <td className="py-3 px-3.5 font-bold text-slate-800">{appt.treatment_name}</td>
              <td className="py-3 px-3.5 font-bold text-emerald-800">{appt.doctor_name}</td>
              <td className="py-3 px-3.5">
                <ClinicalBadge variant={appt.status === 'confirmed' ? 'emerald' : 'slate'}>
                  {appt.status}
                </ClinicalBadge>
              </td>
            </tr>
          ))}
        </ClinicalTable>
      </div>

    </div>
  );
}
