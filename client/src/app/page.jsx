/**
 * ==============================================================================
 * SkinLab AI - Main Single Page Application (SPA) Controller
 * ==============================================================================
 * Unifies all 12 modules, AI Suite, and RBAC Permission Security:
 * - Module 1: Production Authentication & Role-Based Access Control (RBAC)
 * - Module 2 & 11: Real-time Analytics & Machine ROI Reports
 * - Module 3: POS Treatment Billing Terminal & Dual-Format Receipting
 * - Module 4: Sales History & Invoicing
 * - Module 5 & 9: Services Master, Bundles & Barcode Labels
 * - Module 6: Patient PRM & Session Redemption Lifecycle (Full CRUD)
 * - Module 7 & 8: SRM Purchases & Treatment Refund Auditor
 * - Module 10: HRM & Practitioner Directory (Full Doctor CRUD - Add, Edit, Delete)
 * - Module 12: Clinic Settings & SQL Backups
 * - Reception Calendar: Full interactive Appointments Calendar with Edit Schedule Modal
 * - AI Suite: LangGraph Doctor Assistant, Voice Booking Simulator, WhatsApp Center
 * - Offline Outbox Synchronization Pattern (PWA)
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import POSTerminal from '@/components/POS/POSTerminal';
import PatientDirectory from '@/components/PRM/PatientDirectory';
import AppointmentCalendar from '@/components/Calendar/AppointmentCalendar';
import DoctorAssistant from '@/components/AI/DoctorAssistant';
import VoiceBookingAgent from '@/components/AI/VoiceBookingAgent';
import WhatsAppHub from '@/components/AI/WhatsAppHub';
import AnalyticsDashboard from '@/components/Reports/AnalyticsDashboard';
import ServicesMaster from '@/components/Catalog/ServicesMaster';
import StaffDirectory from '@/components/HRM/StaffDirectory';
import SupplierPurchases from '@/components/Purchases/SupplierPurchases';
import ClinicSettings from '@/components/Settings/ClinicSettings';
import { AuthProvider, ROLE_PERMISSIONS, PermissionDeniedScreen } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { outboxManager } from '@/lib/outbox';

function MainClinicContent() {
  const [activeTab, setActiveTab] = useState('pos');
  const [currentRole, setCurrentRole] = useState('admin');
  const [isOffline, setIsOffline] = useState(false);
  const [outboxCount, setOutboxCount] = useState(0);

  const [patients, setPatients] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [sales, setSales] = useState([]);

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
    } catch (e) {
      console.warn("[App] Initial load error or backend starting up:", e);
    }
  };

  useEffect(() => {
    refreshClinicData();
    const count = outboxManager.getPendingQueue().length;
    setOutboxCount(count);
  }, []);

  const handleCheckout = async (salePayload) => {
    if (isOffline) {
      outboxManager.enqueueAction('create_sale', salePayload);
      setOutboxCount(outboxManager.getPendingQueue().length);
      alert('Application is in Offline Mode. Sale queued in local Outbox.');
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

  const handleRegisterPatient = async (patientPayload) => {
    if (isOffline) {
      outboxManager.enqueueAction('register_patient', patientPayload);
      setOutboxCount(outboxManager.getPendingQueue().length);
      const tempPatient = { id: Date.now(), mrn: '0099-08-2026', ...patientPayload, visit_count: 0, current_balance: 0, advance_balance: 2000 };
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

  const handleDeletePatient = async (patientId) => {
    try {
      await api.deletePatient(patientId);
      await refreshClinicData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterDoctor = async (doctorPayload) => {
    try {
      const result = await api.createDoctor(doctorPayload);
      await refreshClinicData();
      return result;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      await api.deleteDoctor(doctorId);
      await refreshClinicData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncOutbox = async () => {
    const result = await outboxManager.flushQueue(api);
    setOutboxCount(result.remainingCount);
    await refreshClinicData();
    alert(`Outbox Synced: ${result.syncedCount} records sent to server.`);
  };

  // RBAC Permission Guard
  const allowedRoles = ROLE_PERMISSIONS[activeTab] || [];
  const isTabPermitted = allowedRoles.includes(currentRole.toLowerCase()) || currentRole.toLowerCase() === 'owner';

  return (
    <div className="min-h-screen pb-12">
      
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        outboxCount={outboxCount}
        onSyncOutbox={handleSyncOutbox}
      />

      {/* Main Content Switcher with RBAC Security Guard */}
      <main className="max-w-7xl mx-auto px-4">
        
        {!isTabPermitted ? (
          <PermissionDeniedScreen
            requiredRoles={allowedRoles}
            onSwitchRole={(role) => setCurrentRole(role)}
          />
        ) : (
          <>
            {activeTab === 'pos' && (
              <POSTerminal
                patients={patients}
                products={products}
                deals={deals}
                doctors={doctors}
                onCheckout={handleCheckout}
                onRegisterPatient={handleRegisterPatient}
                onRegisterDoctor={handleRegisterDoctor}
                isOffline={isOffline}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentCalendar />
            )}

            {activeTab === 'prm' && (
              <PatientDirectory
                patients={patients}
                onRedeemSession={handleRedeemSession}
                onRegisterPatient={handleRegisterPatient}
                onDeletePatient={handleDeletePatient}
              />
            )}

            {activeTab === 'ai-doctor' && (
              <DoctorAssistant
                patients={patients}
                onInjectNotes={(text) => setActiveTab('pos')}
              />
            )}

            {activeTab === 'voice-agent' && (
              <VoiceBookingAgent />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppHub patients={patients} />
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
          </>
        )}

      </main>

    </div>
  );
}

export default function SkinLabApp() {
  return (
    <AuthProvider>
      <MainClinicContent />
    </AuthProvider>
  );
}
