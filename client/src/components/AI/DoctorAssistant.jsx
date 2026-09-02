/**
 * ==============================================================================
 * SkinLab AI - Doctor Assistant with Voice Dictation & Vision AI Image Model
 * ==============================================================================
 * Features:
 * - 🖼️ Multimodal Vision AI Image Selection & Clinical Feature Extraction.
 * - 🎙️ Speech-to-Text Dictation (Web Speech API).
 * - 🔊 Text-to-Speech Voice Output.
 * - Non-removable clinical safety disclaimer badge.
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
  FileSignature,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  AlertTriangle,
  Image as ImageIcon,
  FileImage,
  X,
  Eye
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DoctorAssistant({ patients, onInjectNotes }) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(false);
  const [micErrorMsg, setMicErrorMsg] = useState(null);

  // Vision AI Image Selection states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chatBottomRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Assalam-o-Alaikum! I am your **SkinLab Clinical Voice & Vision AI Assistant**.\n\nYou can:\n- 🎙️ Click the **Microphone** button to speak your query in English or Roman Urdu.\n- 🖼️ Click the **Image Button** to upload/select a clinical photograph or lab report scan for AI visual extraction!\n\nAsk about treatments, safety rules, Fitzpatrick skin typing, or lab values.",
      disclaimer: "AI-generated suggestion. Please verify before clinical application."
    }
  ]);
  const [copiedId, setCopiedId] = useState(null);

  const selectedPatient = patients.find(p => p.id === parseInt(selectedPatientId)) || patients[0];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Request Microphone Permissions & Initialize Speech Recognition
  const initSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicErrorMsg("Speech recognition is not built into this browser. Please use Google Chrome or Microsoft Edge.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMicErrorMsg(null);
    };

    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInputQuery(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('[Voice Model Error]:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicErrorMsg("Microphone permission denied. Please allow microphone access in your browser address bar.");
      } else {
        setMicErrorMsg(`Voice error: ${event.error}.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  const toggleVoiceDictation = async () => {
    setMicErrorMsg(null);
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      setIsListening(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
    } catch (err) {
      setMicErrorMsg("Microphone access blocked. Please allow microphone permission in your browser address bar.");
      return;
    }

    let recognition = recognitionRef.current;
    if (!recognition) {
      recognition = initSpeechRecognition();
      recognitionRef.current = recognition;
    }

    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        try {
          recognition.stop();
          setTimeout(() => recognition.start(), 200);
        } catch (retryErr) {
          setMicErrorMsg("Voice engine busy. Please click mic again.");
        }
      }
    }
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const speakText = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const quickPrompts = [
    { label: '🖼️ Analyze Sample Photo', action: 'sample_photo' },
    { label: '🎙️ Speak Query Now', action: 'mic' },
    { label: '✨ Carbon Laser Peel Guide', query: 'What are the main steps and post-care for Carbon Laser Peel?' },
    { label: '⚠️ Roaccutane Safety (Urdu)', query: 'Patient Roaccutane le rahi hai, kya chemical peel kar sakte hain?' },
    { label: '📋 Draft Session Note', query: 'Draft a quick session note for today\'s laser treatment' },
  ];

  const handleSendMessage = async (queryToSend) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() && !selectedImage && !queryToSend) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const currentPreview = imagePreview;
    const currentImage = selectedImage;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query || (currentImage ? "Analyzing attached clinical photograph..." : ""),
      image: currentPreview
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    clearSelectedImage();
    setIsStreaming(true);

    const assistantMsgId = Date.now() + 1;

    setMessages(prev => [
      ...prev,
      {
        id: assistantMsgId,
        sender: 'assistant',
        text: "",
        disclaimer: "AI-generated suggestion. Please verify before clinical application."
      }
    ]);

    // If an image was attached, send to Vision API
    if (currentImage || currentPreview) {
      try {
        const formData = new FormData();
        formData.append("patient_id", selectedPatient.id);
        if (query) formData.append("prompt_hint", query);
        if (currentImage) formData.append("file", currentImage);

        const res = await fetch("http://127.0.0.1:8000/api/ai/vision/analyze", {
          method: "POST",
          body: formData
        });
        const visionData = await res.json();
        const analysisText = visionData.analysis_text || "Vision AI completed clinical image extraction.";

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, text: analysisText } : msg
        ));
        setIsStreaming(false);
        if (voicePlaybackEnabled) speakText(analysisText);
        return;
      } catch (err) {
        console.error("Vision AI request failed:", err);
      }
    }

    // Text RAG Streaming Fallback
    let accumulatedText = "";
    await api.streamAIChat(
      query || "Clinical protocol inquiry",
      selectedPatient.id,
      (token) => {
        accumulatedText += token;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId ? { ...msg, text: accumulatedText } : msg
        ));
      },
      (doneData) => {
        setIsStreaming(false);
        if (voicePlaybackEnabled) speakText(accumulatedText);
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
      
      {/* Header with Voice & Vision Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center space-x-1">
            <Bot className="w-5 h-5" />
            <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-rose-400 animate-pulse' : 'text-teal-400'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">Voice & Vision AI Doctor Assistant</h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                <Eye className="w-3 h-3 text-purple-400" />
                <span>Multimodal Vision AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Speak into mic or select clinical photo / lab scan for instant AI extraction</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setVoicePlaybackEnabled(!voicePlaybackEnabled);
              if (voicePlaybackEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
              voicePlaybackEnabled 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Voice Output Playback"
          >
            {voicePlaybackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voicePlaybackEnabled ? 'Voice Output ON' : 'Voice Output OFF'}</span>
          </button>

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
      </div>

      {/* Diagnostic Warning Banner if Mic Issue Occurs */}
      {micErrorMsg && (
        <div className="bg-rose-950/90 border border-rose-500/50 p-3 rounded-xl flex items-center justify-between text-xs text-rose-200 space-x-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{micErrorMsg}</span>
          </div>
          <button 
            onClick={() => setMicErrorMsg(null)}
            className="text-xs font-bold hover:text-white px-2 py-1 bg-rose-900/50 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

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
                      {msg.sender === 'user' ? 'Doctor Inquiry' : 'Clinical Multimodal AI'}
                    </span>
                    {msg.sender === 'assistant' && msg.text && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => speakText(msg.text)}
                          className="hover:text-teal-300 flex items-center space-x-1 text-teal-400 font-bold"
                          title="Read out response via voice"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </button>
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

                  {/* Optional Attached Image Thumbnail in Message */}
                  {msg.image && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 max-w-xs shadow">
                      <img src={msg.image} alt="Selected Clinical Attachment" className="w-full h-36 object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text || (isStreaming ? <span className="animate-pulse">Vision AI analyzing image features & extracting protocols...</span> : "")}
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

          {/* Image Selection Preview Bar if image is attached */}
          {imagePreview && (
            <div className="bg-slate-900/90 border-t border-purple-500/30 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-400">
                  <img src={imagePreview} alt="Selected Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-300 flex items-center space-x-1">
                    <FileImage className="w-3.5 h-3.5 text-purple-400" />
                    <span>Clinical Photo Selected</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Ready for Vision AI extraction</div>
                </div>
              </div>
              <button
                onClick={clearSelectedImage}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Prompts */}
          <div className="p-2 border-t border-white/5 bg-slate-950/60 overflow-x-auto flex space-x-2 no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (qp.action === 'mic') {
                    toggleVoiceDictation();
                  } else if (qp.action === 'sample_photo') {
                    if (fileInputRef.current) fileInputRef.current.click();
                  } else {
                    handleSendMessage(qp.query);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center space-x-1 whitespace-nowrap ${
                  qp.action === 'sample_photo'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                    : qp.action === 'mic'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-teal-300 border-teal-500/20'
                }`}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Hidden File Input for Image Selection */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageFileSelect}
            className="hidden"
          />

          {/* Chat Input Bar with Image Upload & Microphone Dictation Buttons */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-white/10 bg-slate-950/80 flex items-center space-x-2"
          >
            {/* Image Selection Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 ${
                imagePreview
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/30'
                  : 'bg-slate-900 text-purple-400 border-purple-500/30 hover:bg-slate-800 hover:text-purple-300'
              }`}
              title="Select / Upload Clinical Photo or Lab Scan for AI Extraction"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'bg-slate-900 text-teal-400 border-teal-500/30 hover:bg-slate-800 hover:text-teal-300'
              }`}
              title={isListening ? 'Click to Stop Listening' : 'Click to Speak into Microphone'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={imagePreview ? "Ask optional question about selected image..." : "Type, speak, or select photo for AI extraction..."}
              disabled={isStreaming}
              className={`flex-1 glass-input text-xs py-2 ${isListening ? 'border-rose-500/50 bg-rose-950/20 text-rose-200' : ''}`}
            />

            <button
              type="submit"
              disabled={isStreaming || (!inputQuery.trim() && !imagePreview)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-bold text-xs shadow disabled:opacity-50 flex items-center space-x-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>

        {/* Sidebar Guidelines (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="glass-panel p-4 space-y-2 border border-purple-500/20">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-300">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Multimodal Vision AI Model</span>
            </div>
            <div className="text-xs space-y-1 text-slate-300">
              <div><strong>Supported Inputs:</strong> Photos, Scans, Reports</div>
              <div><strong>Extracted Features:</strong> Fitzpatrick Type, Acne Grade, PIH, Lab OCR</div>
              <div><strong>Safety Checks:</strong> Auto-flags contraindications</div>
            </div>
          </div>

          <div className="glass-panel p-4 space-y-2.5 bg-slate-900/80">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Image Selection Instructions</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-2 list-disc pl-4">
              <li>Click the 🖼️ <strong>Image Icon</strong> next to the microphone.</li>
              <li>Select a clinical photograph (lesion, acne, face) or lab report image.</li>
              <li>Vision AI extracts dermatological observations and recommended protocols automatically.</li>
              <li>Click <strong>Insert to Notes</strong> to attach extracted findings directly to session records.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
