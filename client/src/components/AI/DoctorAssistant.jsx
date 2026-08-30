/**
 * ==============================================================================
 * SkinLab AI - Module 3.4 & 5.3: GPT-Powered Doctor Clinical Assistant
 * ==============================================================================
 * Embedded directly within the doctor dashboard:
 * 1. Powered by LangChain, LangGraph, and RAG (Retrieval-Augmented Generation).
 * 2. Grounded responses from verified dermatology protocols & laser parameters.
 * 3. Real-time Server-Sent Events (SSE) word-by-word streaming.
 * 4. Multilingual NLP: Seamless English & Roman Urdu understanding.
 * 5. Structured SOAP Clinical Session Note Drafting.
 * 6. Non-Removable Disclaimer Badge:
 *    "AI-generated suggestion. Please verify before clinical application."
 * 7. 1-Click Action: Transfer AI Note into POS Clinical Remarks or Patient Record.
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
  AlertTriangle,
  HelpCircle,
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
      text: "Assalam-o-Alaikum Doctor! I am your **SkinLab Clinical AI Assistant** powered by LangGraph RAG.\n\nI can help you with:\n- **Laser fluences & spot size parameters** based on Fitzpatrick phototypes\n- **Checking contraindications** (e.g. Roaccutane / Isotretinoin restrictions)\n- **Drafting structured SOAP clinical session notes**\n- Answering queries in **English or Roman Urdu**.",
      disclaimer: "AI-generated suggestion. Please verify before clinical application."
    }
  ]);
  const [copiedId, setCopiedId] = useState(null);
  const chatBottomRef = useRef(null);

  const selectedPatient = patients.find(p => p.id === parseInt(selectedPatientId)) || patients[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Quick Clinical Prompt Starters
  const quickPrompts = [
    { label: '📋 Draft SOAP Note', query: 'Draft a structured SOAP session note for today\'s laser hair removal treatment' },
    { label: '⚠️ Roaccutane & Peels (Urdu)', query: 'Patient Roaccutane le rahi hai, kya chemical peel kar sakte hain?' },
    { label: '🔬 Laser Energy (Type III)', query: 'What is the recommended diode laser fluence and spot size for Fitzpatrick Type III skin?' },
    { label: '✨ HydraFacial Protocol', query: 'List step-by-step clinical protocol and post-care for HydraFacial Deluxe' },
  ];

  const handleSendMessage = async (queryToSend) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isStreaming) return;

    // Append User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsStreaming(true);

    // Prepare Assistant Message Container
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

    // Stream from Python LangGraph SSE Endpoint
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
    <div className="space-y-6">
      
      {/* Header with Patient Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">GPT Doctor Assistant</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                LangGraph RAG Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">Context-Aware Clinical Decision Support with Real-time SSE Streaming</p>
          </div>
        </div>

        {/* Selected Patient Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Active Consultation:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="glass-input text-xs cursor-pointer font-semibold text-teal-300"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name} ({p.skin_type || 'Type III'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat & Guidance Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chat History Panel (8 Cols) */}
        <div className="lg:col-span-8 glass-panel flex flex-col h-[600px] border border-white/10">
          
          {/* Scrollable Message Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-teal-600 text-white font-medium shadow-md'
                      : 'bg-slate-900/90 text-slate-200 border border-white/10 shadow-lg'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between mb-2 text-[10px] text-slate-400 border-b border-white/5 pb-1">
                    <span className="font-bold flex items-center space-x-1">
                      {msg.sender === 'user' ? 'Attending Physician' : 'Clinical RAG Assistant'}
                    </span>
                    {msg.sender === 'assistant' && msg.text && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-teal-400 flex items-center space-x-1"
                          title="Copy message text"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {onInjectNotes && (
                          <button
                            onClick={() => onInjectNotes(msg.text)}
                            className="hover:text-teal-400 flex items-center space-x-1 text-teal-300 font-semibold"
                            title="Insert directly into POS Session Remarks"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Inject to POS</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text || (isStreaming ? <span className="animate-pulse">Thinking & searching clinical guidelines...</span> : "")}
                  </div>

                  {/* Non-Removable Mandatory Safety Disclaimer */}
                  {msg.disclaimer && msg.text && (
                    <div className="mt-3 pt-2 border-t border-amber-500/20 flex items-center space-x-1.5 text-[10px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{msg.disclaimer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Carousel */}
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

          {/* Input Chat Box */}
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
              placeholder="Ask in English or Roman Urdu (e.g. Laser settings, Roaccutane safe, or draft notes)..."
              disabled={isStreaming}
              className="flex-1 glass-input text-xs py-2.5"
            />
            <button
              type="submit"
              disabled={isStreaming || !inputQuery.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-lg font-bold text-xs shadow-md disabled:opacity-50 flex items-center space-x-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Sidebar Knowledge Reference (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Active Patient Vitals Card */}
          <div className="glass-panel p-4 space-y-2 border border-teal-500/20">
            <div className="flex items-center space-x-2 text-xs font-bold text-teal-300">
              <FileSignature className="w-4 h-4" />
              <span>Active Consultation Profile</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <div><strong>Name:</strong> {selectedPatient.name}</div>
              <div><strong>MRN:</strong> <span className="font-mono text-cyan-400">{selectedPatient.mrn}</span></div>
              <div><strong>Skin Classification:</strong> <span className="text-amber-300">{selectedPatient.skin_type || 'Type III'}</span></div>
              <div><strong>Allergies:</strong> {selectedPatient.allergies || 'None documented'}</div>
            </div>
          </div>

          {/* Clinical RAG Safeguards Card */}
          <div className="glass-panel p-4 space-y-3 bg-slate-900/80">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Standard Aesthetic Protocols</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4">
              <li><strong>Diode Laser (808nm)</strong>: Calibrate fluence between 12-16 J/cm² for Asian skin.</li>
              <li><strong>HydraFacial Vortex</strong>: Mandate GlySal peel step with 7.5% Glycolic + 2% Salicylic.</li>
              <li><strong>Roaccutane Rule</strong>: Strict 6-month wait period post-Isotretinoin before ablative procedures.</li>
              <li><strong>Botox Post-Care</strong>: Upright posture for 4 hours, zero face massaging for 24 hours.</li>
            </ul>
          </div>

          {/* Multilingual Roman Urdu Helper */}
          <div className="glass-panel p-4 bg-teal-950/30 border border-teal-500/30 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-teal-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Roman Urdu Supported</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Aap Roman Urdu mein sawal pooch sakte hain (e.g. <em>"Laser ke baad cooling kab karni hai?"</em>). Assistant khud samjh kar jawab faraham karega.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
