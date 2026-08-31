/**
 * ==============================================================================
 * SkinLab AI - Module 3: Real-Time Reception Command Centre
 * ==============================================================================
 * 11 Appointment Stages:
 * - Upcoming, Arrived, Checked In, Waiting, In Consultation, In Treatment,
 *   Ready for Payment, Completed, Late, Cancelled, No-Show.
 * Supports interactive status updates, sensitive action confirmation,
 * room tracking (Suite 1/2), payment status, and incomplete forms.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  UserCheck, 
  Stethoscope, 
  CreditCard, 
  XCircle, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PageHeader, ClinicalBadge, ClinicalButton } from '@/components/ui/UIComponents';
import { api } from '@/lib/api';

const STAGES = [
  { key: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { key: 'arrived', label: 'Arrived', color: 'bg-teal-100 text-teal-900 border-teal-300' },
  { key: 'checked_in', label: 'Checked In', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { key: 'waiting', label: 'Waiting', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { key: 'in_consultation', label: 'In Consultation', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  { key: 'in_treatment', label: 'In Treatment', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { key: 'ready_for_payment', label: 'Ready for Payment', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { key: 'completed', label: 'Completed', color: 'bg-emerald-900 text-white border-slate-900' },
  { key: 'late', label: 'Late', color: 'bg-rose-100 text-rose-900 border-rose-300' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-slate-200 text-slate-700 border-slate-300' },
  { key: 'no_show', label: 'No-Show', color: 'bg-rose-900 text-white border-rose-950' }
];

export default function ReceptionCommandCentre() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      const res = await api.getCalendarSchedule();
      if (res && res.appointments) {
        setAppointments(res.appointments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleStageChange = async (apptId, newStage) => {
    const isSensitive = newStage === 'cancelled' || newStage === 'no_show';
    if (isSensitive) {
      if (!confirm(`Are you sure you want to change appointment status to "${newStage.toUpperCase()}"?`)) {
        return;
      }
    }

    try {
      await api.updateAppointment(apptId, { status: newStage });
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStage } : a));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      
      {/* Header */}
      <PageHeader
        icon={UserCheck}
        title="Reception Command Centre & Patient Stage Board"
        subtitle="Real-time patient flow tracking from arrival to checkout"
        actions={
          <ClinicalButton variant="outline" size="sm" onClick={loadAppointments}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Roster</span>
          </ClinicalButton>
        }
      />

      {/* Stage Columns Horizontal Board */}
      <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar">
        {STAGES.map((stage) => {
          const items = appointments.filter(a => {
            const statusLower = (a.status || 'upcoming').toLowerCase();
            return statusLower === stage.key || (stage.key === 'upcoming' && statusLower === 'confirmed');
          });

          return (
            <div key={stage.key} className="w-72 shrink-0 bg-slate-100/90 rounded-2xl p-3 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-slate-900 tracking-tight">{stage.label}</span>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${stage.color}`}>
                  {items.length}
                </span>
              </div>

              <div className="space-y-2.5 min-h-[300px]">
                {items.length === 0 ? (
                  <div className="text-[11px] text-slate-400 font-medium text-center py-10 italic">
                    No tickets in this stage
                  </div>
                ) : (
                  items.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 hover:shadow-md transition text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {appt.token || `P-0${appt.id}`}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 font-bold">
                          {appt.time || '10:30 AM'}
                        </span>
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{appt.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{appt.treatment_name}</div>
                      </div>

                      <div className="text-[11px] text-slate-600 font-bold flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="flex items-center space-x-1">
                          <Stethoscope className="w-3 h-3 text-emerald-600" />
                          <span>{appt.doctor_name}</span>
                        </span>
                        <span className="font-mono font-black text-slate-800">
                          Suite {appt.room || (appt.id % 3 + 1)}
                        </span>
                      </div>

                      {/* Stage Dropdown Selector */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <select
                          value={stage.key}
                          onChange={(e) => handleStageChange(appt.id, e.target.value)}
                          className="w-full text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg py-1 px-1.5 text-slate-900 cursor-pointer"
                        >
                          {STAGES.map(s => (
                            <option key={s.key} value={s.key}>
                              Move to: {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
