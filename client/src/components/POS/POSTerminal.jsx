/**
 * ==============================================================================
 * SkinLab AI - Module 3: Clinic POS & Treatment Billing Terminal
 * ==============================================================================
 * Central operational terminal for front-desk receptionists and cashiers:
 * 1. Searchable Patient Combobox with live Visit Counter badge and Debt/Wallet balance.
 * 2. Inline "+ Add Walk-In Patient" quick registration modal.
 * 3. Doctor/Aesthetician dropdown for practitioner commission and medical liability.
 * 4. Clinical Session Remarks (Laser fluence J/cm2, Spot size, skin notes).
 * 5. Fast treatment & deal search + Custom on-the-fly bundle composer.
 * 6. Live Token Generator (e.g. P-01, P-02) for waiting lounge queue.
 * 7. Dual-Format Print Engine: 80mm ESC/POS Thermal Slip & A4 Clinical Invoice.
 * ==============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart,
  UserPlus, 
  Search, 
  Stethoscope, 
  FileText, 
  PackagePlus, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  Coins, 
  Layers, 
  AlertCircle,
  Tag,
  Clock,
  Sparkles
} from 'lucide-react';
import TreatmentCart from './TreatmentCart';
import CustomPackageModal from './CustomPackageModal';
import SplitCheckoutModal from './SplitCheckoutModal';
import ThermalReceipt from './ThermalReceipt';
import MedicalInvoiceA4 from './MedicalInvoiceA4';

export default function POSTerminal({ 
  patients, 
  products, 
  deals, 
  doctors, 
  onCheckout, 
  onRegisterPatient, 
  isOffline 
}) {
  // POS Form States
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || 1);
  const [sessionRemarks, setSessionRemarks] = useState('Fluence 14J/cm², Spot size 10mm, Session 1 completed.');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([
    {
      product_id: 1,
      product_name: 'HydraFacial Deluxe (Deep Cleansing)',
      quantity: 1,
      unit_price: 6000,
      sessions_allowed: 1,
      sessions_consumed: 1,
      item_group_name: null,
      total_price: 6000
    }
  ]);

  // Payment Calculation States
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(6000);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Modals & Print States
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isCustomPackageOpen, setIsCustomPackageOpen] = useState(false);
  const [isSplitCheckoutOpen, setIsSplitCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [printMode, setPrintMode] = useState('80mm'); // '80mm' or 'a4'

  // Inline Walk-In Registration States
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientSkin, setNewPatientSkin] = useState('Fitzpatrick Type III');

  // Find currently selected patient
  const selectedPatient = patients.find(p => p.id === parseInt(selectedPatientId)) || patients[0];

  // Calculate Subtotal & Grand Total
  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  // Sync default paid amount when grand total changes
  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal]);

  // Add Treatment to Cart
  const handleAddProduct = (product) => {
    const existingIndex = cart.findIndex(item => item.product_id === product.id && !item.item_group_name);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].sessions_allowed += 1;
      updated[existingIndex].total_price = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.selling_price,
          sessions_allowed: 1,
          sessions_consumed: 1, // Default 1 session consumed today
          item_group_name: null,
          total_price: product.selling_price
        }
      ]);
    }
  };

  // Add Pre-configured Bundled Deal to Cart (e.g. 6-Session Laser Package)
  const handleAddDeal = (deal) => {
    const dealItems = deal.items.map(item => ({
      product_id: item.product_id,
      product_name: `${item.product_name} (${deal.name})`,
      quantity: 1,
      unit_price: deal.discounted_price,
      sessions_allowed: item.sessions,
      sessions_consumed: 1, // First session consumed today
      item_group_name: deal.name,
      total_price: deal.discounted_price
    }));
    setCart([...cart, ...dealItems]);
  };

  // Add On-The-Fly Custom Package
  const handleAddCustomPackage = (pkg) => {
    const customItems = pkg.items.map(item => ({
      product_id: item.product_id,
      product_name: `${item.product_name} (Custom Bundle)`,
      quantity: 1,
      unit_price: item.price_override || 0,
      sessions_allowed: item.sessions,
      sessions_consumed: 1,
      item_group_name: pkg.package_name,
      total_price: item.price_override || 0
    }));
    setCart([...cart, ...customItems]);
    setIsCustomPackageOpen(false);
  };

  // Remove Item from Cart
  const handleRemoveItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Update Item Sessions or Quantities
  const handleUpdateItem = (index, field, value) => {
    const updated = [...cart];
    updated[index][field] = value;
    if (field === 'unit_price' || field === 'quantity') {
      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    }
    setCart(updated);
  };

  // Execute Quick Checkout
  const handleDirectCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please select at least one treatment.');
      return;
    }

    const payload = {
      customer_id: selectedPatient.id,
      doctor_id: parseInt(selectedDoctorId),
      items: cart,
      subtotal,
      discount_amount: parseFloat(discountAmount) || 0,
      tax_amount: parseFloat(taxAmount) || 0,
      grand_total: grandTotal,
      paid_amount: parseFloat(paidAmount) || 0,
      payment_method: paymentMethod,
      clinical_remarks: sessionRemarks
    };

    const result = await onCheckout(payload);
    if (result && result.sale) {
      setCompletedSale(result.sale);
    }
  };

  // Save Inline Walk-In Patient
  const handleSaveWalkInPatient = async (e) => {
    e.preventDefault();
    if (!newPatientName || !newPatientPhone) return;

    const res = await onRegisterPatient({
      name: newPatientName,
      phone: newPatientPhone,
      skin_type: newPatientSkin
    });

    if (res && res.patient) {
      setSelectedPatientId(res.patient.id);
      setIsAddPatientOpen(false);
      setNewPatientName('');
      setNewPatientPhone('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top POS Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Clinical POS & Treatment Billing</h1>
            <p className="text-xs text-slate-400">Reception Counter Terminal | Next Inv: <span className="text-teal-400 font-mono">INV-0043</span></p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCustomPackageOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/20 transition"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Custom Bundle Builder</span>
          </button>

          <button
            onClick={() => window.open(window.location.href, '_blank')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition"
            title="Open secondary POS counter window"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>New Sale Window</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split POS Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL (7 Cols): Patient Info, Service Search & Cart Table */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Patient Selection & Live Badges */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <span>Patient / Client (PRM)</span>
              </label>
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1 font-medium"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Walk-In Patient</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full glass-input text-xs cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} — {p.phone} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Badges (Visit Count, Balance Due, Advance Wallet) */}
              <div className="sm:col-span-4 flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                  Visits: {selectedPatient?.visit_count || 0}
                </span>

                {selectedPatient?.current_balance > 0 ? (
                  <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/30 whitespace-nowrap" title="Outstanding Due">
                    Due: PKR {selectedPatient.current_balance}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 whitespace-nowrap" title="Advance Wallet Balance">
                    Wallet: PKR {selectedPatient?.advance_balance || 0}
                  </span>
                )}
              </div>
            </div>

            {/* Treating Doctor Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-6">
                <label className="text-[11px] text-slate-400 flex items-center space-x-1 mb-1">
                  <Stethoscope className="w-3 h-3 text-teal-400" />
                  <span>Treating Doctor / Aesthetician</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full glass-input text-xs"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                      {d.name} ({d.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="text-[11px] text-slate-400 flex items-center space-x-1 mb-1">
                  <FileText className="w-3 h-3 text-teal-400" />
                  <span>Clinical Remarks / Energy Parameters</span>
                </label>
                <input
                  type="text"
                  value={sessionRemarks}
                  onChange={(e) => setSessionRemarks(e.target.value)}
                  placeholder="e.g. Fluence 14J/cm2, Spot 10mm"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Treatment Search & Quick Add Pills */}
          <div className="glass-panel p-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search procedures (HydraFacial, Laser, Botox, Carbon Peel, Sunblock)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-9 text-xs"
              />
            </div>

            {/* Filtered Procedure Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {products
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className="glass-card p-2.5 flex items-center justify-between cursor-pointer hover:border-teal-500/50 hover:bg-slate-800/80 transition group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {prod.sku} • {prod.is_service ? 'Clinical Procedure' : 'Retail Skincare'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-teal-400">
                        PKR {prod.selling_price.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-teal-500 font-semibold group-hover:underline">+ Add</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Predefined Deals Section */}
            {deals.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Featured Package Deals</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => handleAddDeal(deal)}
                      className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-cyan-200">{deal.name}</div>
                        <div className="text-[10px] text-cyan-400/80">{deal.description}</div>
                      </div>
                      <span className="text-xs font-bold text-cyan-300 whitespace-nowrap ml-2">
                        PKR {deal.discounted_price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Treatment Cart Table */}
          <div className="glass-panel p-4">
            <TreatmentCart
              cart={cart}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
            />
          </div>

        </div>

        {/* RIGHT PANEL (5 Cols): Checkout, Discounts, Split Payment, Token Badge */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-5 space-y-4">
            
            {/* Queue Token Badge */}
            <div className="flex items-center justify-between bg-gradient-to-r from-teal-950/60 to-cyan-950/60 p-3 rounded-xl border border-teal-500/30">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">Lounge Token Assigned</span>
                <div className="text-2xl font-black text-white font-mono">P-01</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Target Area</span>
                <div className="text-xs font-semibold text-teal-300">Facial & Laser Suite 2</div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold font-mono">PKR {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>Discount (PKR):</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 glass-input text-right text-xs py-1"
                />
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>Tax / GST:</span>
                <input
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  className="w-28 glass-input text-right text-xs py-1"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/10">
                <span className="text-teal-300">Total Payable:</span>
                <span className="text-lg font-black text-teal-400 font-mono">PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-slate-300">Payment Collection Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'card', 'split', 'wallet'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(mode);
                      if (mode === 'split') setIsSplitCheckoutOpen(true);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition ${
                      paymentMethod === mode
                        ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount Field */}
            {paymentMethod !== 'split' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Amount Paid Now (PKR)</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input text-sm font-bold text-teal-300 py-2"
                />
                {paidAmount < grandTotal && (
                  <div className="text-[11px] text-rose-400 flex items-center space-x-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>PKR {(grandTotal - paidAmount).toLocaleString()} will be recorded as Patient Due Balance</span>
                  </div>
                )}
              </div>
            )}

            {/* Print Selection */}
            <div className="flex items-center justify-between text-xs text-slate-300 pt-2">
              <span>Print Format:</span>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="printMode"
                    value="80mm"
                    checked={printMode === '80mm'}
                    onChange={(e) => setPrintMode(e.target.value)}
                  />
                  <span>80mm Thermal Slip</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="printMode"
                    value="a4"
                    checked={printMode === 'a4'}
                    onChange={(e) => setPrintMode(e.target.value)}
                  />
                  <span>A4 Clinical Invoice</span>
                </label>
              </div>
            </div>

            {/* Complete Sale & Print Action Button */}
            <button
              onClick={handleDirectCheckout}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Sale & Print ({printMode.toUpperCase()})</span>
            </button>

          </div>

          {/* Quick Doctor AI Insight Box */}
          <div className="glass-panel p-4 bg-gradient-to-br from-slate-900/90 to-teal-950/40 border border-teal-500/20">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Clinical Protocol Note</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Patient is Fitzpatrick Type III. For Diode laser, calibrate fluence between 12-14 J/cm² with active skin cooling. Ensure post-procedure mineral SPF 60 is applied.
            </p>
          </div>

        </div>

      </div>

      {/* MODAL 1: Inline Walk-In Patient Registration */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>Quick Register Walk-In Patient</span>
              </h3>
              <button onClick={() => setIsAddPatientOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveWalkInPatient} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Sana Mir"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full glass-input text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Fitzpatrick Skin Classification</label>
                <select
                  value={newPatientSkin}
                  onChange={(e) => setNewPatientSkin(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  <option value="Fitzpatrick Type I">Type I - Very Fair, Always Burns</option>
                  <option value="Fitzpatrick Type II">Type II - Fair Skin, Burns Easily</option>
                  <option value="Fitzpatrick Type III">Type III - Medium Asian, Moderate Sunburn</option>
                  <option value="Fitzpatrick Type IV">Type IV - Olive / Darker Asian</option>
                  <option value="Fitzpatrick Type V">Type V - Brown Skin, Rarely Burns</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg shadow-md"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Custom On-The-Fly Package Dialog */}
      {isCustomPackageOpen && (
        <CustomPackageModal
          products={products}
          onClose={() => setIsCustomPackageOpen(false)}
          onSave={handleAddCustomPackage}
        />
      )}

      {/* MODAL 3: Split Checkout Dialog */}
      {isSplitCheckoutOpen && (
        <SplitCheckoutModal
          grandTotal={grandTotal}
          onClose={() => setIsSplitCheckoutOpen(false)}
          onSubmit={(splits) => {
            setIsSplitCheckoutOpen(false);
            handleDirectCheckout();
          }}
        />
      )}

      {/* Print Previews (80mm Thermal Receipt or A4 Medical Invoice) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/20 p-6 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Sale Successfully Completed!</h3>
              </div>
              <button onClick={() => setCompletedSale(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Print Component */}
            <div id="print-area">
              {printMode === '80mm' ? (
                <ThermalReceipt sale={completedSale} />
              ) : (
                <MedicalInvoiceA4 sale={completedSale} />
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPrintMode('80mm')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${printMode === '80mm' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  80mm Thermal
                </button>
                <button
                  onClick={() => setPrintMode('a4')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${printMode === 'a4' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  A4 Medical Invoice
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
