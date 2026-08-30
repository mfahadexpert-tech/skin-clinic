/**
 * ==============================================================================
 * SkinLab AI - Master Application Frame (DocuVerse & Youcare UI Master)
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import OverviewDashboard from '@/components/Overview/OverviewDashboard';
import CalendarManager from '@/components/Calendar/CalendarManager';
import POSTerminal from '@/components/POS/POSTerminal';
import PatientDirectory from '@/components/PRM/PatientDirectory';
import DoctorAssistant from '@/components/AI/DoctorAssistant';
import VoiceBookingAgent from '@/components/AI/VoiceBookingAgent';
import WhatsAppHub from '@/components/AI/WhatsAppHub';
import AnalyticsDashboard from '@/components/Reports/AnalyticsDashboard';
import ServicesMaster from '@/components/Catalog/ServicesMaster';
import StaffDirectory from '@/components/HRM/StaffDirectory';
import SupplierPurchases from '@/components/Purchases/SupplierPurchases';
import ClinicSettings from '@/components/Settings/ClinicSettings';
import { api } from '@/lib/api';

export default function SkinLabApp() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'ai-doctor', 'prm', 'calendar', 'pos', 'voice-agent', 'whatsapp', 'reports', 'settings'

  // Data Stores
  const [patients, setPatients] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [sales, setSales] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Load clinic data
  const refreshClinicData = async () => {
    try {
      const posData = await api.getPOSOverview();
      if (posData && posData.products) {
        setProducts(posData.products);
        setDeals(posData.deals || []);
        setDoctors(posData.doctors || []);
      }

      const patientData = await api.listPatients();
      if (patientData && patientData.patients) {
        setPatients(patientData.patients);
      }

      const salesData = await api.getSalesBook();
      if (salesData && salesData.invoices) {
        setSales(salesData.invoices);
      }

      const apptData = await api.getCalendarSchedule();
      if (apptData && apptData.appointments) {
        setAppointments(apptData.appointments);
      }
    } catch (e) {
      console.warn("[App] Initial load:", e);
    }
  };

  useEffect(() => {
    refreshClinicData();
  }, []);

  const handleCheckout = async (salePayload) => {
    const result = await api.createSale(salePayload);
    await refreshClinicData();
    return result;
  };

  const handleRedeemSession = async (redeemPayload) => {
    const result = await api.redeemSession(redeemPayload);
    await refreshClinicData();
    return result;
  };

  const handleRegisterPatient = async (patientPayload) => {
    const result = await api.registerPatient(patientPayload);
    await refreshClinicData();
    return result;
  };

  return (
    <div className="min-h-screen bg-[#eaf0ee] p-4 sm:p-8 flex items-center justify-center font-sans">
      
      {/* DocuVerse Main Card Frame */}
      <div className="docuverse-frame w-full max-w-[1440px] flex flex-col md:flex-row overflow-hidden border border-slate-200/80 shadow-2xl">
        
        {/* Left Sidebar (DocuVerse Exact Menu & AI Card) */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Right Main Content View */}
        <main className="flex-1 p-6 md:p-8 bg-[#fdfdfd] overflow-y-auto max-h-[92vh]">
          
          {/* TAB 1: Overview Dashboard (DocuVerse Image 1) */}
          {activeTab === 'overview' && (
            <OverviewDashboard
              patients={patients}
              doctors={doctors}
              sales={sales}
              onNavigate={setActiveTab}
            />
          )}

          {/* TAB 2: Appointment Calendar (Youcare Image 2) */}
          {activeTab === 'calendar' && (
            <CalendarManager
              appointments={appointments}
              doctors={doctors}
              patients={patients}
            />
          )}

          {/* TAB 3: POS Billing */}
          {activeTab === 'pos' && (
            <POSTerminal
              patients={patients}
              products={products}
              deals={deals}
              doctors={doctors}
              onCheckout={handleCheckout}
              onRegisterPatient={handleRegisterPatient}
            />
          )}

          {/* TAB 4: Patient PRM */}
          {activeTab === 'prm' && (
            <PatientDirectory
              patients={patients}
              onRedeemSession={handleRedeemSession}
              onRegisterPatient={handleRegisterPatient}
            />
          )}

          {/* TAB 5: Doctor AI Assistant */}
          {activeTab === 'ai-doctor' && (
            <DoctorAssistant
              patients={patients}
              onInjectNotes={() => setActiveTab('pos')}
            />
          )}

          {/* TAB 6: Voice Booking Agent */}
          {activeTab === 'voice-agent' && (
            <VoiceBookingAgent />
          )}

          {/* TAB 7: WhatsApp Hub */}
          {activeTab === 'whatsapp' && (
            <WhatsAppHub patients={patients} />
          )}

          {/* TAB 8: Reports */}
          {activeTab === 'reports' && (
            <AnalyticsDashboard />
          )}

          {/* TAB 9: Settings */}
          {activeTab === 'settings' && (
            <ClinicSettings />
          )}

        </main>

      </div>

    </div>
  );
}
