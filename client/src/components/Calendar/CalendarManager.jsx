/**
 * ==============================================================================
 * SkinLab AI - Appointment & Calendar Manager (Youcare UI Clone)
 * Pixel-Perfect match to Youcare Design Reference
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Download, 
  Search, 
  HelpCircle, 
  LayoutGrid, 
  Clock, 
  MoreHorizontal, 
  Repeat, 
  Users, 
  Check, 
  X,
  Video,
  Share2
} from 'lucide-react';

export default function CalendarManager({ appointments = [], doctors = [], patients = [], onAddAppointment }) {
  // Active selected states
  const [selectedDayNumber, setSelectedDayNumber] = useState(5); // 5 is active in Youcare
  const [selectedColumnDate, setSelectedColumnDate] = useState('WED 3'); // WED 3 active in Youcare
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(true); // Popover open by default as in photo
  const [isCheckNewOpen, setIsCheckNewOpen] = useState(false);

  // Popover state
  const [editTitle, setEditTitle] = useState('Physical Control Health');
  const [editTime, setEditTime] = useState('09:00 AM → 11:00 AM');

  // Days of week columns
  const calendarColumns = [
    { label: 'MON 1', dayNum: 1 },
    { label: 'TUE 2', dayNum: 2 },
    { label: 'WED 3', dayNum: 3, active: true },
    { label: 'THU 4', dayNum: 4 },
    { label: 'FRI 5', dayNum: 5 },
    { label: 'SAT 6', dayNum: 6 },
    { label: 'SUN 7', dayNum: 7 },
  ];

  return (
    <div className="space-y-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      
      {/* Title & Top Action */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment</h1>
        <button
          onClick={() => setIsCheckNewOpen(true)}
          className="flex items-center space-x-1.5 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Check new</span>
        </button>
      </div>

      {/* Sub Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        
        {/* Left Filter Pills */}
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>

          <button className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Monthly ▾</span>
          </button>

          <button className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download Data</span>
          </button>
        </div>

        {/* Right Tools Pills */}
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50">
            <Search className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 hover:bg-slate-50">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Support</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 hover:bg-slate-50">
            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
            <span>Content Layout</span>
          </button>
        </div>

      </div>

      {/* Main Grid: Left Calendar Widget & Right Weekly Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* LEFT COLUMN (4 Cols): Mini Month Picker + Doctor Appointment List */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Mini Calendar Card */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Appointment Calendar</span>
              <div className="flex space-x-1">
                <button className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-6 h-6 rounded-full border border-slate-200 text-slate-500 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            {/* Dates Grid (1 to 31 with 5 active) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {[1, 2, 3, 4].map(d => (
                <button key={d} onClick={() => setSelectedDayNumber(d)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full">{d}</button>
              ))}
              {/* Day 5 Solid Blue Circle */}
              <button className="p-1.5 bg-blue-600 text-white font-bold rounded-full shadow-sm">5</button>
              {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(d => (
                <button key={d} onClick={() => setSelectedDayNumber(d)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-full">{d}</button>
              ))}
            </div>
          </div>

          {/* Doctor Appointment List */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Doctor Appointment List</span>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Doctor 1 */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Dr. Emily Johnson</div>
                  <div className="text-[10px] text-blue-600 font-semibold">Pediatrician</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>10:00 - 11:00</span>
              </div>
            </div>

            {/* Doctor 2 */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-2.5">
                <img
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Dr. Michael Lee</div>
                  <div className="text-[10px] text-blue-600 font-semibold">Dermatologist</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>11:00 - 12:00</span>
              </div>
            </div>

            {/* Blue See All Button */}
            <button className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition">
              See All
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN (8 Cols): Weekly Schedule Grid & Popover */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header of Weekly Grid */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900">Agustus 2026</span>
              <button className="px-2.5 py-0.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
                Today
              </button>
              <div className="flex space-x-0.5">
                <button className="p-1 text-slate-400 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1 text-slate-400 hover:text-slate-700"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="cursor-pointer hover:text-slate-800">None</span>
              <span className="cursor-pointer hover:text-slate-800">Priority</span>
              <span className="cursor-pointer hover:text-slate-800">Deadline</span>
              <button className="p-1 text-slate-400"><Video className="w-3.5 h-3.5" /></button>
              <button className="p-1 text-slate-400"><Share2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Main Grid View */}
          <div className="relative border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20">
            
            {/* Days Column Header */}
            <div className="grid grid-cols-8 border-b border-slate-100 bg-white text-center text-xs font-bold text-slate-500">
              <div className="py-2.5 border-r border-slate-100 text-[10px] text-slate-400 font-mono">GMT+8</div>
              {calendarColumns.map((col) => (
                <div
                  key={col.label}
                  onClick={() => setSelectedColumnDate(col.label)}
                  className={`py-2.5 border-r border-slate-100 cursor-pointer transition ${
                    col.label === selectedColumnDate ? 'text-blue-600 bg-blue-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Time Grid with Appointment Cards */}
            <div className="relative">
              
              {/* Horizontal current time indicator line */}
              <div className="absolute top-[88px] left-0 right-0 border-b-2 border-dashed border-blue-500 z-10 pointer-events-none" />

              {/* 09 AM Row */}
              <div className="grid grid-cols-8 h-24 border-b border-slate-100">
                <div className="p-2 border-r border-slate-100 text-right text-[11px] font-mono text-slate-400 font-semibold">09 AM</div>
                
                {/* MON: Check Health */}
                <div className="p-1.5 border-r border-slate-100">
                  <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-700">
                    <div>Check Health</div>
                    <span className="font-normal opacity-80">09 AM - 10 AM</span>
                  </div>
                </div>

                <div className="border-r border-slate-100"></div>

                {/* WED: Heart Check-Up */}
                <div className="p-1.5 border-r border-slate-100 bg-blue-50/20">
                  <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                    <div>Heart Check-Up</div>
                    <span className="font-normal opacity-80">08 AM - 10 AM</span>
                  </div>
                </div>

                {/* THU: Physical Control Health (Active Blue Card) */}
                <div className="p-1.5 border-r border-slate-100 relative">
                  <div
                    onClick={() => setIsEditScheduleOpen(!isEditScheduleOpen)}
                    className="p-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-lg shadow-blue-600/30 cursor-pointer h-20"
                  >
                    <div>Physical Control...</div>
                    <span className="text-[10px] font-normal opacity-90">09 AM - 11 AM</span>
                  </div>

                  {/* FLOATING POPOVER: "Edit Schedule" (As shown in Image 2) */}
                  {isEditScheduleOpen && (
                    <div className="absolute top-4 left-full ml-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-30 text-xs space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-900">Edit Schedule</span>
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-600 inline-block" />
                          <span>Physical Control Health</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Add Description"
                          className="w-full text-[11px] text-slate-500 pl-4 bg-transparent outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>09:00 AM → 11:00 AM</span>
                        </div>
                        <Repeat className="w-3 h-3 text-slate-400 cursor-pointer" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Add Guests</span>
                        </div>
                        <span className="text-[10px] text-slate-500">1 Going, 1 Awaiting</span>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setIsEditScheduleOpen(false)}
                          className="px-3 py-1 text-slate-500 hover:bg-slate-100 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setIsEditScheduleOpen(false);
                            alert('Schedule updated successfully!');
                          }}
                          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-r border-slate-100"></div>

                {/* SAT: Check-Up */}
                <div className="p-1.5 border-r border-slate-100">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                    <div>Check-Up</div>
                  </div>
                </div>

                <div></div>
              </div>

              {/* 10 AM Row */}
              <div className="grid grid-cols-8 h-24 border-b border-slate-100">
                <div className="p-2 border-r border-slate-100 text-right text-[11px] font-mono text-slate-400 font-semibold">10 AM</div>
                <div className="border-r border-slate-100"></div>
                
                {/* TUE: Body Condition */}
                <div className="p-1.5 border-r border-slate-100">
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                    <div>Body Condition</div>
                    <span className="font-normal opacity-80">10 AM - 11 AM</span>
                  </div>
                </div>

                {/* WED: Check Your Teeth */}
                <div className="p-1.5 border-r border-slate-100 bg-blue-50/20">
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[10px] font-bold text-rose-700">
                    <div>Check Your Teeth</div>
                    <span className="font-normal opacity-80">10 AM - 11 AM</span>
                  </div>
                </div>

                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>
                <div></div>
              </div>

              {/* 11 AM Row */}
              <div className="grid grid-cols-8 h-20 border-b border-slate-100">
                <div className="p-2 border-r border-slate-100 text-right text-[11px] font-mono text-slate-400 font-semibold">11 AM</div>
                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100 bg-blue-50/20"></div>
                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>
                <div></div>
              </div>

              {/* 12 AM Row */}
              <div className="grid grid-cols-8 h-20">
                <div className="p-2 border-r border-slate-100 text-right text-[11px] font-mono text-slate-400 font-semibold">12 AM</div>
                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>

                {/* WED: Check-Up Kid */}
                <div className="p-1.5 border-r border-slate-100 bg-blue-50/20">
                  <div className="p-2 rounded-xl bg-lime-50 border border-lime-200 text-[10px] font-bold text-lime-700">
                    <div>Check-Up Kid</div>
                    <span className="font-normal opacity-80">12 AM - 13 AM</span>
                  </div>
                </div>

                <div className="border-r border-slate-100"></div>
                <div className="border-r border-slate-100"></div>

                {/* SAT: Check-Up */}
                <div className="p-1.5 border-r border-slate-100">
                  <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-700">
                    <div>Check-Up</div>
                    <span className="font-normal opacity-80">12 AM - 13 AM</span>
                  </div>
                </div>

                <div></div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Modal for + Check New */}
      {isCheckNewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Schedule New Appointment</h3>
              <button onClick={() => setIsCheckNewOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Patient Full Name</label>
                <input type="text" placeholder="e.g. Ayesha Khan" className="w-full docu-input text-xs mt-1" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Service / Treatment</label>
                <select className="w-full docu-input text-xs mt-1">
                  <option>HydraFacial Deluxe</option>
                  <option>Laser Hair Reduction</option>
                  <option>Carbon Laser Hollywood Peel</option>
                  <option>Botox Anti-Aging Consultation</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setIsCheckNewOpen(false)} className="px-3 py-1.5 text-slate-500 rounded-lg text-xs">Cancel</button>
                <button onClick={() => { setIsCheckNewOpen(false); alert('Appointment scheduled!'); }} className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
