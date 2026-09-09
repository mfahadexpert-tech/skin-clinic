/**
 * ==============================================================================
 * SkinLab AI - Module 6: Patient Directory & PRM (With Add & Delete Options)
 * ==============================================================================
 * - Full CRUD capabilities: Add new patient, Delete patient record.
 * - Package redemption history & wallet view.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  History, 
  Phone,
  Image as ImageIcon,
  Trash2,
  ShoppingCart,
  Stethoscope,
  User,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import SessionRedeemModal from './SessionRedeemModal';
import BeforeAfterGallery from './BeforeAfterGallery';
import { api } from '@/lib/api';
import { hospitalApi } from '@/lib/hospitalApi';

export default function PatientDirectory({ 
  patients = [], 
  onRedeemSession, 
  onRegisterPatient, 
  onDeletePatient,
  onPatientSelected,
  onNavigateTo 
}) {
  const [patientList, setPatientList] = useState(patients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [selectedPatientForGallery, setSelectedPatientForGallery] = useState(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New Patient Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [skinType, setSkinType] = useState('Fitzpatrick Type III (Medium)');
  const [allergies, setAllergies] = useState('');

  const fetchLivePatients = async () => {
    setLoading(true);
    try {
      const data = await hospitalApi.listPatients(200);
      if (Array.isArray(data) && data.length > 0) {
        setPatientList(data);
      }
    } catch (e) {
      console.warn("Could not fetch patients from hospitalApi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patients && patients.length > 0) {
      setPatientList(patients);
    } else {
      fetchLivePatients();
    }
  }, [patients]);

  const filteredPatients = patientList.filter(p => {
    const q = searchQuery.toLowerCase();
    const pName = (p.name || p.full_name || '').toLowerCase();
    const pPhone = p.phone || '';
    const pMrn = (p.mrn || '').toLowerCase();
    const pCnic = (p.cnic || '').toLowerCase();
    return pName.includes(q) || pPhone.includes(q) || pMrn.includes(q) || pCnic.includes(q);
  });

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;
    let created = null;
    if (onRegisterPatient) {
      const res = await onRegisterPatient({ name, phone, email, skin_type: skinType, allergies });
      created = res?.patient || res;
    } else {
      try {
        const dummyCnic = `35202-${Math.floor(1000000 + Math.random() * 9000000)}-1`;
        const res = await hospitalApi.registerPatient({
          full_name: name,
          phone,
          email,
          gender: "female",
          dob: "1995-01-01",
          cnic: dummyCnic,
          address: "Registered via PRM Directory",
          emergency_contact: phone,
          skin_type: skinType,
          allergies: allergies || "No known allergies"
        });
        created = res;
      } catch (err) {
        console.error("Error creating patient in PRM:", err);
      }
    }

    if (created) {
      setPatientList(prev => [created, ...prev]);
    }
    setIsAddPatientOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAllergies('');
  };

  const handleDelete = async (patientId, patientName) => {
    if (confirm(`Are you sure you want to delete patient record for "${patientName}"?`)) {
      if (onDeletePatient) {
        await onDeletePatient(patientId);
      } else {
        try {
          await hospitalApi.deletePatient(patientId);
        } catch (e) {
          await api.deletePatient(patientId);
        }
      }
      setPatientList(prev => prev.filter(p => String(p.id) !== String(patientId)));
      alert(`Patient "${patientName}" deleted.`);
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Patient Records & PRM Directory</h1>
            <p className="text-xs text-slate-600 font-semibold">Authoritative records across POS, Consultations, and Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLivePatients}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setIsAddPatientOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-slate-900 text-white transition-all shadow cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Patient</span>
          </button>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
        
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient by Name, Phone, CNIC, or MRN ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-input pl-9 text-xs py-2"
            />
          </div>
          <span className="text-xs text-slate-600 font-bold whitespace-nowrap">
            Total: <strong className="text-slate-900 font-black">{filteredPatients.length}</strong> Patients
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 text-xs font-black bg-slate-100">
                <th className="py-3 px-3">MRN ID</th>
                <th className="py-3 px-3">Patient Details</th>
                <th className="py-3 px-3">Skin & Allergies</th>
                <th className="py-3 px-3 text-right">Advance Wallet</th>
                <th className="py-3 px-3 text-right">Remaining Due</th>
                <th className="py-3 px-3 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition">
                  
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded border border-emerald-300">
                      {patient.mrn || '0001-08-2026'}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-extrabold text-slate-900 text-sm">{patient.name || patient.full_name}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5 font-semibold">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{patient.phone}</span>
                      <span className="text-slate-400">• {patient.visit_count || 0} visits</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="text-xs font-bold text-slate-800">
                      {patient.skin_type || 'Fitzpatrick Type III'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">
                      {patient.allergies || 'No known allergies'}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="font-mono font-black text-emerald-700">
                      PKR {parseFloat(patient.advance_balance || 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    {parseFloat(patient.current_balance || 0) > 0 ? (
                      <span className="font-mono font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-300">
                        PKR {parseFloat(patient.current_balance).toLocaleString()} Due
                      </span>
                    ) : (
                      <span className="font-mono text-emerald-700 font-bold">
                        PKR 0.00
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      
                      {/* Navigate to POS */}
                      <button
                        onClick={() => {
                          onPatientSelected?.(patient.id);
                          onNavigateTo?.('pos', patient.id);
                        }}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="Bill in POS Terminal"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span className="hidden sm:inline">Bill POS</span>
                      </button>

                      {/* Navigate to Doctor Chamber */}
                      <button
                        onClick={() => {
                          onPatientSelected?.(patient.id);
                          onNavigateTo?.('doctor', patient.id);
                        }}
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-700 hover:text-white text-teal-800 border border-teal-300 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="Open in Doctor Chamber"
                      >
                        <Stethoscope className="w-3 h-3" />
                        <span className="hidden sm:inline">Chamber</span>
                      </button>

                      {/* Navigate to Patient Portal */}
                      <button
                        onClick={() => {
                          onPatientSelected?.(patient.id);
                          onNavigateTo?.('patient', patient.id);
                        }}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-700 hover:text-white text-indigo-800 border border-indigo-300 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        title="View in Patient Portal"
                      >
                        <User className="w-3 h-3" />
                        <span className="hidden sm:inline">Portal</span>
                      </button>

                      {/* Delete Patient Option */}
                      <button
                        onClick={() => handleDelete(patient.id, patient.name || patient.full_name)}
                        className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-900 hover:text-white text-rose-800 border border-rose-300 transition cursor-pointer"
                        title="Delete patient record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-white border border-slate-300 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Register New Patient</span>
              </h3>
              <button onClick={() => setIsAddPatientOpen(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-800 font-bold">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full glass-input text-xs font-mono font-bold text-slate-900 mt-1 py-2"
                />
              </div>

              <div>
                <label className="text-slate-800 font-bold">Skin Tone Classification</label>
                <select
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full glass-input text-xs font-bold text-slate-900 mt-1 py-2"
                >
                  <option value="Fair Skin (Burns Easily)">Fair Skin (Burns Easily)</option>
                  <option value="Medium Asian Skin">Medium Asian Skin</option>
                  <option value="Olive / Darker Asian">Olive / Darker Asian</option>
                  <option value="Brown Skin">Brown Skin</option>
                </select>
              </div>

              <div>
                <label className="text-slate-800 font-bold">Sensitivities / Allergies (Optional)</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Sensitive to strong chemical peels"
                  className="w-full glass-input text-xs mt-1 py-2"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-black bg-emerald-600 hover:bg-slate-900 text-white rounded-lg shadow"
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
