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
      <div className="bg-white border border-slate-300 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4 text-slate-900">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-black text-slate-900">Split Payment Allocation</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 cursor-pointer">✕</button>
        </div>

        <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-center">
          <span className="text-xs text-slate-600 font-semibold">Total Invoice Amount to Split</span>
          <div className="text-xl font-black text-teal-800 font-mono">PKR {grandTotal.toLocaleString()}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          
          <div>
            <label className="text-slate-700 font-bold flex items-center space-x-1.5 mb-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash Payment (PKR)</span>
            </label>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold text-slate-900 py-2"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold flex items-center space-x-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
              <span>Credit / Debit Card (PKR)</span>
            </label>
            <input
              type="number"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold text-slate-900 py-2"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold flex items-center space-x-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-teal-600" />
              <span>Advance Wallet Deduct (PKR)</span>
            </label>
            <input
              type="number"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold text-slate-900 py-2"
            />
          </div>

          <div>
            <label className="text-slate-700 font-bold flex items-center space-x-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Patient Due Ledger / Credit (PKR)</span>
            </label>
            <input
              type="number"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              className="w-full glass-input text-xs font-mono font-bold text-rose-700 py-2"
            />
          </div>

          {/* Allocation Difference Status */}
          <div className={`p-2.5 rounded-lg border text-center text-xs font-bold ${
            Math.abs(difference) < 0.01 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}>
            {Math.abs(difference) < 0.01 ? (
              <div className="flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Exact Split Matched! Ready to process.</span>
              </div>
            ) : (
              <span>Unallocated Difference: PKR {difference.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Math.abs(difference) > 0.01}
              className="px-4 py-1.5 text-xs font-black bg-teal-600 hover:bg-slate-900 text-white rounded-lg shadow-md disabled:opacity-50 cursor-pointer transition-colors"
            >
              Confirm Split & Bill
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
