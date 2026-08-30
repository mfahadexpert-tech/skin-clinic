/**
 * ==============================================================================
 * SkinLab AI - Module 3: POS Treatment Billing Terminal
 * 10+ Years Senior UI/UX Designer Redesign (DocuVerse Clean Standard)
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
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 1);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || 1);
  const [sessionRemarks, setSessionRemarks] = useState('Session 1 completed. Advised SPF 50+.');
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

  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(6000);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isCustomPackageOpen, setIsCustomPackageOpen] = useState(false);
  const [isSplitCheckoutOpen, setIsSplitCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [printMode, setPrintMode] = useState('80mm');

  const selectedPatient = patients.find(p => p.id === parseInt(selectedPatientId)) || patients[0];
  const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  useEffect(() => {
    setPaidAmount(grandTotal);
  }, [grandTotal]);

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

  const handleDirectCheckout = async () => {
    if (cart.length === 0) {
      alert('Please select at least one treatment.');
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

  return (
    <div className="space-y-6">
      
      {/* Top Banner Card */}
      <div className="docu-card p-6 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Clinical POS & Treatment Billing</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Front desk cashier counter & package check-out</p>
          </div>
        </div>

        <button
          onClick={() => setIsCustomPackageOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-md transition"
        >
          <PackagePlus className="w-4 h-4" />
          <span>+ Create Custom Package</span>
        </button>
      </div>

      {/* 2-Column Split Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 Cols): Patient, Procedure Catalog & Cart */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Patient Selection Card */}
          <div className="docu-card p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Select Patient</span>
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="text-xs text-emerald-600 hover:underline font-bold flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New Patient</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-[#0f172a] rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-emerald-500"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {p.phone} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-700">
                  Visits: {selectedPatient?.visit_count || 0}
                </span>

                {selectedPatient?.current_balance > 0 ? (
                  <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Due: PKR {selectedPatient.current_balance}
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Wallet: PKR {selectedPatient?.advance_balance || 0}
                  </span>
                )}
              </div>
            </div>

            {/* Doctor & Session Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
              <div className="sm:col-span-6">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Treating Specialist</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-[#0f172a] rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-6">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Session Remarks</label>
                <input
                  type="text"
                  value={sessionRemarks}
                  onChange={(e) => setSessionRemarks(e.target.value)}
                  placeholder="e.g. Session 1 done, SPF 50 advised"
                  className="w-full bg-slate-50 border border-slate-200 text-[#0f172a] rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>
            </div>
          </div>

          {/* Procedure Search & Quick Add */}
          <div className="docu-card p-6 space-y-4 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search procedures (HydraFacial, Laser, Carbon Peel, Botox)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-[#0f172a] font-medium outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-44 overflow-y-auto pr-1">
              {products
                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0f172a] group-hover:text-emerald-700">{prod.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{prod.is_service ? 'Clinical Procedure' : 'Retail'}</div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 font-mono">
                      PKR {prod.selling_price.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Treatment Cart Table */}
          <div className="docu-card p-6 bg-white">
            <TreatmentCart
              cart={cart}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
            />
          </div>

        </div>

        {/* RIGHT COLUMN (5 Cols): Price Summary & Checkout */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="docu-card p-6 space-y-5 bg-white">
            
            {/* Queue Token Badge */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div>
                <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-wider">Queue Token</span>
                <div className="text-3xl font-black text-[#0f172a] font-mono mt-0.5">P-01</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-medium">Room Assigned</span>
                <div className="text-xs font-bold text-emerald-800">Treatment Suite 2</div>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600 font-semibold">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-[#0f172a]">PKR {subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span>Discount (PKR):</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-slate-50 border border-slate-200 text-right text-xs py-1 px-2 rounded-lg font-mono font-bold outline-none"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-[#0f172a] pt-3 border-t border-slate-100">
                <span>Total Payable:</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Method Pills */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-[#0f172a]">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'card', 'split', 'wallet'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(mode);
                      if (mode === 'split') setIsSplitCheckoutOpen(true);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition ${
                      paymentMethod === mode
                        ? 'bg-[#0f172a] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                <label className="text-xs font-bold text-[#0f172a]">Amount Paid Now (PKR)</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-extrabold text-[#0f172a] font-mono outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Complete Sale CTA */}
            <button
              onClick={handleDirectCheckout}
              className="w-full py-3.5 rounded-full font-extrabold text-xs bg-[#059669] hover:bg-[#047857] text-white shadow-md shadow-emerald-700/20 flex items-center justify-center space-x-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Sale & Print Receipt</span>
            </button>

          </div>

        </div>

      </div>

      {/* Print Previews Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Sale Completed Successfully!</h3>
              <button onClick={() => setCompletedSale(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div id="print-area">
              {printMode === '80mm' ? (
                <ThermalReceipt sale={completedSale} />
              ) : (
                <MedicalInvoiceA4 sale={completedSale} />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#059669] text-white font-bold rounded-full text-xs shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
