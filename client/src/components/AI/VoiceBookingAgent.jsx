/**
 * ==============================================================================
 * SkinLab AI - Module 3.6 & 7: 24/7 AI Voice Booking Agent & Calendar Sync
 * ==============================================================================
 * Interactive Voice Booking simulator:
 * 1. Simulates incoming patient phone calls handled by AI around the clock.
 * 2. Natural conversation in English or Roman Urdu.
 * 3. Speech waveform visualizer & speech-to-text transcript.
 * 4. Checks doctor real-time availability and creates bookings directly in calendar.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  Calendar, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  User, 
  Volume2,
  Stethoscope
} from 'lucide-react';
import { api } from '@/lib/api';

export default function VoiceBookingAgent() {
  const [isCalling, setIsCalling] = useState(false);
  const [callerPhone, setCallerPhone] = useState('0300-8877665');
  const [callerName, setCallerName] = useState('Zainab Tariq');
  const [speechTranscript, setSpeechTranscript] = useState('Assalam-o-Alaikum, mujhe kal HydraFacial ke liye appointment book karwani hai.');
  const [callResult, setCallResult] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load current appointments
  const fetchSchedule = async () => {
    try {
      const res = await api.getCalendarSchedule();
      if (res && res.appointments) {
        setAppointments(res.appointments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Simulate Incoming Call Processing
  const handleStartCallSimulation = async () => {
    setIsCalling(true);
    setIsLoading(true);
    setCallResult(null);

    try {
      const result = await api.simulateVoiceCall({
        caller_phone: callerPhone,
        caller_name: callerName,
        speech_transcript: speechTranscript
      });

      setTimeout(() => {
        setIsLoading(false);
        setCallResult(result);
        fetchSchedule(); // Refresh calendar view
      }, 1800);
    } catch (e) {
      setIsLoading(false);
      setIsCalling(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">AI Voice Booking Agent</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                24/7 Active Live
              </span>
            </div>
            <p className="text-xs text-slate-400">Low-Latency Conversational Voice Agent with Roman Urdu & Calendar Sync</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Interactive Phone Call Simulation (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4 border border-teal-500/20">
          <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Mic className="w-4 h-4" />
            <span>Interactive Phone Call Terminal</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300">Caller Patient Name</label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full glass-input text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300">Incoming Phone Number</label>
              <input
                type="text"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                className="w-full glass-input text-xs font-mono mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300">Caller Speech Audio Transcript (Roman Urdu / English)</label>
              <textarea
                rows={3}
                value={speechTranscript}
                onChange={(e) => setSpeechTranscript(e.target.value)}
                className="w-full glass-input text-xs mt-1 leading-relaxed"
              />
            </div>

            {/* Simulated Call Action */}
            <div className="pt-2">
              {!isCalling ? (
                <button
                  onClick={handleStartCallSimulation}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Simulate Incoming Patient Call</span>
                </button>
              ) : (
                <div className="p-4 bg-slate-950 rounded-xl border border-teal-500/40 text-center space-y-3">
                  
                  {/* Simulated Audio Waveform */}
                  <div className="flex items-center justify-center space-x-1 py-2">
                    {[16, 28, 44, 20, 36, 48, 24, 40, 16].map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-teal-400 rounded-full animate-pulse"
                        style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>

                  <div className="text-xs font-bold text-teal-300 flex items-center justify-center space-x-1.5">
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    <span>AI Voice Agent Conversing in Real-Time...</span>
                  </div>

                  {callResult && (
                    <div className="p-3 bg-teal-950/50 rounded-lg border border-teal-500/30 text-left space-y-2">
                      <div className="text-[10px] text-teal-400 font-bold uppercase">AI Voice Response to Caller:</div>
                      <p className="text-xs text-slate-200 italic">"{callResult.ai_voice_response}"</p>
                      <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1 pt-1 border-t border-teal-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Slot Reserved in Google Calendar Sync</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsCalling(false);
                      setCallResult(null);
                    }}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 mx-auto"
                  >
                    <PhoneOff className="w-3 h-3" />
                    <span>End Call Simulation</span>
                  </button>

                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT PANEL: Live Doctor Calendar & Appointments Sync (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Doctor Calendar & Appointments</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
              Google Calendar Synced
            </span>
          </div>

          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 hover:border-teal-500/40 transition flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{appt.customer_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      appt.source === 'ai-voice' 
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {appt.source}
                    </span>
                  </div>
                  <div className="text-xs text-teal-300 font-medium">{appt.treatment_name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Stethoscope className="w-3 h-3 text-cyan-400" />
                      <span>{appt.doctor_name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(appt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
