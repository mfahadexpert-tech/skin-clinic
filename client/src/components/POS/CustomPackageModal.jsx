/**
 * ==============================================================================
 * SkinLab AI - On-The-Fly Custom Package Dialog (CustomPackageModal)
 * ==============================================================================
 * Enables receptionists to create personalized multi-session package bundles:
 * 1. Select any combination of clinic services (HydraFacial, Carbon Peel, Laser, etc.)
 * 2. Configure multi-session counts & agreed package prices.
 * 3. Adds directly to the POS billing cart for instant checkout.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { PackagePlus, Plus, Trash2, Tag, Check, X } from 'lucide-react';

export default function CustomPackageModal({ products = [], onClose, onSave }) {
  // Default fallback services if products list is empty
  const defaultServices = [
    { id: 1, name: 'HydraFacial Deluxe', selling_price: 6000 },
    { id: 2, name: 'Full Body Laser Hair Reduction (Diode 808nm)', selling_price: 22000 },
    { id: 3, name: 'Carbon Laser Peel (Hollywood Facial)', selling_price: 8500 },
    { id: 4, name: 'Salicylic / Glycolic Chemical Peel', selling_price: 4500 },
    { id: 5, name: 'Botox Forehead & Crow\'s Feet (20 Units)', selling_price: 18000 }
  ];

  const availableProducts = (products && products.length > 0) ? products : defaultServices;

  const [packageName, setPackageName] = useState('Personalized Glow Bundle');
  const [selectedItems, setSelectedItems] = useState([
    {
      product_id: availableProducts[0].id,
      product_name: availableProducts[0].name,
      sessions: 3,
      price_override: availableProducts[0].selling_price * 3 * 0.85 // 15% bundle discount
    }
  ]);

  const handleAddItem = () => {
    const nextProd = availableProducts[selectedItems.length % availableProducts.length] || availableProducts[0];
    setSelectedItems([
      ...selectedItems,
      {
        product_id: nextProd.id,
        product_name: nextProd.name,
        sessions: 2,
        price_override: nextProd.selling_price * 2 * 0.85
      }
    ]);
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...selectedItems];
    if (field === 'product_id') {
      const prod = availableProducts.find(p => p.id === parseInt(value)) || availableProducts[0];
      updated[index].product_id = prod.id;
      updated[index].product_name = prod.name;
      updated[index].price_override = prod.selling_price * (updated[index].sessions || 1) * 0.85;
    } else if (field === 'sessions') {
      const sess = Math.max(1, parseInt(value) || 1);
      updated[index].sessions = sess;
      const prod = availableProducts.find(p => p.id === updated[index].product_id) || availableProducts[0];
      updated[index].price_override = prod.selling_price * sess * 0.85;
    } else if (field === 'price_override') {
      updated[index].price_override = parseFloat(value) || 0;
    }
    setSelectedItems(updated);
  };

  const handleRemoveRow = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalPackagePrice = selectedItems.reduce((acc, item) => acc + (parseFloat(item.price_override) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please add at least one service to the custom package.');
      return;
    }
    onSave({
      package_name: packageName,
      items: selectedItems,
      total_price: totalPackagePrice
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-teal-500/50 p-6 rounded-2xl max-w-xl w-full shadow-2xl space-y-4 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Create Custom Treatment Bundle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Package Name */}
          <div>
            <label className="text-xs font-semibold text-slate-200">Custom Package Name *</label>
            <input
              type="text"
              required
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g. Personalized Bridal Glow Package"
              className="w-full glass-input text-xs mt-1 py-2 font-bold text-teal-300"
            />
          </div>

          {/* Service Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">Bundled Procedures & Session Counts</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Procedure</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-12 gap-2 items-center">
                  
                  {/* Service Dropdown */}
                  <div className="col-span-5">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleUpdateRow(idx, 'product_id', e.target.value)}
                      className="w-full glass-input text-xs py-1.5 font-medium text-white"
                    >
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                          {p.name} (PKR {p.selling_price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sessions Count */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] text-slate-400">Sessions:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.sessions}
                        onChange={(e) => handleUpdateRow(idx, 'sessions', e.target.value)}
                        className="w-full glass-input text-xs text-center py-1 font-bold text-cyan-300"
                      />
                    </div>
                  </div>

                  {/* Price Override */}
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={item.price_override}
                      onChange={(e) => handleUpdateRow(idx, 'price_override', e.target.value)}
                      placeholder="PKR Total"
                      className="w-full glass-input text-xs text-right py-1 font-bold text-teal-300"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 text-center">
                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Bundle Total Summary */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">Calculated Package Price:</span>
            <span className="text-base font-extrabold text-teal-400 font-mono">
              PKR {totalPackagePrice.toLocaleString()}
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Add Custom Package to Cart</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
