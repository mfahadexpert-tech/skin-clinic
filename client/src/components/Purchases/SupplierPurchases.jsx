/**
 * ==============================================================================
 * SkinLab AI - Module 7 & 8: Clinic Purchases (SRM) & Treatment Refund Auditor
 * ==============================================================================
 * Manages:
 * - Medical suppliers & Distributors (HydraFacial serums, peeling solutions).
 * - Purchase Orders & Inward stock.
 * - Treatment session cancellations & refund auditor with audit logs.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, AlertTriangle, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';
import RefundManager from './RefundManager';

export default function SupplierPurchases({ sales }) {
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' or 'refunds'

  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const res = await api.getSuppliers();
        if (res && res.suppliers) {
          setSuppliers(res.suppliers);
          setPurchases(res.purchases || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadPurchases();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Supplies SRM & Treatment Refunds</h1>
            <p className="text-xs text-slate-400">Medical Consumables, Serums, Purchase Inward & Cancellation Audits</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'suppliers' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Suppliers & Stock Inward
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'refunds' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Treatment Refunds & Cancellations
          </button>
        </div>
      </div>

      {activeTab === 'suppliers' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Supplier Directory */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Approved Medical Suppliers Directory
            </h3>

            <div className="space-y-3">
              {suppliers.map((sup) => (
                <div key={sup.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{sup.name}</span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      Balance Due: PKR {sup.balance?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Contact: {sup.contact_person} ({sup.phone})</div>
                  <div className="text-[11px] text-slate-500">{sup.address}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchase Orders Inward */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recent Consumable Purchase Inward Orders
            </h3>

            <div className="space-y-3">
              {purchases.map((po) => (
                <div key={po.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-teal-400">{po.purchase_number}</span>
                    <span className="text-xs font-bold text-white font-mono">
                      PKR {po.total_amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">Supplier: {po.supplier_name}</div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Date: {po.date}</span>
                    <span className="text-emerald-400 font-semibold uppercase">Stock Inward Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <RefundManager sales={sales} />
      )}

    </div>
  );
}
