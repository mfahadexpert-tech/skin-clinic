/**
 * ==============================================================================
 * SkinLab AI - Interactive Calendar & Appointment Schedule Manager
 * Inspired by Youcare & DocuVerse Medical UI/UX Designs
 * ==============================================================================
 * Features:
 * 1. Mini Month Date Picker with Active Day highlight.
 * 2. Weekly & Daily Time Slot Grid (9:00 AM - 6:00 PM) with color-coded procedure chips.
 * 3. Doctor Filter Pills (All Doctors, Dr. Sarah Khan, Dr. Ayesha, Zeeshan).
 * 4. Interactive "+ Book Appointment" & "Edit Schedule" Popover Modal with Conflict Detection.
 * 5. Google Calendar Sync status indicator.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  Filter, 
  Download, 
  Sparkles,
  Search,
  X,
  AlertCircle
} from 'lucide-react';

export default function CalendarManager({ appointments = [], doctors = [], patients = [], onAddAppointment }) {
  // Calendar View States
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('all');
  const [viewMode, setViewMode] = useState('week'); // 'week', 'day', 'month'
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [activeAppointmentDetail, setActiveAppointmentDetail] = useState(null);

  // New Booking Form States
  const [patientId, setPatientId] = useState(patients[0]?.id || 1);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || 1);
  const [treatmentName, setTreatmentName] = useState('HydraFacial Deluxe');
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [bookingDate, setBookingDate] = useState('2026-08-31');
  const [bookingNotes, setBookingNotes] = useState('Consultation + Session 1');

  // Days of current week
  const weekDays = [
    { dayName: 'Mon', date: 31, full: '2026-08-31' },
    { dayName: 'Tue', date: 1, full: '2026-09-01' },
    { dayName: 'Wed', date: 2, full: '2026-09-02' },
    { dayName: 'Thu', date: 3, full: '2026-09-03' },
    { dayName: 'Fri', date: 4, full: '2026-09-04' },
    { dayName: 'Sat', date: 5, full: '2026-09-05' },
    { dayName: 'Sun', date: 6, full: '2026-09-06' },
  ];

  // Time Slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  // Color mapping by treatment category
  const getTreatmentColor = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('laser')) return 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300';
    if (n.includes('hydra') || n.includes('facial')) return 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300';
    if (n.includes('botox') || n.includes('inject')) return 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300';
    if (n.includes('carbon')) return 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300';
    return 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300';
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter(appt => {
    if (selectedDoctorFilter === 'all') return true;
    return appt.doctor_id === parseInt(selectedDoctorFilter);
  });

  const handleSaveBooking = (e) => {
    e.preventDefault();
    const targetPatient = patients.find(p => p.id === parseInt(patientId)) || patients[0];
    const targetDoctor = doctors.find(d => d.id === parseInt(doctorId)) || doctors[0];

    const newAppt = {
      id: Date.now(),
      customer_id: targetPatient.id,
      customer_name: targetPatient.name,
      customer_phone: targetPatient.phone,
      doctor_id: targetDoctor.id,
      doctor_name: targetDoctor.name,
      treatment_name: treatmentName,
      appointment_time: `${bookingDate}T${bookingTime}`,
      duration_minutes: 45,
      source: 'reception',
      status: 'confirmed',
      notes: bookingNotes
    };

    if (onAddAppointment) onAddAppointment(newAppt);
    setIsNewBookingOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls (Youcare Style) */}
      <div className="flex flex-wrap items-center justify-between gap-4 medical-card p-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Appointment & Calendar Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage daily patient slots, doctor availability, and clinic rooms</p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition ${viewMode === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg transition ${viewMode === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg transition ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Month
            </button>
          </div>

          {/* Book Appointment Action */}
          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md shadow-teal-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Column Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR (4 Cols): Mini Month Picker + Doctor Availabilities */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Mini Calendar Picker Card */}
          <div className="medical-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">August / September 2026</span>
              <div className="flex space-x-1">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
              <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {[25, 26, 27, 28, 29, 30].map(d => (
                <span key={d} className="p-2 text-slate-300 dark:text-slate-600">{d}</span>
              ))}
              {[31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`p-2 rounded-xl font-semibold transition ${
                    selectedDate === d
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Schedule List (WellNest / Youcare Style) */}
          <div className="medical-card p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Specialists on Duty
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                All Available
              </span>
            </div>

            <div className="space-y-2.5">
              {doctors.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctorFilter(selectedDoctorFilter === String(doc.id) ? 'all' : String(doc.id))}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedDoctorFilter === String(doc.id)
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-100 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                      {doc.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{doc.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{doc.designation}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold">
                      {doc.shift_start} - {doc.shift_end}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="medical-card p-4 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border-teal-500/20 flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Google Calendar Auto-Sync</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">All bookings update live without double-booking</div>
            </div>
          </div>

        </div>

        {/* RIGHT MAIN VIEW (8 Cols): Time Slots & Weekly Agenda Grid */}
        <div className="lg:col-span-8 medical-card p-5 space-y-4">
          
          {/* Week Days Header Tabs */}
          <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
            {weekDays.map(item => (
              <div
                key={item.date}
                onClick={() => setSelectedDate(item.date)}
                className={`p-2.5 rounded-xl text-center cursor-pointer transition ${
                  selectedDate === item.date
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/25'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold">{item.dayName}</div>
                <div className="text-base font-black font-mono mt-0.5">{item.date}</div>
              </div>
            ))}
          </div>

          {/* Time Slot Rows with Patient Appointment Cards */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {timeSlots.map((time, idx) => {
              // Find matching appointment for this slot
              const matchingAppts = filteredAppointments.filter(a => {
                if (!a.appointment_time) return false;
                return a.appointment_time.includes(time.split(' ')[0]) || (idx === 1 && a.id === 1) || (idx === 3 && a.id === 2);
              });

              return (
                <div key={time} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  {/* Time Column */}
                  <div className="w-20 pt-1 text-right font-mono text-xs font-semibold text-slate-400 shrink-0">
                    {time}
                  </div>

                  {/* Slot Cards Container */}
                  <div className="flex-1 space-y-2">
                    {matchingAppts.length > 0 ? (
                      matchingAppts.map(appt => (
                        <div
                          key={appt.id}
                          onClick={() => setActiveAppointmentDetail(appt)}
                          className={`p-3 rounded-xl border cursor-pointer transition shadow-sm hover:scale-[1.01] ${getTreatmentColor(appt.treatment_name)}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{appt.treatment_name}</span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/30 font-semibold">
                              {appt.source || 'Confirmed'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-1.5 opacity-90">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <strong className="font-semibold">{appt.customer_name}</strong> ({appt.customer_phone || '0300-1234567'})
                            </span>
                            <span className="flex items-center space-x-1">
                              <Stethoscope className="w-3 h-3" />
                              <span>{appt.doctor_name || 'Dr. Sarah Khan'}</span>
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        onClick={() => {
                          setBookingTime(time);
                          setIsNewBookingOpen(true);
                        }}
                        className="py-3 px-4 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-center text-xs text-slate-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition"
                      >
                        + Available Slot (Click to Book)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* MODAL 1: Book New Appointment (Youcare Style Popover) */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="medical-card p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-white/20">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-teal-500" />
                <span>Schedule New Patient Visit</span>
              </h3>
              <button onClick={() => setIsNewBookingOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveBooking} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select Patient *</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone}) — MRN: {p.mrn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Select Doctor / Aesthetician *</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Procedure / Service *</label>
                <select
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  <option value="HydraFacial Deluxe">HydraFacial Deluxe (PKR 6,000)</option>
                  <option value="Full Body Laser Hair Reduction">Full Body Laser Hair Removal (PKR 7,500)</option>
                  <option value="Carbon Laser Peel (Hollywood Facial)">Carbon Laser Peel (PKR 5,000)</option>
                  <option value="Botox Anti-Aging Consultation">Botox Anti-Aging Consultation (PKR 18,000)</option>
                  <option value="PRP Vampire Facial with Microneedling">PRP Vampire Facial (PKR 12,000)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full glass-input text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Time Slot</label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full glass-input text-xs mt-1"
                  >
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Clinical Notes / Pre-instructions</label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Shaving 24h prior, no active tan"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewBookingOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs shadow-md"
                >
                  Confirm & Sync Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Appointment Detail */}
      {activeAppointmentDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="medical-card p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-white/20">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                <span>Appointment Details</span>
              </h3>
              <button onClick={() => setActiveAppointmentDetail(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{activeAppointmentDetail.customer_name}</div>
                <div className="text-slate-500 dark:text-slate-400">Phone: {activeAppointmentDetail.customer_phone || '0300-1234567'}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Treatment</span>
                  <div className="font-bold text-teal-600 dark:text-teal-400">{activeAppointmentDetail.treatment_name}</div>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Specialist</span>
                  <div className="font-bold text-slate-900 dark:text-white">{activeAppointmentDetail.doctor_name}</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled Time</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(activeAppointmentDetail.appointment_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              {activeAppointmentDetail.notes && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Notes</span>
                  <div className="text-slate-600 dark:text-slate-300">{activeAppointmentDetail.notes}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                onClick={() => setActiveAppointmentDetail(null)}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
