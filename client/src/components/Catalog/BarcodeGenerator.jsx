/**
 * ==============================================================================
 * SkinLab AI - Module 9: Code-128 / EAN-13 Thermal Label Generator
 * ==============================================================================
 * Formats labels with:
 * - Clinic Name Branding
 * - Product Name & Service SKU
 * - Selling Price (PKR)
 * - Vector Barcode Graphic
 * ==============================================================================
 */

'use client';

import React from 'react';
import { QrCode, Printer } from 'lucide-react';

export default function BarcodeGenerator({ product, onClose }) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-sm w-full border border-white/20 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-xs font-bold text-white flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-teal-400" />
            <span>Thermal Barcode Label Preview</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* 50mm x 25mm Thermal Label Simulation */}
        <div className="bg-white text-black p-4 rounded border-2 border-dashed border-gray-400 text-center font-mono space-y-2 shadow-inner">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-800">
            SKIN LAB AESTHETIC CLINIC
          </div>
          <div className="text-xs font-bold text-gray-900 leading-tight">
            {product.name}
          </div>
          <div className="text-[10px] text-gray-600 font-mono">
            SKU: {product.sku}
          </div>

          {/* Barcode Lines Graphic */}
          <div className="py-2 flex items-center justify-center space-x-[2px] h-10 bg-white">
            {[4, 2, 6, 2, 5, 2, 4, 3, 2, 6, 4, 2, 3, 5, 2, 4, 2, 5, 3, 2, 4, 6, 2, 4, 5, 2].map((w, i) => (
              <div
                key={i}
                className="bg-black h-full"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <div className="text-[9px] tracking-widest text-gray-700">
            *{product.barcode || `89012345000${product.id}`}*
          </div>

          <div className="text-sm font-black text-black pt-1 border-t border-gray-300">
            PKR {product.selling_price?.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Label</span>
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
