/**
 * ==============================================================================
 * SkinLab AI - Module 6: Patient Relationship Management (PRM) & Session Tracking
 * ==============================================================================
 * Manages:
 * 1. Formatted Medical ID (MRN: 0001-MM-YYYY) for clinical record keeping.
 * 2. Advance Deposit Wallet (`advance_balance`) & Outstanding Dues (`current_balance`).
 * 3. Opening "Patient Visits & Session Redemption Dialog" (`receive_payment_dialog`).
 * 4. Before & After photo gallery view.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  History, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  Sparkles,
  Phone,
  Calendar
} from 'lucide-react';
import SessionRedeemModal from './SessionRedeemModal';
import BeforeAfterGallery from './BeforeAfterGallery';

export default function PatientDirectory({ patients, onRedeemSession, onRegisterPatient }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [selectedPatientForGallery, setSelectedPatientForGallery] = useState(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  // New Patient Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [skinType, setSkinType] = useState('Fitzpatrick Type III');
  const [allergies, setAllergies] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.mrn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    await onRegisterPatient({ name, phone, email, skin_type: skinType, allergies });
    setIsAddPatientOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAllergies('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top PRM Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Patient Directory & Clinical PRM</h1>
            <p className="text-xs text-slate-400">Multi-Session Package Tracking, Advance Wallets & Medical Records</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-teal-500/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add New Patient Record</span>
        </button>
      </div>

      {/* Search & Patient Table */}
      <div className="glass-panel p-5 space-y-4">
        
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Patient Full Name, Phone Number, or MRN (e.g. 0001-08-2026)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing <strong>{filteredPatients.length}</strong> Registered Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Medical ID (MRN)</th>
                <th className="py-3 px-3">Patient Details</th>
                <th className="py-3 px-3">Skin Phototype</th>
                <th className="py-3 px-3 text-right">Advance Wallet</th>
                <th className="py-3 px-3 text-right">Current Balance</th>
                <th className="py-3 px-3 text-center">Actions & History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-800/40 transition">
                  
                  {/* MRN */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-1 rounded border border-teal-500/30">
                      {patient.mrn}
                    </span>
                  </td>

                  {/* Name & Phone */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white text-sm">{patient.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-teal-400" />
                      <span>{patient.phone}</span>
                      <span className="text-slate-500">• Visits: {patient.visit_count || 0}</span>
                    </div>
                  </td>

                  {/* Skin Type */}
                  <td className="py-3.5 px-3">
                    <span className="text-[11px] text-slate-300">
                      {patient.skin_type || 'Fitzpatrick Type III'}
                    </span>
                  </td>

                  {/* Advance Wallet */}
                  <td className="py-3.5 px-3 text-right">
                    <span className={`font-mono font-bold ${
                      patient.advance_balance > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      PKR {patient.advance_balance?.toLocaleString() || '0.00'}
                    </span>
                  </td>

                  {/* Current Balance Dues */}
                  <td className="py-3.5 px-3 text-right">
                    {patient.current_balance > 0 ? (
                      <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                        PKR {patient.current_balance?.toLocaleString()} Due
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400">
                        PKR 0.00
                      </span>
                    )}
                  </td>

                  {/* Actions: History & Session Redemption */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedPatientForHistory(patient)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-slate-950 border border-teal-500/30 transition shadow-sm"
                        title="Open Session Redemption & Visits Dialog"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>[History & Sessions]</span>
                      </button>

                      <button
                        onClick={() => setSelectedPatientForGallery(patient)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition"
                        title="View Before & After clinical photo gallery"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL 1: Interactive Patient Visits & Session Redemption Dialog (receive_payment_dialog) */}
      {selectedPatientForHistory && (
        <SessionRedeemModal
          patient={selectedPatientForHistory}
          onClose={() => setSelectedPatientForHistory(null)}
          onRedeem={onRedeemSession}
        />
      )}

      {/* MODAL 2: Before & After Clinical Comparison Gallery */}
      {selectedPatientForGallery && (
        <BeforeAfterGallery
          patient={selectedPatientForGallery}
          onClose={() => setSelectedPatientForGallery(null)}
        />
      )}

      {/* MODAL 3: New Patient Registration */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>Register New Patient Profile</span>
              </h3>
              <button onClick={() => setIsAddPatientOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300">Contact Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-slate-300">Fitzpatrick Skin Phototype</label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  <option value="Fitzpatrick Type I">Type I - Extremely Fair</option>
                  <option value="Fitzpatrick Type II">Type II - Fair Caucasian</option>
                  <option value="Fitzpatrick Type III">Type III - Medium Asian / Brown</option>
                  <option value="Fitzpatrick Type IV">Type IV - Olive / Dark Asian</option>
                  <option value="Fitzpatrick Type V">Type V - Dark Brown Skin</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300">Documented Allergies / Pre-existing Conditions</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Sensitive to AHA peels, no keloids"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(false)}
                  className="px-3 py-1.5 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-md"
                >
                  Create Patient MRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
