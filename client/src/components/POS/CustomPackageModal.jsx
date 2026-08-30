/**
 * ==============================================================================
 * SkinLab AI - Module 3: On-The-Fly Custom Package Dialog (CustomPackageDialog)
 * ==============================================================================
 * Allows front-desk staff to construct a personalized treatment bundle in seconds:
 * 1. Select any combination of clinic services (e.g. 3x HydraFacial + 2x Chemical Peel).
 * 2. Set custom session counts for each service.
 * 3. Override individual or package pricing with agreed discount rates.
 * 4. Generates a grouped package line item in the cart.
 * ==============================================================================
 */

'use client';

import React, { useState } from 'react';
import { PackagePlus, Plus, Trash2, Tag, Check } from 'lucide-react';

export default function CustomPackageModal({ products, onClose, onSave }) {
  const [packageName, setPackageName] = useState('Personalized Glow Bundle');
  const [selectedItems, setSelectedItems] = useState([
    {
      product_id: products[0]?.id || 1,
      product_name: products[0]?.name || 'HydraFacial Deluxe',
      sessions: 3,
      price_override: 15000
    }
  ]);

  const handleAddItem = () => {
    const defaultProd = products[1] || products[0];
    setSelectedItems([
      ...selectedItems,
      {
        product_id: defaultProd.id,
        product_name: defaultProd.name,
        sessions: 2,
        price_override: defaultProd.selling_price * 2 * 0.85 // 15% bundle discount default
      }
    ]);
  };

  const handleUpdateRow = (index, field, value) => {
    const updated = [...selectedItems];
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value));
      updated[index].product_id = prod.id;
      updated[index].product_name = prod.name;
    } else {
      updated[index][field] = value;
    }
    setSelectedItems(updated);
  };

  const handleRemoveRow = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalPackagePrice = selectedItems.reduce((acc, item) => acc + (parseFloat(item.price_override) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    onSave({
      package_name: packageName,
      items: selectedItems,
      total_price: totalPackagePrice
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel p-6 max-w-xl w-full border border-white/20 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Create Custom Treatment Bundle</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs text-slate-300">Custom Package Name</label>
            <input
              type="text"
              required
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full glass-input text-xs mt-1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Bundled Services & Sessions</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-900/90 p-2 rounded-lg border border-white/5">
                  <select
                    value={item.product_id}
                    onChange={(e) => handleUpdateRow(idx, 'product_id', e.target.value)}
                    className="flex-1 glass-input text-xs py-1"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Sessions"
                      value={item.sessions}
                      onChange={(e) => handleUpdateRow(idx, 'sessions', parseInt(e.target.value) || 1)}
                      className="w-full glass-input text-xs py-1 text-center font-mono"
                      title="Sessions Count"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      placeholder="Price PKR"
                      value={item.price_override}
                      onChange={(e) => handleUpdateRow(idx, 'price_override', parseFloat(e.target.value) || 0)}
                      className="w-full glass-input text-xs py-1 text-right font-mono text-teal-300"
                      title="Bundle Discounted Price"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-teal-950/40 rounded-xl border border-teal-500/20 flex items-center justify-between text-xs">
            <span className="text-teal-300 font-medium">Total Customized Bundle Price:</span>
            <span className="text-sm font-bold text-teal-400 font-mono">PKR {totalPackagePrice.toLocaleString()}</span>
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
              className="px-4 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-md flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Add Bundle to Cart</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
