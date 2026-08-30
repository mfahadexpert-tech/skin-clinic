/**
 * ==============================================================================
 * SkinLab AI - Module 10: HRM & Clinic Staff / Practitioner Management
 * ==============================================================================
 * Manages:
 * - Practitioners, Aesthetic Doctors, Laser Technicians, Receptionists.
 * - Shift timings & departments.
 * - Procedure commission calculation & payroll summary.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Stethoscope, Clock, DollarSign, Award, Shield } from 'lucide-react';
import { api } from '@/lib/api';

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await api.getStaff();
        if (res && res.staff) {
          setStaff(res.staff);
          setDepartments(res.departments || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadStaff();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">HRM & Clinical Staff Directory</h1>
            <p className="text-xs text-slate-400">Practitioner Profiles, Shift Timings & Commission Tracking</p>
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Aesthetic Practitioners & Front-Desk Team
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-3">Practitioner Name</th>
                <th className="py-3 px-3">Role / Designation</th>
                <th className="py-3 px-3">Shift Timings</th>
                <th className="py-3 px-3 text-center">Commission %</th>
                <th className="py-3 px-3 text-right">Procedures Done</th>
                <th className="py-3 px-3 text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                      <span>{emp.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{emp.phone}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-300">{emp.designation}</td>
                  <td className="py-3 px-3 text-slate-300 font-mono flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{emp.shift_start} - {emp.shift_end}</span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-teal-300">
                    {emp.commission_rate}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    {emp.total_procedures_count || 0}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    PKR {(emp.commission_earned_pkr || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
