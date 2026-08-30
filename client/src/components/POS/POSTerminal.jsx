/**
 * ==============================================================================
 * SkinLab AI - Module 3: Clinic POS & Treatment Billing Terminal (Simplified UI)
 * ==============================================================================
 * Clean, user-friendly, and streamlined for front-desk receptionists:
 * - Simple labels (Patient, Doctor, Skin Tone, Session Notes, Discount, Total)
 * - Quick treatment selection with clear pricing
 * - Easy package session counter (Sessions in Package vs Done Today)
 * - 1-Click Print (Thermal Receipt / Clinical Invoice)
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
  Layers, 
  AlertCircle,
  Tag,
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
  const [sessionRemarks, setSessionRemarks] = useState('Session 1 completed. Advised sunblock.');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([
    {
      product_id: 1,
      product_name: 'HydraFacial Deluxe',
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
  const [newPatientSkin, setNewPatientSkin] = useState('Medium Skin');

  const selectedPatient = patients.find(p => p.id === parseInt(selectedPatientId)) || patients[0];

  // Calculate Subtotal & Grand Total
  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

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
          sessions_consumed: 1,
          item_group_name: null,
          total_price: product.selling_price
        }
      ]);
    }
  };

  // Add Package Deal to Cart
  const handleAddDeal = (deal) => {
    const dealItems = deal.items.map(item => ({
      product_id: item.product_id,
      product_name: `${item.product_name} (${deal.name})`,
      quantity: 1,
      unit_price: deal.discounted_price,
      sessions_allowed: item.sessions,
      sessions_consumed: 1,
      item_group_name: deal.name,
      total_price: deal.discounted_price
    }));
    setCart([...cart, ...dealItems]);
  };

  // Add Custom Package
  const handleAddCustomPackage = (pkg) => {
    const customItems = pkg.items.map(item => ({
      product_id: item.product_id,
      product_name: `${item.product_name} (Bundle)`,
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

  const handleRemoveItem = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...cart];
    updated[index][field] = value;
    if (field === 'unit_price' || field === 'quantity') {
      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    }
    setCart(updated);
  };

  // Direct Checkout
  const handleDirectCheckout = async () => {
    if (cart.length === 0) {
      alert('Please add at least one treatment to the cart.');
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

  // Quick Register Patient
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
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Treatment Billing & Check-in</h1>
            <p className="text-xs text-slate-400">Front Desk Counter</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCustomPackageOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow transition"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Create Custom Package</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT PANEL (7 Cols): Patient Info, Service Search & Cart */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Patient Selection */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Select Patient</label>
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1 font-semibold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New Patient</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-8">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full glass-input text-xs cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} • {p.phone} (ID: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Badges */}
              <div className="sm:col-span-4 flex items-center space-x-1.5">
                <span className="text-xs px-2 py-1 rounded-md font-medium bg-slate-800 text-slate-300 border border-white/10 whitespace-nowrap">
                  Visits: {selectedPatient?.visit_count || 0}
                </span>

                {selectedPatient?.current_balance > 0 ? (
                  <span className="text-xs px-2 py-1 rounded-md font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                    Due: PKR {selectedPatient.current_balance}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-md font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    Wallet: PKR {selectedPatient?.advance_balance || 0}
                  </span>
                )}
              </div>
            </div>

            {/* Doctor & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
              <div className="sm:col-span-6">
                <label className="text-[11px] text-slate-400 flex items-center space-x-1 mb-1">
                  <Stethoscope className="w-3 h-3 text-teal-400" />
                  <span>Treating Specialist</span>
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
                  <span>Session Notes</span>
                </label>
                <input
                  type="text"
                  value={sessionRemarks}
                  onChange={(e) => setSessionRemarks(e.target.value)}
                  placeholder="e.g. Session 1 done, SPF 50 advised"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Treatment Search */}
          <div className="glass-panel p-4 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search procedures (HydraFacial, Laser, Carbon Peel, Sunblock)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-8 text-xs py-2"
              />
            </div>

            {/* Quick Service Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {products
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className="glass-card p-2.5 flex items-center justify-between cursor-pointer hover:border-teal-500/50 hover:bg-slate-800 transition group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {prod.is_service ? 'Procedure' : 'Skincare Item'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-teal-400">
                        PKR {prod.selling_price.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-teal-400 font-semibold group-hover:underline">+ Select</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Featured Deals */}
            {deals.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>Special Multi-Session Packages</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => handleAddDeal(deal)}
                      className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition flex items-center justify-between"
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

          {/* Cart Table */}
          <div className="glass-panel p-4">
            <TreatmentCart
              cart={cart}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
            />
          </div>

        </div>

        {/* RIGHT PANEL (5 Cols): Checkout, Price Summary, Print Mode */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="glass-panel p-5 space-y-4">
            
            {/* Token Badge */}
            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-teal-500/30">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-400">Waiting Queue Token</span>
                <div className="text-2xl font-black text-white font-mono">P-01</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Room Allocation</span>
                <div className="text-xs font-semibold text-teal-300">Treatment Suite 2</div>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
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
                  className="w-24 glass-input text-right text-xs py-1"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/10">
                <span className="text-teal-300">Total Payable:</span>
                <span className="text-lg font-black text-teal-400 font-mono">PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-slate-200">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'card', 'split', 'wallet'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(mode);
                      if (mode === 'split') setIsSplitCheckoutOpen(true);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize transition ${
                      paymentMethod === mode
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount */}
            {paymentMethod !== 'split' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-200">Amount Paid Now (PKR)</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full glass-input text-sm font-bold text-teal-300 py-2"
                />
                {paidAmount < grandTotal && (
                  <div className="text-[11px] text-rose-400 flex items-center space-x-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>PKR {(grandTotal - paidAmount).toLocaleString()} recorded as remaining due</span>
                  </div>
                )}
              </div>
            )}

            {/* Print Selection */}
            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span>Receipt Format:</span>
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
                  <span>A4 Invoice</span>
                </label>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleDirectCheckout}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-lg flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Sale & Print ({printMode.toUpperCase()})</span>
            </button>

          </div>

          {/* Quick Doctor Protocol Summary */}
          <div className="glass-panel p-3.5 bg-slate-900/80 border border-teal-500/20 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-teal-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Doctor Quick Tip</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Skin Type: <strong>Medium Asian</strong>. Always recommend mineral SPF 50+ sunblock after laser and peels. Avoid hot water for 48 hours.
            </p>
          </div>

        </div>

      </div>

      {/* MODAL 1: Walk-In Registration */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <span>Quick Register Walk-In Patient</span>
              </h3>
              <button onClick={() => setIsAddPatientOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveWalkInPatient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300">Patient Full Name *</label>
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
                <label className="text-slate-300">Phone Number *</label>
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
                <label className="text-slate-300">Skin Tone / Type</label>
                <select
                  value={newPatientSkin}
                  onChange={(e) => setNewPatientSkin(e.target.value)}
                  className="w-full glass-input text-xs mt-1"
                >
                  <option value="Fair Skin (Burns Easily)">Fair Skin (Burns Easily)</option>
                  <option value="Medium Asian (Standard)">Medium Asian (Standard)</option>
                  <option value="Olive / Darker Asian">Olive / Darker Asian</option>
                  <option value="Brown / Tan Skin">Brown / Tan Skin</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Custom Package */}
      {isCustomPackageOpen && (
        <CustomPackageModal
          products={products}
          onClose={() => setIsCustomPackageOpen(false)}
          onSave={handleAddCustomPackage}
        />
      )}

      {/* MODAL 3: Split Checkout */}
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

      {/* Print Previews */}
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
                  80mm Slip
                </button>
                <button
                  onClick={() => setPrintMode('a4')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${printMode === 'a4' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  A4 Invoice
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
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
