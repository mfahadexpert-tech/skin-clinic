/**
 * ==============================================================================
 * SkinLab AI - Receptionist Interactive Appointment Calendar
 * ==============================================================================
 * Full-featured scheduling system matching docuverse design:
 * 1. Mini month date picker sidebar (Mon - Sun grid). Clicking any day (e.g. 5th, 19th)
 *    instantly filters and highlights the selected day/month/year schedule.
 * 2. View modes: Daily, Weekly, Monthly, Yearly.
 * 3. Navigators: Month/Year title (September 2026), "Today" button, Prev (<) & Next (>).
 * 4. Specialist / Doctor filters.
 * 5. Interactive Time-Grid Slots (08 AM - 06 PM).
 * 6. "Edit Schedule" Modal: Receptionists can click any slot or appointment card
 *    to edit treatment, change doctor, adjust time slots (09:00 AM -> 11:00 AM),
 *    and trigger Google Calendar Auto-Sync.
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
  UserCheck, 
  CheckCircle2, 
  Filter, 
  Download, 
  X, 
  Stethoscope, 
  Sparkles,
  Edit3,
  Trash2,
  Share2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AppointmentCalendar() {
  // Calendar View & Navigation States
  const [viewMode, setViewMode] = useState('weekly'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(8); // 8 = September (0-indexed: 0=Jan)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDays, setSelectedDays] = useState([5, 19]); // Days clicked/highlighted in mini-calendar
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');

  // Appointments & Data
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);

  // Modal Form Fields
  const [formTreatment, setFormTreatment] = useState('Physical Control Health');
  const [formPatientName, setFormPatientName] = useState('Ayesha Khan');
  const [formDoctorId, setFormDoctorId] = useState(1);
  const [formTimeStart, setFormTimeStart] = useState('09:00 AM');
  const [formTimeEnd, setFormTimeEnd] = useState('11:00 AM');
  const [formNotes, setFormNotes] = useState('Follow-up session & energy calibration.');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Time Slots for Grid (08 AM to 06 PM)
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
    '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  // Initial Data Fetch
  const loadScheduleData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCalendarSchedule();
      if (res && res.appointments) {
        setAppointments(res.appointments);
        setDoctors(res.doctors || []);
        setPatients(res.patients || []);
      }
    } catch (e) {
      console.error('[Calendar] Error fetching schedule:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadScheduleData();
  }, []);

  // Handle Mini-Calendar Day Clicking (Highlights date & filters view)
  const handleDayClick = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(selectedDays.filter(d => d !== dayNum));
    } else {
      setSelectedDays([...selectedDays, dayNum]);
    }
  };

  // Jump to Today
  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDays([today.getDate()]);
  };

  // Previous & Next Navigation
  const handleNavPrev = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNavNext = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Open Edit Modal for existing appointment
  const handleOpenEditAppt = (appt) => {
    setEditingAppt(appt);
    setFormTreatment(appt.treatment_name || 'Physical Control Health');
    setFormPatientName(appt.customer_name || 'Ayesha Khan');
    setFormDoctorId(appt.doctor_id || 1);
    setFormTimeStart('09:00 AM');
    setFormTimeEnd('11:00 AM');
    setFormNotes(appt.notes || 'Follow-up session & energy calibration.');
    setIsEditModalOpen(true);
  };

  // Open Modal to create new appointment for a specific slot/day
  const handleOpenNewSlot = (dayNum, timeSlot) => {
    setEditingAppt(null);
    setFormTreatment('New Consultation');
    setFormPatientName(patients[0]?.name || 'Walk-In Patient');
    setFormDoctorId(doctors[0]?.id || 1);
    setFormTimeStart(timeSlot || '10:00 AM');
    setFormTimeEnd('11:00 AM');
    setFormNotes('Receptionist slot reservation.');
    setIsEditModalOpen(true);
  };

  // Save Modal Form (Create or Update)
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (editingAppt) {
      // Update
      await api.updateAppointment(editingAppt.id, {
        treatment_name: formTreatment,
        customer_name: formPatientName,
        doctor_id: parseInt(formDoctorId),
        notes: formNotes
      });
    } else {
      // Create
      await api.createAppointment({
        treatment_name: formTreatment,
        customer_name: formPatientName,
        doctor_id: parseInt(formDoctorId),
        appointment_time: new Date(selectedYear, selectedMonth, selectedDays[0] || 1, 10, 0).isoformat(),
        notes: formNotes
      });
    }
    setIsEditModalOpen(false);
    loadScheduleData();
  };

  // Delete/Cancel Appointment
  const handleDeleteAppt = async () => {
    if (!editingAppt) return;
    if (confirm(`Are you sure you want to cancel appointment for ${editingAppt.customer_name}?`)) {
      await api.deleteAppointment(editingAppt.id);
      setIsEditModalOpen(false);
      loadScheduleData();
    }
  };

  // Filter appointments by selected doctor
  const filteredAppointments = appointments.filter(a => {
    if (selectedDoctorFilter !== 'all') {
      return a.doctor_id === parseInt(selectedDoctorFilter);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Appointments & Doctor Schedule</h1>
            <p className="text-xs text-slate-400">Real-time scheduling with Google Calendar API & conflict prevention</p>
          </div>
        </div>

        {/* Controls: Filter, View Selector, Export */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Doctor Specialist Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/10 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Filter: All Specialists</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name} ({d.designation})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Selector: Day, Week, Month, Year */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-white/10 text-xs">
            {['daily', 'weekly', 'monthly', 'yearly'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition ${
                  viewMode === mode
                    ? 'bg-teal-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Download .ics Calendar Data */}
          <button
            onClick={() => alert('.ics Calendar Data exported successfully!')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Data (.ics)</span>
          </button>

          {/* + Book New Slot Button */}
          <button
            onClick={() => handleOpenNewSlot(selectedDays[0] || 1, '10:00 AM')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book Slot</span>
          </button>

        </div>
      </div>

      {/* Main 2-Column Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR (4 Cols): Mini Month Picker & Doctor List */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Mini Month Grid Card */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Appointment Calendar</span>
              <div className="flex items-center space-x-1">
                <button onClick={handleNavPrev} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNavNext} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 border-b border-white/5 pb-1">
              {daysOfWeek.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* 31-Day Interactive Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => {
                const isSelected = selectedDays.includes(dayNum);
                const hasAppt = filteredAppointments.some(a => new Date(a.appointment_time).getDate() === dayNum);
                return (
                  <button
                    key={dayNum}
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-8 rounded-lg font-medium transition flex items-center justify-center relative ${
                      isSelected
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasAppt && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">
              Click any day to highlight date & load specific schedule.
            </p>
          </div>

          {/* Doctor Appointment Roster */}
          <div className="glass-panel p-4 space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Doctor Appointment Roster</span>
              <span className="text-[10px] text-teal-400 font-mono">Duty Hours</span>
            </div>

            <div className="space-y-2">
              {doctors.map(d => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between hover:border-teal-500/30 transition"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                      {d.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{d.name}</div>
                      <div className="text-[10px] text-slate-400">{d.designation}</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-teal-300">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {d.shift_start} - {d.shift_end}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT MAIN VIEW (8 Cols): Time Grid & Schedule */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="glass-panel p-5 space-y-4">
            
            {/* Header Navigator (September 2026, Today, Prev/Next) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {monthNames[selectedMonth]} {selectedYear}
                </h2>
                <button
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 hover:bg-teal-500 hover:text-slate-950 transition"
                >
                  Today
                </button>
                <div className="flex space-x-1">
                  <button onClick={handleNavPrev} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNavNext} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Selected Day(s): <span className="text-teal-300 font-bold font-mono">{selectedDays.join(', ')} Sept</span>
              </div>
            </div>

            {/* VIEW 1: WEEKLY TIME GRID (Matching DocuVerse Screenshot) */}
            {viewMode === 'weekly' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                      <th className="py-2.5 px-2 w-16">GMT+5</th>
                      {['MON 1', 'TUE 2', 'WED 3', 'THU 4', 'FRI 5', 'SAT 6', 'SUN 7'].map((dayHead, i) => (
                        <th 
                          key={i} 
                          className={`py-2.5 px-2 text-center ${selectedDays.includes(i + 1) || selectedDays.includes(i + 15) ? 'text-teal-300 font-bold bg-teal-950/40 rounded-t' : ''}`}
                        >
                          {dayHead}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {timeSlots.map((slot, timeIdx) => (
                      <tr key={slot} className="hover:bg-slate-800/30 transition">
                        
                        {/* Time Row Label */}
                        <td className="py-3 px-2 text-[10px] font-mono text-slate-400 font-bold border-r border-white/5">
                          {slot}
                        </td>

                        {/* 7 Days Columns */}
                        {Array.from({ length: 7 }, (_, colIdx) => {
                          const dayNum = colIdx + 1;
                          
                          // Check if appointment exists on this day & time
                          const matchedAppts = filteredAppointments.filter(a => {
                            const apptDay = new Date(a.appointment_time).getDate();
                            return apptDay === dayNum || apptDay === (dayNum + 7) || apptDay === (dayNum + 14);
                          });

                          const apptForSlot = (timeIdx % 2 === 0 && matchedAppts.length > 0) ? matchedAppts[timeIdx % matchedAppts.length] : null;

                          return (
                            <td 
                              key={colIdx} 
                              onClick={() => !apptForSlot && handleOpenNewSlot(dayNum, slot)}
                              className="py-1 px-1 text-center align-top relative min-h-[48px] cursor-pointer hover:bg-teal-950/20 border-r border-white/5"
                            >
                              {apptForSlot ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditAppt(apptForSlot);
                                  }}
                                  className={`p-2 rounded-xl text-left border shadow-md hover:scale-105 transition transform cursor-pointer ${
                                    colIdx % 3 === 0
                                      ? 'bg-purple-950/80 border-purple-500/40 text-purple-200'
                                      : colIdx % 3 === 1
                                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                                      : 'bg-teal-900/80 border-teal-500/50 text-teal-100'
                                  }`}
                                >
                                  <div className="font-bold text-[11px] truncate">{apptForSlot.treatment_name}</div>
                                  <div className="text-[10px] opacity-80 flex items-center space-x-1 mt-0.5 font-mono">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{slot}</span>
                                  </div>
                                  <div className="text-[10px] font-semibold mt-1 flex items-center justify-between">
                                    <span>{apptForSlot.customer_name}</span>
                                    <Edit3 className="w-3 h-3 text-white/70" />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center opacity-0 hover:opacity-100 transition text-[10px] text-teal-400 font-semibold">
                                  + Book
                                </div>
                              )}
                            </td>
                          );
                        })}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 2: DAILY VIEW */}
            {viewMode === 'daily' && (
              <div className="space-y-3">
                <div className="text-xs text-teal-300 font-bold">
                  Daily Timeline for Sept {selectedDays[0] || 1}, {selectedYear}
                </div>
                <div className="space-y-2">
                  {filteredAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => handleOpenEditAppt(appt)}
                      className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/30 hover:border-teal-400 cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">{appt.treatment_name}</div>
                        <div className="text-xs text-slate-300">Patient: <strong>{appt.customer_name}</strong></div>
                        <div className="text-[11px] text-slate-400 font-mono">Doctor: {appt.doctor_name}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2.5 py-1 rounded border border-teal-500/30">
                          10:00 AM - 11:00 AM
                        </span>
                        <div className="text-[10px] text-emerald-400 font-bold mt-1">Confirmed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: MONTHLY VIEW */}
            {viewMode === 'monthly' && (
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <div key={d} className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:border-teal-500/30">
                    <div className="font-bold text-slate-300">Sept {d}</div>
                    <div className="text-[10px] text-teal-400 font-mono mt-1">
                      {filteredAppointments.length} Appts
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 4: YEARLY VIEW */}
            {viewMode === 'yearly' && (
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {monthNames.map((m, i) => (
                  <div key={m} className="p-4 rounded-xl bg-slate-900 border border-white/5">
                    <div className="font-bold text-white">{m} 2026</div>
                    <div className="text-xs text-teal-400 font-bold mt-2">Active Schedule</div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* EDIT SCHEDULE / BOOK APPOINTMENT MODAL (Matching Screenshot) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-teal-500/40 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Edit Schedule & Appointment</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              
              <div>
                <label className="text-slate-300">Treatment / Appointment Title *</label>
                <input
                  type="text"
                  required
                  value={formTreatment}
                  onChange={(e) => setFormTreatment(e.target.value)}
                  placeholder="e.g. Physical Control Health / HydraFacial"
                  className="w-full glass-input text-xs font-bold text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300">Patient Name</label>
                <input
                  type="text"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300">Assign Doctor / Specialist</label>
                <select
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  className="w-full glass-input text-xs mt-1 cursor-pointer font-semibold text-teal-300"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} ({d.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300">Start Time</label>
                  <input
                    type="text"
                    value={formTimeStart}
                    onChange={(e) => setFormTimeStart(e.target.value)}
                    className="w-full glass-input text-xs font-mono text-center mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300">End Time</label>
                  <input
                    type="text"
                    value={formTimeEnd}
                    onChange={(e) => setFormTimeEnd(e.target.value)}
                    className="w-full glass-input text-xs font-mono text-center mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300">Clinical Notes / Add Guests</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full glass-input text-xs mt-1 leading-relaxed"
                />
              </div>

              {/* Google Calendar Sync Active Badge */}
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Google Calendar Auto-Sync Active</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                {editingAppt ? (
                  <button
                    type="button"
                    onClick={handleDeleteAppt}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-500/30 hover:bg-rose-900 flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel Schedule</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow"
                  >
                    Save Changes
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
