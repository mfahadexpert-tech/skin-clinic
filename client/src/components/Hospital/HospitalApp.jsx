"use client";

import React, { useState } from "react";
import { 
  Building2, Stethoscope, Users, User, ShieldCheck, Bot, 
  Sparkles, CheckCircle2, ChevronDown, Menu, X, Bell,
  ChevronLeft, ChevronRight, Settings, Activity, Maximize2, Minimize2,
  FileText, ArrowLeft, ArrowRight
} from "lucide-react";
import ReceptionistView from "./ReceptionistView";
import DoctorView from "./DoctorView";
import PatientPortal from "./PatientPortal";
import AdminView from "./AdminView";
import AIChatModal from "./AIChatModal";

export default function HospitalApp() {
  const [currentRole, setCurrentRole] = useState("receptionist"); // "receptionist", "doctor", "patient", "admin"
  const [activePatientId, setActivePatientId] = useState("pat-01");
  const [showAIChat, setShowAIChat] = useState(false);
  
  // Sidebar visibility & fullscreen toggle state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // User Profile Mapping by Active Role
  const profileDetails = {
    receptionist: {
      name: "Fatima Noor",
      role: "Chief Receptionist & Triage",
      avatarBg: "bg-teal-700",
      avatarInitials: "FN"
    },
    doctor: {
      name: "Dr. Ahmed Tariq",
      role: "Consultant Dermatologist",
      avatarBg: "bg-emerald-800",
      avatarInitials: "AT"
    },
    patient: {
      name: "Patient Health Portal",
      role: "Public & Registered Access",
      avatarBg: "bg-indigo-700",
      avatarInitials: "PP"
    },
    admin: {
      name: "Dr. M. Dawood",
      role: "Hospital Medical Director",
      avatarBg: "bg-slate-800",
      avatarInitials: "MD"
    }
  };

  const activeProfile = profileDetails[currentRole] || profileDetails.receptionist;

  // Categorized Navigation Items (Matching Poultry Reference Sidebar Structure)
  const navCategories = [
    {
      title: "DAILY CLINICAL WORK",
      items: [
        {
          id: "receptionist",
          label: "Receptionist Desk",
          icon: Users,
          badge: "Queue & POS",
          desc: "Front Desk Operations & Approvals"
        },
        {
          id: "doctor",
          label: "Doctor Chamber",
          icon: Stethoscope,
          badge: "Clinical",
          desc: "Live Queue Calling & Consultations"
        },
        {
          id: "patient",
          label: "Patient Portal",
          icon: User,
          badge: "Booking",
          desc: "Self Service & Medical Records"
        }
      ]
    },
    {
      title: "GOVERNANCE & AUDIT",
      items: [
        {
          id: "admin",
          label: "Hospital Admin",
          icon: ShieldCheck,
          badge: "RBAC & Logs",
          desc: "Security, Logs & Operations"
        }
      ]
    }
  ];

  const handleSelectRole = (roleId) => {
    setCurrentRole(roleId);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#E0FBFC] text-[#253237] flex flex-col md:flex-row selection:bg-[#C2DFE3] selection:text-[#253237] overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* MOBILE HEADER (Visible only on small screens)                             */}
      {/* ========================================================================= */}
      <div className="md:hidden bg-[#253237] text-white px-4 py-3 flex items-center justify-between border-b border-[#5C6B73] sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 bg-[#1b2428] hover:bg-[#5C6B73] text-[#E0FBFC] rounded-xl border border-[#5C6B73] cursor-pointer transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0FBFC] text-[#253237] flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-[#E0FBFC] tracking-tight block">SkinLab Hospital</span>
              <span className="text-[10px] text-[#9DB4C0]">Enterprise AI Clinic</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAIChat(true)}
          className="p-2 bg-[#E0FBFC] text-[#253237] rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
        >
          <Bot className="w-4 h-4" />
          <span>AI</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER BACKDROP                                                    */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-[#253237]/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT SIDE PANEL (STRUCTURE MATCHING REFERENCE POULTRY APP)                */}
      {/* ========================================================================= */}
      <aside 
        className={`
          fixed md:sticky top-0 h-screen z-50 md:z-20
          bg-[#FBF9F5] text-[#253237] border-r border-[#C2DFE3] shadow-xl md:shadow-none
          flex flex-col justify-between transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-72 sm:w-80 translate-x-0" : "w-0 -translate-x-full md:w-0 overflow-hidden border-none"}
          ${mobileDrawerOpen ? "translate-x-0 w-72 sm:w-80" : "max-md:-translate-x-full"}
        `}
      >
        {/* SIDEBAR SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          
          {/* 1. Header / Brand Title with Close Button */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#253237] text-[#E0FBFC] flex items-center justify-center font-black shadow-md shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-base sm:text-lg text-[#253237] leading-tight tracking-tight">
                  SkinLab Hospital
                </h1>
                <p className="text-xs text-[#5C6B73] font-semibold">
                  Aesthetic & Clinical AI
                </p>
              </div>
            </div>

            {/* Close Sidebar Button (Mobile drawer close & Desktop collapse) */}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                setSidebarOpen(false);
              }}
              className="p-1.5 rounded-xl text-[#5C6B73] hover:text-[#253237] hover:bg-[#E0FBFC] transition-colors cursor-pointer"
              title="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. User Profile Card (Rounded Box matching Reference Screenshot) */}
          <div className="p-3.5 bg-[#EAE5D9]/70 rounded-2xl border border-[#D5CEBF] flex items-center gap-3 transition-all">
            <div className={`w-11 h-11 rounded-full ${activeProfile.avatarBg} text-white flex items-center justify-center font-black text-sm shadow-inner shrink-0`}>
              {activeProfile.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold text-sm text-[#253237] truncate">
                {activeProfile.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <p className="text-[11px] text-[#5C6B73] font-semibold truncate">
                  {activeProfile.role}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Navigation Sections with Category Headings */}
          <nav className="space-y-6">
            {navCategories.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                {/* Category Header */}
                <div className="text-[11px] font-black uppercase tracking-wider text-[#5C6B73] px-3">
                  {section.title}
                </div>

                {/* Section Items */}
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentRole === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectRole(item.id)}
                        className={`
                          w-full p-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group cursor-pointer
                          ${
                            isActive
                              ? "bg-[#253237] text-white shadow-md"
                              : "text-[#253237] hover:bg-[#EAE5D9]/60 hover:text-[#253237]"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#E0FBFC]" : "text-[#5C6B73] group-hover:text-[#253237]"}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#E0FBFC] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* AI & Intelligence Section */}
            <div className="space-y-2 pt-2 border-t border-[#D5CEBF]">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#5C6B73] px-3">
                INTELLIGENCE & ASSISTANT
              </div>

              <button
                onClick={() => {
                  setShowAIChat(true);
                  setMobileDrawerOpen(false);
                }}
                className="w-full p-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between text-[#253237] hover:bg-[#E0FBFC] group cursor-pointer border border-[#C2DFE3]"
              >
                <div className="flex items-center gap-3.5">
                  <Bot className="w-5 h-5 text-teal-800 group-hover:rotate-12 transition-transform" />
                  <span>AI Clinical Agent</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-[10px] font-black">
                  Online
                </span>
              </button>
            </div>
          </nav>

        </div>

        {/* 4. Bottom Footer / Quick System Info */}
        <div className="p-4 border-t border-[#D5CEBF] bg-[#F4F0E8] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5C6B73]">
            <span className="font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> System Active
            </span>
            <span className="font-bold text-[#253237]">v2.4 Enterprise</span>
          </div>
          <p className="text-[10px] text-[#5C6B73] leading-tight">
            Role-Based Access • Non-Reusable Tokens • Audited Prescriptions
          </p>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA WITH FLOATING/TOP COLLAPSE TOGGLE BAR                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Workspace Top Toolbar with Sidebar Toggle & View Indicators */}
        <header className="bg-white/80 backdrop-blur-md border-b border-[#C2DFE3] px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          
          {/* Left: Sidebar Toggle Button & Current View Title */}
          <div className="flex items-center gap-3.5">
            {/* Boxed Sidebar Toggle Button (Arrow / Horizontal Lines) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl bg-[#253237] hover:bg-[#1b2428] text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
              title={sidebarOpen ? "Collapse Side Panel (Full Screen)" : "Expand Side Panel"}
            >
              <Menu className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">
                {sidebarOpen ? "Full Screen" : "Side Panel"}
              </span>
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4 text-[#E0FBFC] group-hover:-translate-x-0.5 transition-transform" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#E0FBFC] group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>

            {/* Current Active Workspace Breadcrumb */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5C6B73]">Workspace</span>
                <span className="text-xs text-[#5C6B73]">/</span>
                <span className="text-sm font-black text-[#253237]">
                  {currentRole === "receptionist" && "Receptionist Desk & Triage"}
                  {currentRole === "doctor" && "Doctor Chamber & Consultations"}
                  {currentRole === "patient" && "Patient Portal & Booking"}
                  {currentRole === "admin" && "Hospital Administration & Governance"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: AI Quick Trigger & Fullscreen Indicator */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowAIChat(true)}
              className="px-3.5 py-1.5 bg-[#253237] hover:bg-[#1b2428] text-[#E0FBFC] text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
            >
              <Bot className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline">Ask AI Assistant</span>
            </button>
          </div>

        </header>

        {/* Workspace Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {currentRole === "receptionist" && <ReceptionistView />}
          {currentRole === "doctor" && <DoctorView />}
          {currentRole === "patient" && (
            <PatientPortal 
              patientId={activePatientId} 
              onPatientChange={setActivePatientId} 
              onOpenAI={() => setShowAIChat(true)} 
            />
          )}
          {currentRole === "admin" && <AdminView />}
        </main>

        {/* Governed AI Assistant Chat Modal */}
        <AIChatModal
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          activePatientId={activePatientId}
          onBookingConfirmed={() => {}}
        />

        {/* Floating AI Agent Trigger Button (Bottom Right) */}
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#253237] text-[#E0FBFC] shadow-2xl border-2 border-[#E0FBFC] hover:scale-105 transition-all flex items-center gap-2.5 font-bold group cursor-pointer"
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

    </div>
  );
}
