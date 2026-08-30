/**
 * ==============================================================================
 * SkinLab AI - Module 6: Patient Directory & PRM (Simplified & Easy UI)
 * ==============================================================================
 * - Clean layout with Patient ID, Name, Phone, Skin Tone, Wallet & Dues.
 * - Simple Action button: [View History & Redeem Session].
 * - Easy walk-in patient form with simple terms.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  History, 
  Phone,
  Image as ImageIcon
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
  const [skinType, setSkinType] = useState('Medium Asian Skin');
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
    <div className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Patient Records & Packages</h1>
            <p className="text-xs text-slate-400">Package tracking, wallet balances & visit history</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Patient</span>
        </button>
      </div>

      {/* Patient Table */}
      <div className="glass-panel p-5 space-y-4">
        
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patient by Name, Phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input pl-8 text-xs py-2"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Total: <strong>{filteredPatients.length}</strong> Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Patient Details</th>
                <th className="py-2.5 px-3">Skin Tone</th>
                <th className="py-2.5 px-3 text-right">Advance Wallet</th>
                <th className="py-2.5 px-3 text-right">Remaining Due</th>
                <th className="py-2.5 px-3 text-center">Session Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-800/40 transition">
                  
                  {/* ID */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                      {patient.mrn}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-white text-sm">{patient.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-teal-400" />
                      <span>{patient.phone}</span>
                      <span className="text-slate-500">• {patient.visit_count || 0} visits</span>
                    </div>
                  </td>

                  {/* Skin Tone */}
                  <td className="py-3 px-3">
                    <span className="text-xs text-slate-300">
                      {patient.skin_type || 'Medium Asian'}
                    </span>
                  </td>

                  {/* Wallet */}
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono font-bold ${
                      patient.advance_balance > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      PKR {patient.advance_balance?.toLocaleString() || '0.00'}
                    </span>
                  </td>

                  {/* Due */}
                  <td className="py-3 px-3 text-right">
                    {patient.current_balance > 0 ? (
                      <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                        PKR {patient.current_balance?.toLocaleString()} Due
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-400 font-medium">
                        PKR 0.00
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setSelectedPatientForHistory(patient)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm transition"
                      >
                        <History className="w-3 h-3" />
                        <span>Redeem Sessions</span>
                      </button>

                      <button
                        onClick={() => setSelectedPatientForGallery(patient)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
                        title="View Before & After photos"
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

      {/* MODAL 1: Session Redemption */}
      {selectedPatientForHistory && (
        <SessionRedeemModal
          patient={selectedPatientForHistory}
          onClose={() => setSelectedPatientForHistory(null)}
          onRedeem={onRedeemSession}
        />
      )}

      {/* MODAL 2: Before & After */}
      {selectedPatientForGallery && (
        <BeforeAfterGallery
          patient={selectedPatientForGallery}
          onClose={() => setSelectedPatientForGallery(null)}
        />
      )}

      {/* MODAL 3: New Patient Form */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>Register New Patient</span>
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
                <label className="text-slate-300">Phone Number *</label>
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
                <label className="text-slate-300">Skin Tone</label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  <option value="Fair Skin">Fair Skin</option>
                  <option value="Medium Asian Skin">Medium Asian Skin</option>
                  <option value="Olive / Darker Asian">Olive / Darker Asian</option>
                  <option value="Brown Skin">Brown Skin</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300">Skin Sensitivities / Allergies (Optional)</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Sensitive to strong peels"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(false)}
                  className="px-3 py-1.5 text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg"
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
