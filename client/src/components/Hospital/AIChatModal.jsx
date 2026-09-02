import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, AlertTriangle, CheckCircle, XCircle, Calendar, CreditCard, ShieldAlert, X } from "lucide-react";
import { hospitalApi } from "../../lib/hospitalApi";
import { TokenBadge } from "./SharedComponents";

function formatInlineMarkdown(text) {
  if (!text) return "";
  // Strip raw HTML tags like <div>, <p>, <html>, <body>, <script>
  let clean = text.replace(/<[^>]*>?/gm, "");
  
  // Replace **bold** and *italic*
  const parts = clean.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-extrabold text-[#253237]">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic text-[#5C6B73]">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function FormattedMessage({ content }) {
  if (!content) return null;
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2 py-0.5">
              <span className="text-[#253237] font-bold text-xs mt-0.5">•</span>
              <span className="flex-1">{formatInlineMarkdown(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={idx}>{formatInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export default function AIChatModal({ isOpen, onClose, activePatientId = "pat-01", onBookingConfirmed }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your **SkinLab AI Clinical Assistant**.\n\nI can help you look up doctor availability, submit appointment requests, review your diagnosis and active prescriptions, or answer hospital policy questions.",
      suggestedCards: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (userMsgText = input, confirmedActionId = null) => {
    const textToSend = userMsgText.trim();
    if (!textToSend && !confirmedActionId) return;

    if (!confirmedActionId) {
      setMessages(prev => [...prev, {
        role: "user",
        content: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setInput("");
    }

    setLoading(true);
    try {
      const res = await hospitalApi.sendAIChat(
        textToSend || "Confirm action",
        null,
        activePatientId,
        confirmedActionId
      );

      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.response,
        intent: res.intent,
        suggestedCards: res.suggested_cards || [],
        actionRequired: res.action_required,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      if (onBookingConfirmed && res.intent === "appointment_booking" && confirmedActionId) {
        onBookingConfirmed();
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Sorry, I encountered an issue processing your request: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  const handleConfirmAction = (actionId) => {
    handleSend("Confirmed", actionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in">
      <div className="bg-white border border-[#9DB4C0] rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#253237] text-white px-5 py-4 flex items-center justify-between border-b border-[#5C6B73]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#E0FBFC] text-[#253237]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#E0FBFC]">SkinLab AI Assistant</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#5C6B73] text-[10px] uppercase font-bold tracking-wider text-white">
                  Governed
                </span>
              </div>
              <p className="text-xs text-[#9DB4C0]">Appointment Booking • Policies • Medical History Summary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9DB4C0] hover:text-white hover:bg-[#5C6B73] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-[#E0FBFC] px-4 py-2 border-b border-[#9DB4C0] flex items-center gap-2 text-xs text-[#253237]">
          <ShieldAlert className="w-4 h-4 text-[#5C6B73] shrink-0" />
          <span>
            <strong>AI Boundary:</strong> Read-only clinical records. Booking requests require receptionist approval. Autonomous diagnoses strictly prohibited.
          </span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#253237] text-[#E0FBFC] flex items-center justify-center text-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#253237] text-white rounded-br-none"
                    : "bg-white text-[#253237] border border-[#9DB4C0] rounded-bl-none shadow-sm"
                }`}>
                  <FormattedMessage content={msg.content} />
                  <div className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-[#9DB4C0] text-right" : "text-[#5C6B73]"}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* Suggested Action / Option Cards */}
                {msg.suggestedCards && msg.suggestedCards.length > 0 && (
                  <div className="space-y-2 w-full pt-1">
                    {msg.suggestedCards.map((card, cIdx) => (
                      <div key={cIdx} className="bg-[#E0FBFC] border border-[#9DB4C0] rounded-xl p-3 text-xs space-y-2">
                        {card.type === "confirmation_card" && (
                          <div>
                            <div className="font-bold text-[#253237] flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-700" />
                              {card.title}
                            </div>
                            <p className="text-[#5C6B73] mt-1">{card.details}</p>
                            <div className="flex gap-2 mt-2 pt-2 border-t border-[#9DB4C0]">
                              <button
                                onClick={() => handleConfirmAction(card.action_id)}
                                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors"
                              >
                                {card.confirm_label || card.confirmLabel || "Confirm"}
                              </button>
                            </div>
                          </div>
                        )}

                        {card.type === "booking_option_card" && (
                          <div>
                            <div className="font-bold text-[#253237]">{card.title}</div>
                            <p className="text-[#5C6B73]">{card.details}</p>
                            <button
                              onClick={() => handleConfirmAction(card.action_id)}
                              className="mt-2 w-full py-1.5 bg-[#253237] hover:bg-[#1b2428] text-white font-bold rounded-lg transition-colors"
                            >
                              {card.confirm_label || card.confirmLabel || "Submit Request"}
                            </button>
                          </div>
                        )}

                        {card.type === "token_card" && (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-[#253237]">{card.doctor_name}</div>
                              <div className="text-[#5C6B73] text-[11px]">{card.date} • {card.status}</div>
                            </div>
                            <TokenBadge tokenNumber={card.token_number} status="pending" size="sm" />
                          </div>
                        )}

                        {card.type === "doctor_card" && (
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-[#253237]">{card.name}</div>
                              <div className="text-[#5C6B73] text-[11px]">{card.specialization} • {card.fee}</div>
                            </div>
                            <button
                              onClick={() => handleSend(`Book appointment with ${card.name}`)}
                              className="px-2.5 py-1 bg-[#253237] text-white font-semibold rounded-md hover:bg-[#1b2428]"
                            >
                              Select
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-[#C2DFE3] text-[#253237] flex items-center justify-center text-xs shrink-0 mt-0.5 border border-[#9DB4C0]">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-[#5C6B73] italic">
              <div className="w-7 h-7 rounded-full bg-[#253237] text-[#E0FBFC] flex items-center justify-center text-xs shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <span>AI Assistant is analyzing tools & knowledge protocols...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 bg-white border-t border-[#C2DFE3] flex gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => handleQuickPrompt("Book appointment with Dr. Ahmed")}
            className="px-2.5 py-1 rounded-lg bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] text-[11px] font-semibold shrink-0 transition-colors"
          >
            📅 Book Dr. Ahmed
          </button>
          <button
            onClick={() => handleQuickPrompt("What was my diagnosis in my last visit?")}
            className="px-2.5 py-1 rounded-lg bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] text-[11px] font-semibold shrink-0 transition-colors"
          >
            📋 My Diagnosis
          </button>
          <button
            onClick={() => handleQuickPrompt("How much do I owe currently?")}
            className="px-2.5 py-1 rounded-lg bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] text-[11px] font-semibold shrink-0 transition-colors"
          >
            💳 My Dues
          </button>
          <button
            onClick={() => handleQuickPrompt("What is your appointment cancellation policy?")}
            className="px-2.5 py-1 rounded-lg bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] text-[11px] font-semibold shrink-0 transition-colors"
          >
            ℹ️ Cancellation Policy
          </button>
          <button
            onClick={() => handleQuickPrompt("Can you diagnose my skin rash?")}
            className="px-2.5 py-1 rounded-lg bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] text-[11px] font-semibold shrink-0 transition-colors"
          >
            ⚠️ Test Safety Rule
          </button>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#253237] flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about bookings, doctor availability, or medical summary..."
            className="flex-1 bg-[#1b2428] text-white border border-[#5C6B73] rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#E0FBFC]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-[#E0FBFC] text-[#253237] font-bold hover:bg-white transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
