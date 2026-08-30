/**
 * ==============================================================================
 * SkinLab AI - POS Interactive Treatment Cart Component
 * ==============================================================================
 * Renders the table of selected treatments and bundled deals with:
 * - Service Name & SKU tags
 * - "Sessions Allowed" vs "Used Now" session counters
 * - Unit price and line item total calculation
 * - 1-Click removal button
 * ==============================================================================
 */

'use client';

import React from 'react';
import { Trash2, Plus, Minus, Layers, AlertCircle } from 'lucide-react';

export default function TreatmentCart({ cart, onRemoveItem, onUpdateItem }) {
  if (cart.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500 opacity-60" />
        <p className="text-xs">No procedures or items added to current cart.</p>
        <p className="text-[11px] text-slate-500 mt-1">Search or click services above to begin billing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>Active Cart Line Items ({cart.length})</span>
        </h3>
        <span className="text-[11px] text-slate-400">Used Now = Consumed today</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-[11px]">
              <th className="py-2 px-2">Service / Procedure Name</th>
              <th className="py-2 px-2 text-center">Sessions Allowed</th>
              <th className="py-2 px-2 text-center">Used Now</th>
              <th className="py-2 px-2 text-right">Price (PKR)</th>
              <th className="py-2 px-1 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cart.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40 transition">
                
                {/* Service Name & Deal tags */}
                <td className="py-2.5 px-2">
                  <div className="font-semibold text-slate-200">{item.product_name}</div>
                  {item.item_group_name && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                      📦 {item.item_group_name}
                    </span>
                  )}
                </td>

                {/* Total Sessions Allowed in Deal */}
                <td className="py-2.5 px-2 text-center font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {item.sessions_allowed} Sess
                  </span>
                </td>

                {/* Used Now Counter */}
                <td className="py-2.5 px-2 text-center">
                  <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-white/10 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateItem(idx, 'sessions_consumed', Math.max(0, item.sessions_consumed - 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-bold text-teal-300 font-mono w-4 text-center">
                      {item.sessions_consumed}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateItem(idx, 'sessions_consumed', Math.min(item.sessions_allowed, item.sessions_consumed + 1))}
                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>

                {/* Line Total */}
                <td className="py-2.5 px-2 text-right font-bold text-teal-400 font-mono">
                  PKR {item.total_price.toLocaleString()}
                </td>

                {/* Remove Action */}
                <td className="py-2.5 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition"
                    title="Remove procedure from cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
