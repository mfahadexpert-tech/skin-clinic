/**
 * ==============================================================================
 * SkinLab AI - Module 5 & 9: Services Catalog, Deals Master & Barcode Generator
 * ==============================================================================
 * Manages:
 * 1. Skincare Services & Procedures Master (Pricing, SKU, Cost price).
 * 2. Retail Skincare inventory tracking.
 * 3. Predefined treatment deals and packages.
 * 4. Generating Code-128 thermal barcode labels.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Boxes, Tag, QrCode, Sparkles, Printer, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import BarcodeGenerator from './BarcodeGenerator';

export default function ServicesMaster() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [selectedBarcodeProd, setSelectedBarcodeProd] = useState(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await api.getServicesCatalog();
        if (res && res.products) {
          setCategories(res.categories || []);
          setProducts(res.products || []);
          setDeals(res.deals || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadCatalog();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Services, Packages & Retail Catalog</h1>
            <p className="text-xs text-slate-400">Clinical Procedures, Treatment Deals & Code-128 Barcodes</p>
          </div>
        </div>
      </div>

      {/* Services Master Grid */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Clinic Procedures & Retail Skincare Inventory
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-3">Service / SKU</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3 text-right">Cost (PKR)</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Barcode Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{prod.name}</div>
                    <div className="text-[11px] text-teal-400 font-mono">{prod.sku}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      prod.is_service ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {prod.is_service ? 'Clinical Procedure' : 'Retail Product'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    PKR {prod.cost_price?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-teal-300">
                    PKR {prod.selling_price?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    {prod.is_service ? '∞' : `${prod.stock_quantity} units`}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedBarcodeProd(prod)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold border border-white/10 mx-auto transition"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Print Label</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Print Modal */}
      {selectedBarcodeProd && (
        <BarcodeGenerator
          product={selectedBarcodeProd}
          onClose={() => setSelectedBarcodeProd(null)}
        />
      )}

    </div>
  );
}
