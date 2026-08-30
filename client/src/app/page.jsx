/**
 * ==============================================================================
 * SkinLab AI - Main Single Page Application (SPA) Controller
 * Implementing DocuVerse & Youcare Medical UI/UX Design System
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
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'calendar', 'pos', 'prm', 'ai-doctor', 'hrm', 'reports', 'settings'
  const [currentRole, setCurrentRole] = useState('doctor');
  const [isOffline, setIsOffline] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);

  // Clinic Core Data Stores
  const [patients, setPatients] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [sales, setSales] = useState([]);
  const [appointments, setAppointments] = useState([]);

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
      console.warn("[App] Initial load from backend:", e);
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
      alert('Sale saved in Offline Outbox.');
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

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      
      {/* 1. DocuVerse Sidebar & Header */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
      />

      {/* 2. Main Content View Area (Padded for Left Sidebar) */}
      <main className="pl-64 pr-8 pb-16 pt-2">
        <div className="max-w-[1440px] mx-auto">
          
          {activeTab === 'overview' && (
            <OverviewDashboard
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarManager
              appointments={appointments}
              doctors={doctors}
              patients={patients}
              onAddAppointment={(newAppt) => setAppointments(prev => [newAppt, ...prev])}
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

          {activeTab === 'hrm' && (
            <StaffDirectory />
          )}

          {activeTab === 'reports' && (
            <AnalyticsDashboard />
          )}

          {activeTab === 'settings' && (
            <ClinicSettings />
          )}

          {activeTab === 'ai-doctor' && (
            <DoctorAssistant
              patients={patients}
              onInjectNotes={(notes) => setActiveTab('pos')}
            />
          )}

        </div>
      </main>

    </div>
  );
}
