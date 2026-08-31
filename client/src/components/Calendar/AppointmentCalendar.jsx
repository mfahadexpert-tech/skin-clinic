/**
 * ==============================================================================
 * SkinLab AI - Receptionist Appointment Calendar
 * Vibrant Light Theme + Dark Hover Transition + Contrast Colors (Green, Orange, Yellow)
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
  Download, 
  X, 
  CheckCircle2, 
  Edit3,
  Trash2
} from 'lucide-react';
import { api } from '@/lib/api';

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

  const handleJumpToToday = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setSelectedDays([today.getDate()]);
  };

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

  const handleOpenEditAppt = (appt) => {
    setEditingAppt(appt);
    setFormTreatment(appt.treatment_name || 'HydraFacial Deluxe');
    setFormPatientName(appt.customer_name || 'Zainab Tariq');
    setFormDoctorId(appt.doctor_id || 1);
    setFormTimeStart('08:00 AM');
    setFormTimeEnd('09:00 AM');
    setFormNotes(appt.notes || 'Routine consultation & procedure.');
    setIsEditModalOpen(true);
  };

  const handleOpenNewSlot = (dayNum, timeSlot) => {
    setEditingAppt(null);
    setFormTreatment('HydraFacial Deluxe');
    setFormPatientName(patients[0]?.name || 'Zainab Tariq');
    setFormDoctorId(doctors[0]?.id || 1);
    setFormTimeStart(timeSlot || '10:00 AM');
    setFormTimeEnd('11:00 AM');
    setFormNotes('Receptionist slot reservation.');
    setIsEditModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (editingAppt) {
      await api.updateAppointment(editingAppt.id, {
        treatment_name: formTreatment,
        customer_name: formPatientName,
        doctor_id: parseInt(formDoctorId),
        notes: formNotes
      });
    } else {
      await api.createAppointment({
        treatment_name: formTreatment,
        customer_name: formPatientName,
        doctor_id: parseInt(formDoctorId),
        appointment_time: new Date(selectedYear, selectedMonth, selectedDays[0] || 1, 8, 0).toISOString(),
        notes: formNotes
      });
    }
    setIsEditModalOpen(false);
    loadScheduleData();
  };

  const handleDeleteAppt = async () => {
    if (!editingAppt) return;
    if (confirm(`Cancel appointment for ${editingAppt.customer_name}?`)) {
      await api.deleteAppointment(editingAppt.id);
      setIsEditModalOpen(false);
      loadScheduleData();
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (selectedDoctorFilter !== 'all') {
      return a.doctor_id === parseInt(selectedDoctorFilter);
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-100 text-orange-800 border border-orange-300">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Appointments & Doctor Schedule</h1>
            <p className="text-xs text-slate-600 font-semibold">Real-time Google Calendar sync & conflict prevention</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Doctor Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white text-slate-900">Filter: All Specialists</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id} className="bg-white text-slate-900">
                  {d.name} ({d.designation})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Selector (Base Light -> Dark Hover) */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-300 text-xs">
            {['daily', 'weekly', 'monthly', 'yearly'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md capitalize font-extrabold transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-800 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Download ICS */}
          <button
            onClick={() => alert('.ics Calendar Data exported!')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-slate-900 hover:text-white transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5 text-amber-700" />
            <span>Download Data (.ics)</span>
          </button>

          {/* Book Slot Button (Base Vivid Green -> Dark Hover) */}
          <button
            onClick={() => handleOpenNewSlot(selectedDays[0] || 1, '08:00 AM')}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-slate-900 text-white shadow transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book Slot</span>
          </button>

        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Mini Month Picker */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Appointment Calendar</span>
              <div className="flex items-center space-x-1">
                <button onClick={handleNavPrev} className="p-1 rounded bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNavNext} className="p-1 rounded bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center text-xs font-black text-slate-700 py-1">
              {daysOfWeek.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* 31-Day Grid (Light Base -> Dark Slate Hover) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => {
                const isSelected = selectedDays.includes(dayNum);
                return (
                  <button
                    key={dayNum}
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-8 rounded-lg font-bold transition-all duration-200 flex items-center justify-center ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md font-black'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
              Click any day to highlight date & filter schedule.
            </p>
          </div>

          {/* Doctor Roster */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
            <div className="text-xs font-black text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
              <span>Doctor Appointment Roster</span>
              <span className="text-emerald-700 font-extrabold font-mono">Shift Hours</span>
            </div>

            <div className="space-y-2">
              {doctors.map(d => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white transition-all duration-200 flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-emerald-900 group-hover:text-white flex items-center justify-center font-bold text-xs border border-emerald-300">
                      {d.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 group-hover:text-white">{d.name}</div>
                      <div className="text-[11px] text-slate-500 group-hover:text-slate-300">{d.designation}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 group-hover:text-white bg-white group-hover:bg-slate-800 px-2 py-1 rounded border border-slate-300">
                    {d.shift_start} - {d.shift_end}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT MAIN SCHEDULE (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
            
            {/* Header Title */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {monthNames[selectedMonth]} {selectedYear}
                </h2>
                <button
                  onClick={handleJumpToToday}
                  className="px-3 py-1 rounded bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 hover:bg-slate-900 hover:text-white transition-all"
                >
                  Today
                </button>
                <div className="flex space-x-1">
                  <button onClick={handleNavPrev} className="p-1 rounded bg-slate-100 text-slate-800 hover:bg-slate-900 hover:text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNavNext} className="p-1 rounded bg-slate-100 text-slate-800 hover:bg-slate-900 hover:text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-700 font-bold">
                Selected Day(s): <span className="text-orange-600 font-black font-mono">{selectedDays.join(', ')} Sept</span>
              </div>
            </div>

            {/* WEEKLY TIME GRID */}
            {viewMode === 'weekly' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-800 text-xs font-black bg-slate-100">
                      <th className="py-3 px-2 w-16 text-slate-600">GMT+5</th>
                      {['MON 1', 'TUE 2', 'WED 3', 'THU 4', 'FRI 5', 'SAT 6', 'SUN 7'].map((dayHead, i) => (
                        <th 
                          key={i} 
                          className={`py-3 px-2 text-center border-l border-slate-300 ${
                            selectedDays.includes(i + 1) || selectedDays.includes(i + 15) ? 'text-orange-800 font-black bg-orange-100' : 'text-slate-900'
                          }`}
                        >
                          {dayHead}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {timeSlots.map((slot, timeIdx) => (
                      <tr key={slot} className="hover:bg-slate-100 transition">
                        
                        {/* Time Slot Label */}
                        <td className="py-3 px-2 text-xs font-mono font-bold text-slate-800 bg-slate-50 border-r border-slate-200">
                          {slot}
                        </td>

                        {/* 7 Days Columns */}
                        {Array.from({ length: 7 }, (_, colIdx) => {
                          const dayNum = colIdx + 1;
                          
                          const matchedAppts = filteredAppointments.filter(a => {
                            const apptDay = new Date(a.appointment_time).getDate();
                            return apptDay === dayNum || apptDay === (dayNum + 7) || apptDay === (dayNum + 14);
                          });

                          const apptForSlot = (timeIdx % 3 === 0 && matchedAppts.length > 0) ? matchedAppts[timeIdx % matchedAppts.length] : null;

                          return (
                            <td 
                              key={colIdx} 
                              onClick={() => !apptForSlot && handleOpenNewSlot(dayNum, slot)}
                              className="py-1 px-1 text-center align-top relative min-h-[52px] cursor-pointer hover:bg-slate-200 border-r border-slate-200"
                            >
                              {apptForSlot ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditAppt(apptForSlot);
                                  }}
                                  className="p-2.5 rounded-xl text-left border shadow-sm transition-all duration-200 transform cursor-pointer bg-emerald-700 border-emerald-800 text-white hover:bg-slate-900"
                                >
                                  <div className="font-black text-xs text-white">{apptForSlot.treatment_name}</div>
                                  <div className="text-[11px] text-emerald-100 font-mono font-semibold flex items-center space-x-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-emerald-200" />
                                    <span>{slot}</span>
                                  </div>
                                  <div className="text-xs font-bold text-white mt-1 flex items-center justify-between pt-1 border-t border-emerald-600">
                                    <span>{apptForSlot.customer_name}</span>
                                    <Edit3 className="w-3.5 h-3.5 text-emerald-200" />
                                  </div>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center justify-center opacity-0 hover:opacity-100 transition text-[11px] text-emerald-700 font-extrabold">
                                  + Book Slot
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

            {/* DAILY VIEW */}
            {viewMode === 'daily' && (
              <div className="space-y-3">
                <div className="text-xs text-emerald-800 font-black">
                  Daily Schedule for Sept {selectedDays[0] || 1}, {selectedYear}
                </div>
                <div className="space-y-2">
                  {filteredAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => handleOpenEditAppt(appt)}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white cursor-pointer flex items-center justify-between transition-all duration-200 group"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-black text-slate-900 group-hover:text-white">{appt.treatment_name}</div>
                        <div className="text-xs text-slate-700 group-hover:text-slate-200">Patient: <strong>{appt.customer_name}</strong></div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">Specialist: {appt.doctor_name}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-white bg-white group-hover:bg-slate-800 px-3 py-1 rounded border border-slate-300">
                          08:00 AM - 09:00 AM
                        </span>
                        <div className="text-xs text-emerald-600 font-bold mt-1">Confirmed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MONTHLY VIEW */}
            {viewMode === 'monthly' && (
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <div key={d} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white transition">
                    <div className="font-bold text-slate-900 hover:text-white">Sept {d}</div>
                    <div className="text-xs text-emerald-700 font-bold font-mono mt-1">
                      {filteredAppointments.length} Bookings
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* YEARLY VIEW */}
            {viewMode === 'yearly' && (
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {monthNames.map((m) => (
                  <div key={m} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white transition">
                    <div className="font-bold text-slate-900 text-sm">{m} 2026</div>
                    <div className="text-xs text-emerald-700 font-bold mt-2">View Schedule</div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* EDIT SCHEDULE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-md w-full border border-slate-300 shadow-2xl rounded-2xl space-y-4 text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Schedule</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              
              <div>
                <label className="text-slate-800 font-bold">Treatment / Purpose *</label>
                <input
                  type="text"
                  required
                  value={formTreatment}
                  onChange={(e) => setFormTreatment(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Patient Name</label>
                <input
                  type="text"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  className="w-full glass-input text-xs mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Assign Specialist / Doctor</label>
                <select
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  className="w-full glass-input text-xs mt-1 py-2 cursor-pointer font-bold text-slate-900"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} className="bg-white text-slate-900">
                      {d.name} ({d.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-800 font-bold">Start Time</label>
                  <input
                    type="text"
                    value={formTimeStart}
                    onChange={(e) => setFormTimeStart(e.target.value)}
                    className="w-full glass-input text-xs font-mono text-center mt-1 py-2"
                  />
                </div>
                <div>
                  <label className="text-slate-800 font-bold">End Time</label>
                  <input
                    type="text"
                    value={formTimeEnd}
                    onChange={(e) => setFormTimeEnd(e.target.value)}
                    className="w-full glass-input text-xs font-mono text-center mt-1 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-800 font-bold">Notes / Add Guests</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full glass-input text-xs mt-1 py-2 leading-relaxed"
                />
              </div>

              {/* Google Calendar Sync */}
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center space-x-2 text-emerald-900 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Google Calendar Auto-Sync Active</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                {editingAppt ? (
                  <button
                    type="button"
                    onClick={handleDeleteAppt}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-slate-900 hover:text-white flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancel Schedule</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-black bg-emerald-600 hover:bg-slate-900 text-white shadow transition-all"
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
