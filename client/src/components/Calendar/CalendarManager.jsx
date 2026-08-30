/**
 * ==============================================================================
 * SkinLab AI - Appointment & Calendar Schedule Manager
 * Pixel-Perfect Implementation of Youcare Medical UI/UX Architecture
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
  Filter, 
  Download, 
  Search, 
  MoreHorizontal,
  Video,
  Share2,
  Check,
  RefreshCw,
  X
} from 'lucide-react';

export default function CalendarManager({ appointments = [], doctors = [], patients = [], onAddAppointment }) {
  // Calendar States
  const [selectedDayNumber, setSelectedDayNumber] = useState(5);
  const [selectedMonth, setSelectedMonth] = useState('Monthly');
  const [activePopoverAppt, setActivePopoverAppt] = useState(null);
  const [isCheckNewOpen, setIsCheckNewOpen] = useState(false);

  // New Booking / Edit Schedule State
  const [scheduleTitle, setScheduleTitle] = useState('Physical Control Health');
  const [scheduleTime, setScheduleTime] = useState('09:00 AM → 11:00 AM');
  const [guestCount, setGuestCount] = useState('1 Going, 1 Awaiting');

  // Days Header (Youcare Style)
  const columns = [
    { id: 'mon', label: 'MON 1' },
    { id: 'tue', label: 'TUE 2' },
    { id: 'wed', label: 'WED 3', isToday: true },
    { id: 'thu', label: 'THU 4' },
    { id: 'fri', label: 'FRI 5' },
    { id: 'sat', label: 'SAT 6' },
    { id: 'sun', label: 'SUN 7' },
  ];

  // Hourly rows
  const hours = ['09 AM', '10 AM', '11 AM', '12 AM'];

  // Youcare Appointment blocks data
  const scheduleEvents = [
    {
      id: 1,
      col: 'mon',
      timeSlot: '09 AM',
      title: 'Check Health',
      time: '09 AM - 10 AM',
      color: 'bg-purple-50 border border-purple-300 text-purple-700',
      patient: 'Sana Mir',
      doctor: 'Dr. Sarah Khan'
    },
    {
      id: 2,
      col: 'wed',
      timeSlot: '09 AM',
      title: 'Check-Up Kid',
      time: '08 AM - 09 AM',
      color: 'bg-amber-50 border border-amber-300 text-amber-800',
      patient: 'Ali Raza',
      doctor: 'Dr. Emily Johnson'
    },
    {
      id: 3,
      col: 'wed',
      timeSlot: '10 AM',
      title: 'Heart Check-Up',
      time: '08 AM - 10 AM',
      color: 'bg-emerald-50 border border-emerald-300 text-emerald-800',
      patient: 'Usman Tariq',
      doctor: 'Dr. Michael Lee'
    },
    {
      id: 4,
      col: 'thu',
      timeSlot: '09 AM',
      title: 'Physical Control Health',
      time: '09 AM → 11:00 AM',
      color: 'bg-blue-600 border border-blue-700 text-white shadow-lg',
      isPrimaryActive: true,
      patient: 'Ayesha Khan',
      doctor: 'Dr. Sarah Khan'
    },
    {
      id: 5,
      col: 'tue',
      timeSlot: '10 AM',
      title: 'Body Condition',
      time: '10 AM - 11 AM',
      color: 'bg-lime-50 border border-lime-300 text-lime-800',
      patient: 'Bilal Ahmed',
      doctor: 'Dr. Ayesha Tariq'
    },
    {
      id: 6,
      col: 'wed',
      timeSlot: '11 AM',
      title: 'Check Your Teeth',
      time: '10 AM - 11 AM',
      color: 'bg-rose-50 border border-rose-300 text-rose-800',
      patient: 'Fatima Ali',
      doctor: 'Dr. Sarah Khan'
    },
    {
      id: 7,
      col: 'sat',
      timeSlot: '09 AM',
      title: 'Check-Up',
      time: '09 AM - 10 AM',
      color: 'bg-sky-50 border border-sky-300 text-sky-800',
      patient: 'Zainab Bibi',
      doctor: 'Dr. Michael Lee'
    },
    {
      id: 8,
      col: 'wed',
      timeSlot: '12 AM',
      title: 'Check-Up Kid',
      time: '12 AM - 13 AM',
      color: 'bg-lime-50 border border-lime-300 text-lime-800',
      patient: 'Ahmed Khan',
      doctor: 'Dr. Emily Johnson'
    },
    {
      id: 9,
      col: 'fri',
      timeSlot: '12 AM',
      title: 'Check-Up',
      time: '12 AM - 13 AM',
      color: 'bg-purple-50 border border-purple-300 text-purple-800',
      patient: 'Hina Malik',
      doctor: 'Dr. Sarah Khan'
    }
  ];

  const handleSaveSchedule = () => {
    setActivePopoverAppt(null);
  };

  return (
    <div className="space-y-5">
      
      {/* 1. TOP TITLE & ACTION ROW (Youcare Style) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">Appointment</h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsCheckNewOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Check new</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLBAR (Filter, Monthly, Download Data, Search, Layout) */}
      <div className="flex flex-wrap items-center justify-between gap-3 docu-card p-3">
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="Monthly">Monthly</option>
            <option value="Weekly">Weekly</option>
            <option value="Daily">Daily</option>
          </select>

          <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" />
            <span>Download Data</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-600">
          <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <Search className="w-4 h-4" />
          </button>
          <span className="cursor-pointer hover:text-blue-600">Support</span>
          <span className="cursor-pointer hover:text-blue-600">Content Layout</span>
        </div>
      </div>

      {/* 3. DUAL-COLUMN APPOINTMENT CALENDAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (4 Cols): Mini Calendar + Doctor Appointment List */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Mini Month Grid */}
          <div className="docu-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Appointment Calendar</h3>
              <div className="flex space-x-1">
                <button className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            {/* Numbers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
              {[1, 2, 3, 4].map(d => (
                <span key={d} className="p-2 text-slate-700">{d}</span>
              ))}
              {/* Active Circle on 5 */}
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto shadow-md">
                5
              </span>
              {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(d => (
                <span key={d} className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">{d}</span>
              ))}
            </div>
          </div>

          {/* Doctor Appointment List */}
          <div className="docu-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Doctor Appointment List</h3>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {/* Doctor 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
                    EJ
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Dr. Emily Johnson</div>
                    <div className="text-[11px] text-blue-600 font-medium">Pediatrician</div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>10:00 - 11:00</span>
                </div>
              </div>

              {/* Doctor 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700 text-xs">
                    ML
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Dr. Michael Lee</div>
                    <div className="text-[11px] text-teal-600 font-medium">Dermatologist</div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>11:00 - 12:00</span>
                </div>
              </div>
            </div>

            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition">
              See All
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN (8 Cols): Interactive Time-Blocked Week Grid */}
        <div className="lg:col-span-8 docu-card p-5 space-y-4 relative">
          
          {/* Calendar Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <span className="font-extrabold text-base text-slate-900">Agustus 2026</span>
              <button className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">
                Today
              </button>
              <div className="flex space-x-1 text-slate-400">
                <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-slate-700" />
                <ChevronRight className="w-4 h-4 cursor-pointer hover:text-slate-700" />
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium">None</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium">Priority</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium">Deadline</span>
              <Video className="w-4 h-4 text-slate-400 cursor-pointer" />
              <Share2 className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
          </div>

          {/* Time-grid Table */}
          <div className="relative overflow-x-auto">
            
            {/* Days Row */}
            <div className="grid grid-cols-8 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
              <span className="text-[10px] text-slate-400">GMT+0</span>
              {columns.map(c => (
                <span key={c.id} className={c.isToday ? 'text-blue-600' : ''}>
                  {c.label}
                </span>
              ))}
            </div>

            {/* Time Blocks Grid */}
            <div className="space-y-4 pt-4 relative min-h-[460px]">
              
              {/* Current Time Indicator Blue Line (at 10 AM) */}
              <div className="absolute top-28 left-0 right-0 border-t border-dashed border-blue-500 flex items-center z-10 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 -ml-1"></div>
              </div>

              {hours.map(h => (
                <div key={h} className="grid grid-cols-8 gap-2 items-start min-h-[90px] border-b border-slate-50">
                  {/* Hour Label */}
                  <span className="text-[11px] font-bold text-slate-400 text-center pt-1 font-mono">
                    {h}
                  </span>

                  {/* 7 Day Cells */}
                  {columns.map(c => {
                    // Match events
                    const event = scheduleEvents.find(e => e.col === c.id && e.timeSlot === h);

                    return (
                      <div key={c.id} className="min-h-[80px] p-0.5">
                        {event && (
                          <div
                            onClick={() => setActivePopoverAppt(event)}
                            className={`p-2 rounded-xl text-left cursor-pointer transition ${event.color} ${
                              event.isPrimaryActive ? 'h-[140px] z-20 relative' : ''
                            }`}
                          >
                            <div className="text-[11px] font-bold leading-tight">{event.title}</div>
                            <div className="text-[9px] opacity-80 mt-1 font-mono">{event.time}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

            </div>

          </div>

          {/* 4. INTERACTIVE SCHEDULE POPOVER MODAL ("Edit Schedule" Youcare Style) */}
          {activePopoverAppt && (
            <div className="absolute top-28 right-16 z-30 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900">Edit Schedule</span>
                <button onClick={() => setActivePopoverAppt(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full font-bold text-slate-900 text-xs outline-none border-b border-transparent focus:border-blue-500 py-1"
                />
                <input
                  type="text"
                  placeholder="Add Description"
                  className="w-full text-slate-400 text-[11px] outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{scheduleTime}</span>
                </div>
                <RefreshCw className="w-3 h-3 text-slate-400 cursor-pointer" />
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Add Guests</span>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white">
                      E
                    </div>
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-white">
                      A
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">{guestCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActivePopoverAppt(null)}
                  className="px-3 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow"
                >
                  Save
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
