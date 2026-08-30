/**
 * ==============================================================================
 * SkinLab AI - Module 3: Multi-Method Split Payment Dialog (CheckoutDialog)
 * ==============================================================================
 * Allows splitting a single invoice across multiple payment methods:
 * - Cash + Online Card + Advance Wallet + Due Balance
 * - Auto-calculates remaining dues and updates the patient's balance ledger.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { CreditCard, Banknote, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SplitCheckoutModal({ grandTotal, onClose, onSubmit }) {
  const [cashAmount, setCashAmount] = useState(grandTotal / 2);
  const [cardAmount, setCardAmount] = useState(grandTotal / 2);
  const [walletAmount, setWalletAmount] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);

  const totalAllocated = (parseFloat(cashAmount) || 0) + 
                         (parseFloat(cardAmount) || 0) + 
                         (parseFloat(walletAmount) || 0) + 
                         (parseFloat(dueAmount) || 0);

  const difference = grandTotal - totalAllocated;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Math.abs(difference) > 0.01) {
      alert(`The split total must match the grand total of PKR ${grandTotal.toLocaleString()}`);
      return;
    }

    const splits = [
      { method: 'cash', amount: parseFloat(cashAmount) || 0 },
      { method: 'card', amount: parseFloat(cardAmount) || 0 },
      { method: 'advance_wallet', amount: parseFloat(walletAmount) || 0 },
      { method: 'due_credit', amount: parseFloat(dueAmount) || 0 }
    ].filter(s => s.amount > 0);

    onSubmit(splits);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Split Payment Allocation</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-3 bg-teal-950/40 rounded-xl border border-teal-500/20 text-center">
          <span className="text-xs text-slate-300">Total Invoice Amount to Split</span>
          <div className="text-xl font-black text-teal-400 font-mono">PKR {grandTotal.toLocaleString()}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          
          <div>
            <label className="text-slate-300 flex items-center space-x-1.5 mb-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cash Payment (PKR)</span>
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-300 flex items-center space-x-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Credit / Debit Card (PKR)</span>
            </label>
            <input
              type="number"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-300 flex items-center space-x-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-teal-400" />
              <span>Advance Wallet Deduct (PKR)</span>
            </label>
            <input
              type="number"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-300 flex items-center space-x-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Patient Due Ledger / Credit (PKR)</span>
            </label>
            <input
              type="number"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold text-rose-300"
            />
          </div>

          {/* Allocation Difference Status */}
          <div className={`p-2.5 rounded-lg border text-center text-xs font-semibold ${
            Math.abs(difference) < 0.01 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}>
            {Math.abs(difference) < 0.01 ? (
              <div className="flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Exact Split Matched! Ready to process.</span>
              </div>
            ) : (
              <span>Unallocated Difference: PKR {difference.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Math.abs(difference) > 0.01}
              className="px-4 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-md disabled:opacity-50"
            >
              Confirm Split & Bill
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
