/**
 * ==============================================================================
 * SkinLab AI - Module 3.2: Treatment Cart Component
 * High Contrast DocuVerse Redesign
 * ==============================================================================
 */

'use client';

import React from 'react';
import { Trash2, Plus, Minus, Layers } from 'lucide-react';

export default function TreatmentCart({ cart, onRemoveItem, onUpdateItem }) {
  if (cart.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs font-medium space-y-1">
        <div>Cart is currently empty</div>
        <p className="text-[11px] text-slate-400">Search and select procedures from above to start billing</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold text-[#0f172a]">Treatment Cart ({cart.length} items)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
              <th className="py-2 px-2">Procedure</th>
              <th className="py-2 px-2 text-center">Sessions</th>
              <th className="py-2 px-2 text-right">Price</th>
              <th className="py-2 px-2 text-right">Total</th>
              <th className="py-2 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cart.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                
                {/* Item Name */}
                <td className="py-3 px-2">
                  <div className="font-bold text-[#0f172a] text-xs">{item.product_name}</div>
                  {item.item_group_name && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                      {item.item_group_name}
                    </span>
                  )}
                </td>

                {/* Session Counter */}
                <td className="py-3 px-2 text-center">
                  <div className="inline-flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => onUpdateItem(idx, 'sessions_allowed', Math.max(1, item.sessions_allowed - 1))}
                      className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs text-[#0f172a] px-1">
                      {item.sessions_consumed}/{item.sessions_allowed}
                    </span>
                    <button
                      onClick={() => onUpdateItem(idx, 'sessions_allowed', item.sessions_allowed + 1)}
                      className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center font-bold hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                </td>

                {/* Unit Price */}
                <td className="py-3 px-2 text-right font-mono font-bold text-slate-700">
                  PKR {item.unit_price.toLocaleString()}
                </td>

                {/* Total */}
                <td className="py-3 px-2 text-right font-mono font-extrabold text-[#0f172a]">
                  PKR {item.total_price.toLocaleString()}
                </td>

                {/* Remove */}
                <td className="py-3 px-2 text-center">
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
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
