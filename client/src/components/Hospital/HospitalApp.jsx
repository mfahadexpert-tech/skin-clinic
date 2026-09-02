"use client";

import React, { useState } from "react";
import { 
  Building2, Stethoscope, Users, User, ShieldCheck, Bot, 
  Sparkles, CheckCircle2, ChevronDown, Menu, X, Bell 
} from "lucide-react";
import ReceptionistView from "./ReceptionistView";
import DoctorView from "./DoctorView";
import PatientPortal from "./PatientPortal";
import AdminView from "./AdminView";
import AIChatModal from "./AIChatModal";

export default function HospitalApp() {
  const [currentRole, setCurrentRole] = useState("receptionist"); // "receptionist", "doctor", "patient", "admin"
  const [showAIChat, setShowAIChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roles = [
    { id: "receptionist", label: "Receptionist Desk", icon: Users, desc: "Approval Queue & POS" },
    { id: "doctor", label: "Doctor Chamber", icon: Stethoscope, desc: "Call Next & Clinical" },
    { id: "patient", label: "Patient Portal", icon: User, desc: "5-Step Booking & Records" },
    { id: "admin", label: "Hospital Admin", icon: ShieldCheck, desc: "Governance & Audits" },
  ];

  return (
    <div className="min-h-screen bg-[#E0FBFC] text-[#253237] flex flex-col selection:bg-[#C2DFE3] selection:text-[#253237]">
      
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#253237] text-white border-b border-[#5C6B73] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E0FBFC] text-[#253237] flex items-center justify-center font-black shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-[#E0FBFC] tracking-tight">SkinLab Hospital</span>
                <span className="px-2 py-0.5 rounded-full bg-[#5C6B73] text-[10px] uppercase font-bold tracking-widest text-white">
                  Enterprise AI
                </span>
              </div>
              <p className="text-[11px] text-[#9DB4C0] hidden sm:block">Clinical Queue & Intelligence System</p>
            </div>
          </div>

          {/* Desktop Role Navigation Switcher */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#1b2428] p-1.5 rounded-xl border border-[#5C6B73]">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setCurrentRole(r.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? "bg-[#E0FBFC] text-[#253237] shadow-sm"
                      : "text-[#9DB4C0] hover:text-white hover:bg-[#253237]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* AI Assistant Quick Trigger */}
            <button
              onClick={() => setShowAIChat(true)}
              className="px-3 py-2 bg-[#E0FBFC] hover:bg-white text-[#253237] font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2 group"
            >
              <Bot className="w-4 h-4 text-[#253237] group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#9DB4C0] hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1b2428] border-t border-[#5C6B73] p-4 space-y-2">
            <div className="text-[10px] uppercase font-bold text-[#9DB4C0] tracking-wider mb-2">Switch Workspace Role</div>
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentRole(r.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between ${
                    isActive ? "bg-[#E0FBFC] text-[#253237]" : "text-[#9DB4C0] hover:bg-[#253237]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === "receptionist" && <ReceptionistView />}
        {currentRole === "doctor" && <DoctorView />}
        {currentRole === "patient" && <PatientPortal patientId="pat-01" onOpenAI={() => setShowAIChat(true)} />}
        {currentRole === "admin" && <AdminView />}
      </main>

      {/* Governed AI Assistant Chat Modal */}
      <AIChatModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        activePatientId="pat-01"
        onBookingConfirmed={() => {
          // Trigger refresh if needed
        }}
      />

      {/* Floating AI Agent Trigger Button (Bottom Right) */}
      <button
        onClick={() => setShowAIChat(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#253237] text-[#E0FBFC] shadow-2xl border-2 border-[#E0FBFC] hover:scale-105 transition-all flex items-center gap-2.5 font-bold group"
        title="Open AI Assistant"
      >
        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold text-white hidden sm:inline">AI Clinical Agent</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
      </button>

      {/* Footer */}
      <footer className="bg-[#253237] text-[#9DB4C0] border-t border-[#5C6B73] py-6 text-center text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© 2026 SkinLab Hospital Management & AI Agent System. All rights reserved.</p>
          <p className="text-[11px] text-[#5C6B73]">
            Strict RBAC • Non-Reusable Concurrency-Safe Tokens • Immutable Prescription Versioning • Governed Clinical AI Layer
          </p>
        </div>
      </footer>

    </div>
  );
}
