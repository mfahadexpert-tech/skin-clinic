/**
 * ==============================================================================
 * SkinLab AI - Module 3.4: GPT Doctor Assistant
 * 10+ Years Senior UI/UX Designer Redesign (DocuVerse Clean Standard)
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

  const quickPrompts = [
    { label: '✨ Carbon Laser Peel Guide', query: 'What are the main steps and post-care for Carbon Laser Peel?' },
    { label: '⚠️ Roaccutane Safety (Urdu)', query: 'Patient Roaccutane le rahi hai, kya chemical peel kar sakte hain?' },
    { label: '📋 Draft Session Note', query: 'Draft a quick session note for today\'s laser treatment' },
    { label: '☀️ Post-Laser Care (Urdu)', query: 'Laser ke baad patient ko kya post-care batani hai?' },
  ];

  const handleSendMessage = async (queryToSend) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isStreaming) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
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

    await api.streamAIChat(
      query,
      selectedPatient.id,
      (token) => {
        accumulatedText += token;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
        ));
      },
      () => {
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
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="docu-card p-6 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Doctor AI Clinical Assistant</h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                English + Roman Urdu
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Dermatology protocol reference & SOAP clinical notes</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500">Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-[#0f172a] rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.skin_type || 'Medium'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Chat Feed (8 Cols) */}
        <div className="lg:col-span-8 docu-card flex flex-col h-[580px] bg-white">
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0f172a] text-white font-medium shadow-sm'
                      : 'bg-slate-50 text-[#0f172a] border border-slate-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 text-[10px] text-slate-400 border-b border-slate-200/40 pb-1 font-bold">
                    <span>{msg.sender === 'user' ? 'Doctor Inquiry' : 'Clinical AI'}</span>
                    {msg.sender === 'assistant' && msg.text && (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleCopyText(msg.id, msg.text)} className="hover:text-slate-800">
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {onInjectNotes && (
                          <button
                            onClick={() => onInjectNotes(msg.text)}
                            className="text-emerald-700 font-bold hover:underline flex items-center space-x-1"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            <span>Insert to Notes</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap font-sans font-medium text-xs">
                    {msg.text || (isStreaming ? <span className="animate-pulse">Retrieving dermatology guidance...</span> : "")}
                  </div>

                  {msg.disclaimer && msg.text && (
                    <div className="mt-3 pt-2 border-t border-amber-200 flex items-center space-x-1.5 text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{msg.disclaimer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex space-x-2 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp.query)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-[11px] text-slate-700 hover:text-emerald-800 border border-slate-200 font-bold whitespace-nowrap transition shadow-sm"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-slate-100 bg-white flex items-center space-x-2 rounded-b-2xl"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything in English or Roman Urdu..."
              disabled={isStreaming}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-[#0f172a] font-medium outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputQuery.trim()}
              className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-full font-bold text-xs shadow disabled:opacity-50 flex items-center space-x-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Sidebar Info (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="docu-card p-5 space-y-3 bg-white">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#0f172a]">
              <FileSignature className="w-4 h-4 text-emerald-600" />
              <span>Selected Patient Profile</span>
            </div>
            <div className="text-xs space-y-1.5 text-slate-600">
              <div><strong>Name:</strong> {selectedPatient.name}</div>
              <div><strong>MRN ID:</strong> <span className="font-mono font-bold text-emerald-700">{selectedPatient.mrn}</span></div>
              <div><strong>Skin Tone:</strong> <span className="font-bold text-[#0f172a]">{selectedPatient.skin_type || 'Medium Asian'}</span></div>
            </div>
          </div>

          <div className="docu-card p-5 space-y-3 bg-white">
            <div className="flex items-center space-x-2 text-xs font-extrabold text-[#0f172a]">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Verified Clinical Rules</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-2.5 list-disc pl-4 font-medium">
              <li><strong>Carbon Laser Peel</strong>: Pore cleaning & instant radiance. Downtime: 1–2 hours.</li>
              <li><strong>Laser Hair Removal</strong>: Shave 24h prior. Strict sun avoidance for 7 days.</li>
              <li><strong>Roaccutane Rule</strong>: Wait 6 months after medicine before chemical peels or lasers.</li>
              <li><strong>Sun Protection</strong>: Mineral SPF 50+ reapplication every 3 hours.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
