/**
 * ==============================================================================
 * SkinLab AI - Module 3.6: Multi-Channel WhatsApp Communications & Webhook Hub
 * ==============================================================================
 * Primary high-priority patient communication channel for Pakistan & global clinics:
 * 1. Dispatches automated appointment reminders (24h prior) with prep notes (shaving, etc.).
 * 2. Post-treatment clinical care instructions (HydraFacial, Laser, Peels).
 * 3. Webhook activity logger displaying real-time delivery and read receipts.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCheck, Clock, ShieldCheck, User, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

export default function WhatsAppHub({ patients }) {
  const [logs, setLogs] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [templateType, setTemplateType] = useState('24h_reminder');
  const [customText, setCustomText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await api.getWhatsAppLogs();
      if (res && res.logs) setLogs(res.logs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await api.sendWhatsAppMessage({
        customer_id: parseInt(selectedPatientId),
        template_type: templateType,
        custom_message: customText
      });
      setIsSending(false);
      setCustomText('');
      fetchLogs();
    } catch (e) {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">WhatsApp Communications & Webhooks</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                High-Priority Delivery
              </span>
            </div>
            <p className="text-xs text-slate-400">Automated 24h Reminders, Post-Care Protocols & Webhook Status Log</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Quick Dispatcher (5 Cols) */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4 border border-emerald-500/20">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Send className="w-4 h-4" />
            <span>Dispatch Automated Message</span>
          </h3>

          <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300">Target Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full glass-input text-xs mt-1"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300">Message Template Type</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full glass-input text-xs mt-1"
              >
                <option value="24h_reminder">24-Hour Appointment Reminder & Prep Instructions</option>
                <option value="confirmation">Instant Booking Confirmation</option>
                <option value="post_care_laser">Post-Laser Care Protocol (SPF 50+ & Aloe)</option>
                <option value="post_care_facial">Post-HydraFacial Care Guidelines</option>
                <option value="custom">Custom Clinical Message</option>
              </select>
            </div>

            {templateType === 'custom' && (
              <div>
                <label className="text-slate-300">Custom Message Content</label>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type message to patient..."
                  className="w-full glass-input text-xs mt-1"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending via Twilio / WhatsApp...' : 'Dispatch WhatsApp Alert'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: Live Webhook & Dispatch Log (7 Cols) */}
        <div className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Outbound Activity & Webhook Events Log</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Webhook Listener Active</span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-2 hover:border-emerald-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{log.recipient_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{log.phone}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span className="capitalize">{log.status}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line bg-slate-950/60 p-2.5 rounded-lg border border-white/5">
                  {log.message}
                </p>

                <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
