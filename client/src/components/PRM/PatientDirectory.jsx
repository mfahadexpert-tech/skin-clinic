/**
 * ==============================================================================
 * SkinLab AI - Module 6: Patient Records & PRM Directory
 * High Contrast DocuVerse Redesign
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
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="docu-card p-6 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Patient Records & Multi-Session Tracking</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Medical records, session redemption & clinical balance management</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Patient</span>
        </button>
      </div>

      {/* Patient List Card */}
      <div className="docu-card p-6 space-y-4 bg-white">
        
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search patient by Name, Phone, or MRN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-[#0f172a] font-medium outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-600">
            Total: {filteredPatients.length} Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3">Patient Details</th>
                <th className="py-2.5 px-3">Skin Tone</th>
                <th className="py-2.5 px-3 text-right">Advance Wallet</th>
                <th className="py-2.5 px-3 text-right">Remaining Due</th>
                <th className="py-2.5 px-3 text-center">Session Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition">
                  
                  {/* ID */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {patient.mrn}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3.5 px-3">
                    <div className="font-extrabold text-[#0f172a] text-sm">{patient.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{patient.phone}</span>
                      <span>• {patient.visit_count || 0} visits</span>
                    </div>
                  </td>

                  {/* Skin Tone */}
                  <td className="py-3.5 px-3">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {patient.skin_type || 'Medium Asian'}
                    </span>
                  </td>

                  {/* Wallet */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 text-sm">
                    PKR {patient.advance_balance?.toLocaleString() || '0'}
                  </td>

                  {/* Due */}
                  <td className="py-3.5 px-3 text-right">
                    {patient.current_balance > 0 ? (
                      <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 text-xs">
                        PKR {patient.current_balance?.toLocaleString()} Due
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400 font-medium">PKR 0</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={() => setSelectedPatientForHistory(patient)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                    >
                      Redeem Sessions
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Session Redemption Modal */}
      {selectedPatientForHistory && (
        <SessionRedeemModal
          patient={selectedPatientForHistory}
          onClose={() => setSelectedPatientForHistory(null)}
          onRedeem={onRedeemSession}
        />
      )}

    </div>
  );
}
