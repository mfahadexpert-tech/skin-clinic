/**
 * ==============================================================================
 * SkinLab AI - Module 3.4: GPT Doctor Assistant (Simplified & Easy Interface)
 * ==============================================================================
 * Clean, conversational, and direct:
 * - Simple quick questions (Carbon Peel, Laser Sun Protection, Roaccutane Safety, Session Notes).
 * - Clear, bite-sized bullet points.
 * - Non-removable safety disclaimer badge.
 * - 1-Click "Insert to Session Notes".
 * ==============================================================================
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Copy, 
  Check, 
  ArrowDownToLine, 
  BookOpen, 
  FileSignature
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DoctorAssistant({ patients, onInjectNotes }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Assalam-o-Alaikum! I am your **SkinLab Clinical Assistant**.\n\nAsk me about:\n- **Treatment Steps & Settings** (Laser, HydraFacial, Carbon Peel)\n- **Safety & Contraindications** (Roaccutane, Sun exposure, Peels)\n- **Quick Session Notes** in English or Roman Urdu.",
      disclaimer: "AI-generated suggestion. Please verify before clinical application."
    }
  ]);
  const [copiedId, setCopiedId] = useState(null);
  const chatBottomRef = useRef(null);

  const selectedPatient = patients.find(p => p.id === parseInt(selectedPatientId)) || patients[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Clean, Simple Quick Prompts
  const quickPrompts = [
    { label: '✨ Carbon Laser Peel Guide', query: 'What are the main steps and post-care for Carbon Laser Peel?' },
    { label: '⚠️ Roaccutane Safety (Urdu)', query: 'Patient Roaccutane le rahi hai, kya chemical peel kar sakte hain?' },
    { label: '📋 Draft Session Note', query: 'Draft a quick session note for today\'s laser treatment' },
    { label: '☀️ Post-Laser Care (Urdu)', query: 'Laser ke baad patient ko kya post-care batani hai?' },
  ];

  const handleSendMessage = async (queryToSend) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isStreaming) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsStreaming(true);

    const assistantMsgId = Date.now() + 1;
    let accumulatedText = "";

    setMessages(prev => [
      ...prev,
      {
        id: assistantMsgId,
        sender: 'assistant',
        text: "",
        disclaimer: "AI-generated suggestion. Please verify before clinical application."
      }
    ]);

    // Stream from backend
    await api.streamAIChat(
      query,
      selectedPatient.id,
      (token) => {
        accumulatedText += token;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
        ));
      },
      (doneData) => {
        setIsStreaming(false);
      }
    );
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">Doctor AI Assistant</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                English + Roman Urdu
              </span>
            </div>
            <p className="text-xs text-slate-400">Clinical Protocol Guidance & Session Notes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="glass-input text-xs cursor-pointer font-semibold text-teal-300"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name} ({p.skin_type || 'Medium'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Chat Feed (8 Cols) */}
        <div className="lg:col-span-8 glass-panel flex flex-col h-[560px] border border-white/10">
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-teal-600 text-white font-medium shadow'
                      : 'bg-slate-900/90 text-slate-200 border border-white/10 shadow'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 border-b border-white/5 pb-1">
                    <span className="font-bold">
                      {msg.sender === 'user' ? 'Doctor Inquiry' : 'Clinical AI'}
                    </span>
                    {msg.sender === 'assistant' && msg.text && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-teal-400 flex items-center space-x-1"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {onInjectNotes && (
                          <button
                            onClick={() => onInjectNotes(msg.text)}
                            className="hover:text-teal-300 flex items-center space-x-1 text-teal-400 font-bold"
                            title="Insert into session notes"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Insert to Notes</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text || (isStreaming ? <span className="animate-pulse">Thinking & retrieving guidance...</span> : "")}
                  </div>

                  {/* Non-Removable Disclaimer */}
                  {msg.disclaimer && msg.text && (
                    <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center space-x-1.5 text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{msg.disclaimer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-white/5 bg-slate-950/60 overflow-x-auto flex space-x-2 no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.query)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-teal-300 border border-teal-500/20 whitespace-nowrap transition"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-white/10 bg-slate-950/80 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything in English or Roman Urdu..."
              disabled={isStreaming}
              className="flex-1 glass-input text-xs py-2"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputQuery.trim()}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-bold text-xs shadow disabled:opacity-50 flex items-center space-x-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Sidebar Guidelines (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="glass-panel p-4 space-y-2 border border-teal-500/20">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-300">
              <FileSignature className="w-4 h-4" />
              <span>Patient Information</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <div><strong>Name:</strong> {selectedPatient.name}</div>
              <div><strong>ID:</strong> <span className="font-mono text-cyan-400">{selectedPatient.mrn}</span></div>
              <div><strong>Skin:</strong> <span className="text-amber-300">{selectedPatient.skin_type || 'Medium Asian'}</span></div>
            </div>
          </div>

          <div className="glass-panel p-4 space-y-2.5 bg-slate-900/80">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Quick Clinical Rules</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4">
              <li><strong>Carbon Laser Peel</strong>: Pore cleaning & instant glow. Redness fades in 1-2 hours.</li>
              <li><strong>Laser Hair Removal</strong>: Shave 24h before. Avoid hot showers for 48h.</li>
              <li><strong>Roaccutane Rule</strong>: Wait 6 months after medicine before chemical peels or lasers.</li>
              <li><strong>Sun Protection</strong>: Reapply SPF 50+ every 3 hours after treatments.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
