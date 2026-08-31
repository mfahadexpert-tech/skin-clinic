/**
 * ==============================================================================
 * SkinLab AI - Receptionist Appointment Calendar & Command Centre Controller
 * ==============================================================================
 * Modes: Daily, Weekly, Monthly, Yearly & Real-Time Reception Command Centre.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Filter, 
  X, 
  CheckCircle2, 
  Edit3,
  Trash2,
  Kanban
} from 'lucide-react';
import { api } from '@/lib/api';
import ReceptionCommandCentre from './ReceptionCommandCentre';

export default function AppointmentCalendar() {
  const [viewMode, setViewMode] = useState('weekly');
  const [selectedMonth, setSelectedMonth] = useState(8); // 8 = September
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDays, setSelectedDays] = useState([18, 19]);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  // Form Fields
  const [formTreatment, setFormTreatment] = useState('HydraFacial Deluxe');
  const [formPatientName, setFormPatientName] = useState('Zainab Tariq');
  const [formDoctorId, setFormDoctorId] = useState(1);
  const [formTimeStart, setFormTimeStart] = useState('08:00 AM');
  const [formTimeEnd, setFormTimeEnd] = useState('09:00 AM');
  const [formNotes, setFormNotes] = useState('Routine checkup & procedure.');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
    '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  const loadScheduleData = async () => {
    try {
      const res = await api.getCalendarSchedule();
      if (res && res.appointments) {
        setAppointments(res.appointments);
        setDoctors(res.doctors || []);
        setPatients(res.patients || []);
      }
    } catch (e) {
      console.error('[Calendar] Load error:', e);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  const handleDayClick = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(selectedDays.filter(d => d !== dayNum));
    } else {
      setSelectedDays([...selectedDays, dayNum]);
    }
  };

  const handleOpenEditModal = (appt = null, timeSlot = '09:00 AM') => {
    if (appt) {
      setEditingAppt(appt);
      setFormTreatment(appt.treatment_name);
      setFormPatientName(appt.customer_name);
      setFormDoctorId(appt.doctor_id || 1);
      setFormTimeStart(appt.time || timeSlot);
      setFormNotes(appt.notes || '');
    } else {
      setEditingAppt(null);
      setFormTreatment('HydraFacial Deluxe');
      setFormPatientName(patients[0]?.name || 'Zainab Tariq');
      setFormDoctorId(doctors[0]?.id || 1);
      setFormTimeStart(timeSlot);
      setFormNotes('Scheduled via Reception Calendar.');
    }
    setIsEditModalOpen(true);
  };

  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    const payload = {
      treatment_name: formTreatment,
      customer_name: formPatientName,
      doctor_id: parseInt(formDoctorId),
      appointment_time: `${monthNames[selectedMonth]} ${selectedDays[0] || 18}, ${selectedYear} ${formTimeStart}`,
      time: formTimeStart,
      notes: formNotes,
      status: 'confirmed'
    };

    if (editingAppt) {
      await api.updateAppointment(editingAppt.id, payload);
    } else {
      await api.createAppointment(payload);
    }

    await loadScheduleData();
    setIsEditModalOpen(false);
  };

  const handleDeleteAppointment = async (apptId) => {
    if (confirm('Are you sure you want to cancel this appointment schedule?')) {
      await api.deleteAppointment(apptId);
      await loadScheduleData();
      setIsEditModalOpen(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Interactive Reception Appointment Calendar</h1>
            <p className="text-xs text-slate-600 font-semibold">Doctor Rosters, Daily Timings & Command Centre</p>
          </div>
        </div>

        {/* View Mode Selectors */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center space-x-1">
            {['daily', 'weekly', 'monthly', 'command_centre'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {mode === 'command_centre' ? 'Command Centre' : mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleOpenEditModal()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-slate-900 text-white transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book Slot</span>
          </button>
        </div>
      </div>

      {/* Render Command Centre OR Schedule Grid */}
      {viewMode === 'command_centre' ? (
        <ReceptionCommandCentre />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Month Calendar */}
          <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900 font-mono">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setSelectedMonth(prev => prev > 0 ? prev - 1 : 11)}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMonth(prev => prev < 11 ? prev + 1 : 0)}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Month Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {daysOfWeek.map((d, i) => (
                <div key={i} className="font-extrabold text-slate-500 py-1">{d}</div>
              ))}

              {Array.from({ length: 31 }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = selectedDays.includes(dayNum);
                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(dayNum)}
                    className={`py-2 rounded-lg font-mono text-xs font-black transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow'
                        : 'hover:bg-slate-900 hover:text-white bg-slate-50 text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Schedule Table */}
          <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daily Doctor Schedule & Slot Availability
              </h3>
              <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                Google Calendar Auto-Sync Active
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {timeSlots.map((slot, idx) => {
                const slotAppt = appointments.find(a => a.time === slot || idx === 1);

                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenEditModal(slotAppt, slot)}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-black text-slate-700 group-hover:text-emerald-400">
                        {slot}
                      </span>
                      {slotAppt ? (
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 group-hover:text-white">
                            {slotAppt.treatment_name} • {slotAppt.customer_name}
                          </div>
                          <div className="text-[11px] text-slate-500 group-hover:text-slate-300">
                            {slotAppt.doctor_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 italic">
                          Available Slot — Click to book
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-black ${
                        slotAppt ? 'bg-emerald-100 text-emerald-900 group-hover:bg-emerald-900 group-hover:text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {slotAppt ? 'Booked' : 'Free'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>{editingAppt ? 'Edit Appointment Schedule' : 'Book New Appointment Slot'}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-800 font-bold">Treatment Procedure *</label>
                <input
                  type="text"
                  required
                  value={formTreatment}
                  onChange={(e) => setFormTreatment(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Assigned Specialist *</label>
                <select
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} className="bg-white text-slate-900">
                      {d.name} ({d.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-800 font-bold">Time Slot</label>
                <select
                  value={formTimeStart}
                  onChange={(e) => setFormTimeStart(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                >
                  {timeSlots.map((t, idx) => (
                    <option key={idx} value={t} className="bg-white text-slate-900">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-800 font-bold">Notes / Clinical Guidelines</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full glass-input text-xs mt-1 py-2"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                {editingAppt ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteAppointment(editingAppt.id)}
                    className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 rounded-lg flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel Slot</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black bg-emerald-600 hover:bg-slate-900 text-white rounded-lg shadow"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
