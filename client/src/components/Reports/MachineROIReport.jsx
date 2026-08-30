/**
 * ==============================================================================
 * SkinLab AI - Module 11: Service-Wise & Machine Performance ROI Analytics
 * ==============================================================================
 * Calculates:
 * - Total procedures completed per machine/equipment
 * - Gross Revenue generated vs Disposable consumable costs
 * - Net profit margins & equipment payback velocity
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

export default function MachineROIReport() {
  const [roiData, setRoiData] = useState([]);

  useEffect(() => {
    const loadROI = async () => {
      try {
        const res = await api.getMachineROI();
        if (res && res.machine_roi) setRoiData(res.machine_roi);
      } catch (e) {
        console.error(e);
      }
    };
    loadROI();
  }, []);

  return (
    <div className="space-y-4">
      <div className="glass-panel p-5 space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Laser & Aesthetic Equipment ROI Breakdown</span>
            </h3>
            <p className="text-[11px] text-slate-400">Analysis of procedure margins deducting disposables and serum costs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-3">Equipment / Service</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Sessions Done</th>
                <th className="py-3 px-3 text-right">Gross Revenue</th>
                <th className="py-3 px-3 text-right">Consumables Cost</th>
                <th className="py-3 px-3 text-right">Net Profit Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {roiData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-white">{item.equipment_or_service}</td>
                  <td className="py-3 px-3 text-slate-300">{item.category}</td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">{item.sessions_completed}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">PKR {item.gross_revenue.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400">PKR {item.consumables_cost.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className="text-emerald-400 font-bold">
                      PKR {item.net_margin_pkr.toLocaleString()} ({item.margin_percentage}%)
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
