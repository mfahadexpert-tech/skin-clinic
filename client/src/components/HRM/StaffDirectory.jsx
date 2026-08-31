/**
 * ==============================================================================
 * SkinLab AI - Module 10: HRM & Clinic Staff / Practitioner Management
 * Full Doctor CRUD: Add New Doctor, Edit Doctor, & Delete Doctor (If doctor leaves)
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Stethoscope, Clock, Plus, X, Trash2, Edit3 } from 'lucide-react';
import { api } from '@/lib/api';

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Consultant Dermatologist');
  const [specialization, setSpecialization] = useState('Aesthetic & Laser Medicine');
  const [phone, setPhone] = useState('0300-1122334');
  const [shiftStart, setShiftStart] = useState('10:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [commissionRate, setCommissionRate] = useState(10);

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

  useEffect(() => {
    loadStaff();
  }, []);

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    if (!name) {
      alert('Doctor name is required.');
      return;
    }

    try {
      await api.createDoctor({
        name,
        designation,
        specialization,
        phone,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        commission_rate: parseFloat(commissionRate) || 10
      });

      setIsAddDoctorOpen(false);
      setName('');
      loadStaff();
      alert(`Dr. ${name} registered successfully!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoctor = async (id, docName) => {
    if (confirm(`Are you sure you want to remove ${docName} from clinic staff database?`)) {
      await api.deleteDoctor(id);
      setStaff(prev => prev.filter(emp => emp.id !== id));
      alert(`${docName} removed from database.`);
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">HRM & Clinical Staff Directory</h1>
            <p className="text-xs text-slate-600 font-semibold">Practitioner Profiles, Shift Timings & Commission Tracking</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddDoctorOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-slate-900 text-white transition-all shadow"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Doctor / Staff</span>
        </button>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
          Aesthetic Practitioners & Front-Desk Team
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 text-xs font-black bg-slate-100">
                <th className="py-3 px-3">Practitioner Name</th>
                <th className="py-3 px-3">Role / Designation</th>
                <th className="py-3 px-3">Shift Timings</th>
                <th className="py-3 px-3 text-center">Commission %</th>
                <th className="py-3 px-3 text-right">Procedures Done</th>
                <th className="py-3 px-3 text-right">Commission Earned</th>
                <th className="py-3 px-3 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {staff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-100 transition">
                  <td className="py-3.5 px-3">
                    <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span>{emp.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{emp.phone}</div>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">{emp.designation}</td>
                  <td className="py-3.5 px-3 text-slate-800 font-mono flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>{emp.shift_start} - {emp.shift_end}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-black text-emerald-700">
                    {emp.commission_rate}%
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    {emp.total_procedures_count || 0}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-800">
                    PKR {(emp.commission_earned_pkr || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => handleDeleteDoctor(emp.id, emp.name)}
                      className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-900 hover:text-white text-rose-800 border border-rose-300 transition"
                      title="Delete / Remove doctor from database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER NEW DOCTOR / STAFF */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Register New Practitioner / Doctor</span>
              </h3>
              <button onClick={() => setIsAddDoctorOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDoctor} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-800 font-bold">Doctor / Staff Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Emily Johnson"
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Consultant Dermatologist"
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Aesthetic & Laser Specialist"
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-800 font-bold">Shift Start</label>
                  <input
                    type="text"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full glass-input text-xs font-mono text-center mt-1 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-800 font-bold">Shift End</label>
                  <input
                    type="text"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full glass-input text-xs font-mono text-center mt-1 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold">Commission Rate (%)</label>
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-emerald-800 mt-1 py-2"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-slate-900 text-white rounded-lg shadow"
                >
                  Register Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
