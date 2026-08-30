/**
 * ==============================================================================
 * SkinLab AI - Main Single Page Application (SPA) Controller
 * Complete Modern UI/UX Layout with Interactive Calendar, Overview & POS
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
import { outboxManager } from '@/lib/outbox';

export default function SkinLabApp() {
  // Navigation & Theme States
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'calendar', 'pos', 'prm', 'ai-doctor', 'voice-agent', 'whatsapp', 'reports', 'catalog', 'hrm', 'purchases', 'settings'
  const [currentRole, setCurrentRole] = useState('doctor'); // 'admin', 'doctor', 'manager', 'cashier'
  const [isDarkMode, setIsDarkMode] = useState(false); // Default clean light theme like WellNest, togglable
  const [isOffline, setIsOffline] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);

  // Clinic Core Data Stores
  const [patients, setPatients] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [sales, setSales] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [injectedSessionRemarks, setInjectedSessionRemarks] = useState('');

  // Initial Load from Python FastAPI Backend
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
      console.warn("[App] Initial load error or backend starting up:", e);
    }
  };

  useEffect(() => {
    refreshClinicData();
    const count = outboxManager.getPendingQueue().length;
    setOutboxCount(count);
  }, []);

  // Handle Checkout Action
  const handleCheckout = async (salePayload) => {
    if (isOffline) {
      outboxManager.enqueueAction('create_sale', salePayload);
      setOutboxCount(outboxManager.getPendingQueue().length);
      alert('Application is in Offline Mode. Sale successfully queued in Outbox.');
      return { success: true, sale: { ...salePayload, invoice_number: 'INV-OFFLINE-01', token_number: 'P-OFF' } };
    }

    try {
      const result = await api.createSale(salePayload);
      await refreshClinicData();
      return result;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Handle Session Redemption Action
  const handleRedeemSession = async (redeemPayload) => {
    if (isOffline) {
      outboxManager.enqueueAction('redeem_session', redeemPayload);
      setOutboxCount(outboxManager.getPendingQueue().length);
      alert('Redemption queued in Outbox.');
      return { success: true };
    }

    try {
      const result = await api.redeemSession(redeemPayload);
      await refreshClinicData();
      return result;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Handle Patient Registration Action
  const handleRegisterPatient = async (patientPayload) => {
    if (isOffline) {
      outboxManager.enqueueAction('register_patient', patientPayload);
      setOutboxCount(outboxManager.getPendingQueue().length);
      const tempPatient = { id: Date.now(), mrn: '0099-08-2026', ...patientPayload, visit_count: 0, current_balance: 0, advance_balance: 0 };
      setPatients(prev => [tempPatient, ...prev]);
      return { success: true, patient: tempPatient };
    }

    try {
      const result = await api.registerPatient(patientPayload);
      await refreshClinicData();
      return result;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Handle Adding New Appointment
  const handleAddAppointment = (newAppt) => {
    setAppointments(prev => [newAppt, ...prev]);
  };

  // Sync Outbox Queue
  const handleSyncOutbox = async () => {
    const result = await outboxManager.flushQueue(api);
    setOutboxCount(result.remainingCount);
    await refreshClinicData();
    alert(`Outbox Synced: ${result.syncedCount} records sent to server.`);
  };

  // Inject AI Note into POS Remarks
  const handleInjectAINoteToPOS = (noteText) => {
    setInjectedSessionRemarks(noteText);
    setActiveTab('pos');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 min-h-screen pb-16 transition-colors duration-200">
        
        {/* Navigation Bar */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          isOffline={isOffline}
          setIsOffline={setIsOffline}
          outboxCount={outboxCount}
          onSyncOutbox={handleSyncOutbox}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          
          {activeTab === 'overview' && (
            <OverviewDashboard
              patients={patients}
              doctors={doctors}
              sales={sales}
              appointments={appointments}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarManager
              appointments={appointments}
              doctors={doctors}
              patients={patients}
              onAddAppointment={handleAddAppointment}
            />
          )}

          {activeTab === 'pos' && (
            <POSTerminal
              patients={patients}
              products={products}
              deals={deals}
              doctors={doctors}
              onCheckout={handleCheckout}
              onRegisterPatient={handleRegisterPatient}
              isOffline={isOffline}
            />
          )}

          {activeTab === 'prm' && (
            <PatientDirectory
              patients={patients}
              onRedeemSession={handleRedeemSession}
              onRegisterPatient={handleRegisterPatient}
            />
          )}

          {activeTab === 'ai-doctor' && (
            <DoctorAssistant
              patients={patients}
              onInjectNotes={handleInjectAINoteToPOS}
            />
          )}

          {activeTab === 'voice-agent' && (
            <VoiceBookingAgent />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppHub
              patients={patients}
            />
          )}

          {activeTab === 'reports' && (
            <AnalyticsDashboard />
          )}

          {activeTab === 'catalog' && (
            <ServicesMaster />
          )}

          {activeTab === 'hrm' && (
            <StaffDirectory />
          )}

          {activeTab === 'purchases' && (
            <SupplierPurchases sales={sales} />
          )}

          {activeTab === 'settings' && (
            <ClinicSettings />
          )}

        </main>

      </div>
    </div>
  );
}
