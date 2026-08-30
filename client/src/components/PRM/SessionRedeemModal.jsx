/**
 * ==============================================================================
 * SkinLab AI - Module 6 / Workflow 3: Interactive Patient Visits & Session Redemption Dialog
 * (receive_payment_dialog)
 * ==============================================================================
 * Triggered when clicking "[History]" on any patient in PRM:
 * 1. Selects active invoice with multi-session packages (e.g. 6-Session Laser).
 * 2. Multi-Session Treatment Tracking Table:
 *    - Displays Total Sessions, Used to Date, and Remaining Sessions.
 *    - Allows receptionist to increment "Session Now" to mark today's treatment as completed.
 * 3. Outstanding Payment Collection:
 *    - Allows receiving partial or full payment on remaining dues.
 *    - Credits the reception cash drawer and clears patient debt.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { History, CheckCircle2, Plus, Minus, CreditCard, Banknote, AlertCircle, FileText } from 'lucide-react';

export default function SessionRedeemModal({ patient, onClose, onRedeem }) {
  // Simulated sales records for this patient
  const [activeInvoice, setActiveInvoice] = useState({
    id: 1,
    invoice_number: 'INV-0029',
    date: '2026-08-10',
    total_amount: 30000,
    paid_amount: 20000,
    due_amount: 10000,
    items: [
      {
        id: 1,
        product_name: 'Full Body Laser (6 Sess)',
        sessions_allowed: 6,
        sessions_consumed: 2,
        remaining: 4,
        session_now: 1 // Default consume 1 session today
      },
      {
        id: 2,
        product_name: 'HydraFacial Glow',
        sessions_allowed: 2,
        sessions_consumed: 1,
        remaining: 1,
        session_now: 0
      }
    ]
  });

  const [paymentAmount, setPaymentAmount] = useState(activeInvoice.due_amount);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [sessionNotes, setSessionNotes] = useState('Session 3 performed. Fluence 14.5 J/cm², Spot 10mm. Skin tolerated well.');
  const [isSuccess, setIsSuccess] = useState(false);

  // Update Session Now counter
  const handleUpdateSessionNow = (itemIndex, change) => {
    const updated = { ...activeInvoice };
    const item = updated.items[itemIndex];
    const newSessionNow = Math.max(0, Math.min(item.remaining, item.session_now + change));
    item.session_now = newSessionNow;
    setActiveInvoice(updated);
  };

  // Submit Redemption & Payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Find active item being redeemed
    const targetItem = activeInvoice.items.find(i => i.session_now > 0) || activeInvoice.items[0];

    const payload = {
      sale_id: activeInvoice.id,
      item_id: targetItem.id,
      sessions_to_consume: targetItem.session_now || 1,
      payment_amount: parseFloat(paymentAmount) || 0,
      payment_method: paymentMethod,
      session_notes: sessionNotes
    };

    await onRedeem(payload);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-2xl w-full border border-teal-500/30 shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Patient Visits & Session Redemption Dialog</h3>
              <p className="text-[11px] text-slate-400">
                Patient: <span className="text-teal-300 font-bold">{patient.name}</span> (MRN: <span className="font-mono text-cyan-400">{patient.mrn}</span>)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">Session Successfully Redeemed!</h4>
            <p className="text-xs text-slate-400">Remaining package sessions and payment ledger updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Step 1: Active Invoice Selection */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 space-y-1">
              <label className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">1. Select Active Invoice</label>
              <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-teal-500/30">
                <div>
                  <span className="font-mono font-bold text-white">{activeInvoice.invoice_number}</span>
                  <span className="text-slate-400 ml-2 font-mono">({activeInvoice.date})</span>
                </div>
                <div className="flex space-x-3 text-xs">
                  <span className="text-slate-300">Total: PKR {activeInvoice.total_amount.toLocaleString()}</span>
                  <span className="text-emerald-400 font-semibold">Paid: PKR {activeInvoice.paid_amount.toLocaleString()}</span>
                  <span className="text-rose-400 font-bold">Due: PKR {activeInvoice.due_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Step 2: Multi-Session Treatment Tracking */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 space-y-2">
              <label className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">2. Multi-Session Treatment Tracking</label>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                      <th className="py-2 px-2">Service Name</th>
                      <th className="py-2 px-2 text-center">Total Sessions</th>
                      <th className="py-2 px-2 text-center">Used</th>
                      <th className="py-2 px-2 text-center">Remaining</th>
                      <th className="py-2 px-2 text-center">Session Now (Use)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-2 font-semibold text-slate-200">{item.product_name}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{item.sessions_allowed}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400">{item.sessions_consumed}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-cyan-400">
                          {item.remaining - item.session_now} left
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <div className="inline-flex items-center space-x-1.5 bg-slate-950 border border-white/10 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateSessionNow(idx, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-bold text-teal-300 font-mono w-4 text-center">
                              {item.session_now}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateSessionNow(idx, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 3: Outstanding Payment Collection */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-white/10 space-y-3">
              <label className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">3. Outstanding Due Collection</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-6">
                  <label className="text-slate-300">Collect Payment (PKR)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full glass-input font-mono font-bold text-teal-300 text-xs mt-1"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="text-slate-300">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full glass-input text-xs mt-1"
                  >
                    <option value="cash">Cash (Reception Drawer)</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="bank">Online Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 flex items-center space-x-1 mb-1">
                  <FileText className="w-3 h-3 text-teal-400" />
                  <span>Clinical Remarks for Today's Redeemed Session</span>
                </label>
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-xs bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-lg shadow-lg flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Consume Session & Update Balance</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
