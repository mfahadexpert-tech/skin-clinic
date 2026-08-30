/**
 * ==============================================================================
 * SkinLab AI - Machine ROI & Consumable Profitability Calculator
 * 10+ Years Senior UI/UX Designer Redesign (DocuVerse Clean Standard)
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Zap, 
  Layers, 
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import { api } from '@/lib/api';

export default function MachineROIReport() {
  const [machines, setMachines] = useState([
    {
      id: 1,
      machine_name: 'HydraFacial Vortex Elite',
      purchase_cost: 2500000,
      consumable_cost_per_session: 1200,
      average_price_per_session: 6000,
      total_sessions_completed: 84,
      gross_revenue: 504000,
      total_consumables_cost: 100800,
      net_profit: 403200,
      payback_percentage: 16.13,
      profit_margin_percent: 80.0
    },
    {
      id: 2,
      machine_name: 'Diode Laser 808nm (Hair Removal)',
      purchase_cost: 3800000,
      consumable_cost_per_session: 500,
      average_price_per_session: 7500,
      total_sessions_completed: 73,
      gross_revenue: 547500,
      total_consumables_cost: 36500,
      net_profit: 511000,
      payback_percentage: 13.45,
      profit_margin_percent: 93.3
    },
    {
      id: 3,
      machine_name: 'Q-Switched Nd:YAG (Carbon Peel)',
      purchase_cost: 1800000,
      consumable_cost_per_session: 900,
      average_price_per_session: 5000,
      total_sessions_completed: 39,
      gross_revenue: 195000,
      total_consumables_cost: 35100,
      net_profit: 159900,
      payback_percentage: 8.88,
      profit_margin_percent: 82.0
    }
  ]);

  return (
    <div className="space-y-6">
      
      {/* Top ROI KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="docu-card p-5 space-y-2 bg-white">
          <span className="text-xs font-bold text-slate-500">Total Capital Investment</span>
          <div className="text-2xl font-extrabold text-[#0f172a] font-sans">PKR 8,100,000</div>
          <span className="text-xs font-medium text-slate-500 block">3 Active Clinical Laser & Facial Systems</span>
        </div>

        <div className="docu-card p-5 space-y-2 bg-white">
          <span className="text-xs font-bold text-slate-500">Cumulative Net Profit</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-sans">PKR 1,074,100</div>
          <span className="text-xs font-bold text-emerald-600 block">Average 85.1% Profit Margin</span>
        </div>

        <div className="docu-card p-5 space-y-2 bg-white">
          <span className="text-xs font-bold text-slate-500">Fastest Payback Machine</span>
          <div className="text-xl font-extrabold text-[#0f172a]">HydraFacial Vortex</div>
          <span className="text-xs font-bold text-teal-600 block">16.1% Capex Recovered</span>
        </div>

      </div>

      {/* Main Machine Comparison Table */}
      <div className="docu-card p-6 space-y-4 bg-white">
        <div>
          <h3 className="font-extrabold text-sm text-[#0f172a]">Machine Level Capital Recovery & Margin Audit</h3>
          <p className="text-xs text-slate-500">Track purchase payback, consumable expense vs patient billing</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3 text-right">Purchase Price</th>
                <th className="py-2.5 px-3 text-right">Consumable Cost</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-center">Sessions</th>
                <th className="py-2.5 px-3 text-right">Net Profit</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
                <th className="py-2.5 px-3 text-right">Capex Recovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {machines.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-3 font-bold text-[#0f172a] text-sm">{m.machine_name}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700">PKR {m.purchase_cost.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right font-mono text-rose-600 font-semibold">PKR {m.consumable_cost_per_session.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">PKR {m.average_price_per_session.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-900">{m.total_sessions_completed}</td>
                  <td className="py-3.5 px-3 text-right font-mono font-extrabold text-[#0f172a]">PKR {m.net_profit.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-emerald-600">{m.profit_margin_percent}%</td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {m.payback_percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
