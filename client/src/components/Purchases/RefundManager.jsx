/**
 * ==============================================================================
 * SkinLab AI - Module 8: Treatment Cancellation & Refund Manager
 * ==============================================================================
 * Handles:
 * - Cancelling unused package sessions if a patient relocates or discontinues.
 * - Calculating refund amounts and updating the patient ledger balance.
 * - Capturing audit reasons for quality assurance.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function RefundManager({ sales = [] }) {
  const [selectedSaleId, setSelectedSaleId] = useState(sales[0]?.id || 1);
  const [refundAmount, setRefundAmount] = useState(5000);
  const [refundReason, setRefundReason] = useState('Patient relocation to another city');
  const [isDone, setIsDone] = useState(false);

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    try {
      await api.processRefund({
        sale_id: parseInt(selectedSaleId),
        refund_amount: parseFloat(refundAmount) || 0,
        reason: refundReason
      });
      setIsDone(true);
      setTimeout(() => setIsDone(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-panel p-6 max-w-xl mx-auto space-y-4 border border-rose-500/20">
      <div className="flex items-center space-x-2 text-rose-400">
        <RotateCcw className="w-5 h-5" />
        <h3 className="text-sm font-bold text-white">Treatment Cancellation & Refund Dialog</h3>
      </div>
      <p className="text-xs text-slate-400">
        Refund unused sessions of an active package and record audit log.
      </p>

      {isDone ? (
        <div className="p-4 bg-emerald-950/60 rounded-xl border border-emerald-500/30 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-xs font-bold text-white">Refund Processed & Ledger Updated</h4>
          <p className="text-[11px] text-emerald-300">Amount credited to patient account.</p>
        </div>
      ) : (
        <form onSubmit={handleProcessRefund} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300">Target Invoice / Sale Record</label>
            <select
              value={selectedSaleId}
              onChange={(e) => setSelectedSaleId(e.target.value)}
              className="w-full glass-input text-xs mt-1"
            >
              {sales.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.invoice_number} — {s.customer_name} (Total: PKR {s.grand_total})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300">Refund Amount (PKR)</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold text-rose-300 mt-1"
            />
          </div>

          <div>
            <label className="text-slate-300">Audit Cancellation Reason</label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full glass-input text-xs mt-1"
            >
              <option value="Patient relocation to another city">Patient relocation to another city</option>
              <option value="Adverse skin sensitivity / Medical doctor advice">Adverse skin sensitivity / Medical advice</option>
              <option value="Unused package sessions cancelled on request">Unused package sessions cancelled on request</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm & Audit Refund</span>
          </button>
        </form>
      )}
    </div>
  );
}
