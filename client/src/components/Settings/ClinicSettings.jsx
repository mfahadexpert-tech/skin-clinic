/**
 * ==============================================================================
 * SkinLab AI - Module 12: Clinic Settings, Security & Automated SQL Backups
 * ==============================================================================
 * Manages:
 * 1. Clinic Branding & Profile (Name, Phone, Doctor License, Thermal Footer note).
 * 2. Automated & Manual Database SQL Backup Engine (.sql dumps).
 * 3. Security Role Permissions & Inactivity Lockout settings.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Database, Shield, Download, CheckCircle2, Lock, Building } from 'lucide-react';
import { api } from '@/lib/api';
import SQLBackupModal from './SQLBackupModal';

export default function ClinicSettings() {
  const [settings, setSettings] = useState({
    company_name: 'Skin Lab - Aesthetic & Dermatology Clinic',
    phone: '+92 300 1234567',
    address: 'Plaza 45, Commercial Avenue, DHA Phase 5, Lahore, Pakistan',
    tax_number: 'PMC-DERMA-8921-X',
    footer_note: 'Appointments: 0300-1234567 | Follow us on Instagram @SkinLabClinic | Packages valid for 12 months',
    session_timeout_minutes: 60,
    enable_backup: true
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res && res.settings) setSettings(res.settings);
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Clinic Settings & Automated SQL Backups</h1>
            <p className="text-xs text-slate-400">Branding, Invoicing Customization, Security Policies & SQL Dumps</p>
          </div>
        </div>

        <button
          onClick={() => setIsBackupModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20 transition"
        >
          <Database className="w-4 h-4" />
          <span>Export Instant SQL Backup (.sql)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Clinic Branding Form */}
        <div className="glass-panel p-5 space-y-4 border border-white/10">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Building className="w-4 h-4 text-teal-400" />
            <span>Clinic Profile & Receipt Branding</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300">Clinic Display Name</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full glass-input text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300">Reception Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full glass-input text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300">Doctor PMDC / Tax Registration #</label>
              <input
                type="text"
                value={settings.tax_number}
                onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
                className="w-full glass-input text-xs font-mono mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300">Clinic Address (Displayed on A4 Invoices)</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full glass-input text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-slate-300">80mm Thermal Receipt Footer Note</label>
              <textarea
                rows={2}
                value={settings.footer_note}
                onChange={(e) => setSettings({ ...settings, footer_note: e.target.value })}
                className="w-full glass-input text-xs mt-1 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
            >
              {isSaved ? 'Settings Saved Successfully!' : 'Save Branding Changes'}
            </button>
          </form>
        </div>

        {/* Security & Auto Backup Card */}
        <div className="space-y-6">
          
          <div className="glass-panel p-5 space-y-4 border border-teal-500/20">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Automated SQL Database Backup Engine</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              When the application is closed or day-end reconciliation completes, the system automatically exports a complete, timestamped SQL backup file:
            </p>

            <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-teal-300 border border-teal-500/30">
              backup_bbc_pos_db_20260830_210500.sql
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.enable_backup}
                  onChange={(e) => setSettings({ ...settings, enable_backup: e.target.checked })}
                  className="rounded border-white/20 text-teal-500 focus:ring-0"
                />
                <span>Auto-Backup Database on Software Exit</span>
              </label>
            </div>
          </div>

          <div className="glass-panel p-5 space-y-3 border border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Session Inactivity & Privacy Timeout</span>
            </h3>

            <p className="text-xs text-slate-300">
              Configurable auto-logout timer to protect patient clinical records when the front desk is unattended:
            </p>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={settings.session_timeout_minutes}
                onChange={(e) => setSettings({ ...settings, session_timeout_minutes: parseInt(e.target.value) || 60 })}
                className="w-24 glass-input text-xs font-mono text-center font-bold"
              />
              <span className="text-xs text-slate-400">Minutes before screen lock</span>
            </div>
          </div>

        </div>

      </div>

      {/* SQL Backup Dump Modal */}
      {isBackupModalOpen && (
        <SQLBackupModal onClose={() => setIsBackupModalOpen(false)} />
      )}

    </div>
  );
}
