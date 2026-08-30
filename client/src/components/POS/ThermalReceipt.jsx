/**
 * ==============================================================================
 * SkinLab AI - Module 3: 80mm ESC/POS Direct Thermal Slip Print Generator
 * ==============================================================================
 * Formats a high-speed receipt slip for front desk thermal printers with:
 * - Clinic Header, Contact & Tax License
 * - Patient MRN & Name
 * - Queue Token Number (e.g. P-01)
 * - Session details (Total Sessions, Used Today, Remaining Sessions)
 * - Due balance indicator
 * - Custom footer notes
 * ==============================================================================
 */

'use client';

import React from 'react';

export default function ThermalReceipt({ sale }) {
  if (!sale) return null;

  return (
    <div className="bg-white text-black p-4 font-mono text-[11px] leading-tight max-w-[320px] mx-auto border border-gray-300 shadow-sm rounded">
      
      {/* Clinic Header */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        <h2 className="text-sm font-black tracking-tight uppercase">Skin Lab Aesthetic Clinic</h2>
        <p className="text-[10px]">Dermatology, Laser & Medical Spa</p>
        <p className="text-[10px]">Plaza 45, DHA Phase 5, Lahore</p>
        <p className="text-[10px]">Phone: 0300-1234567 | Lic: PMC-DERMA-8921</p>
      </div>

      {/* Queue Token Highlight */}
      <div className="text-center py-2 bg-gray-100 my-2 border border-gray-300 rounded">
        <span className="text-[10px] uppercase font-bold text-gray-600">Waiting Lounge Token</span>
        <div className="text-2xl font-black">{sale.token_number || 'P-01'}</div>
      </div>

      {/* Patient & Doctor Meta */}
      <div className="space-y-1 py-1 border-b border-dashed border-gray-400 text-[10px]">
        <div className="flex justify-between">
          <span>Inv #: <strong>{sale.invoice_number}</strong></span>
          <span>Date: {new Date(sale.date).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Patient: <strong>{sale.customer_name}</strong></span>
          <span>MRN: {sale.customer_mrn || '0001-08-2026'}</span>
        </div>
        <div>
          <span>Doctor: <strong>{sale.doctor_name || 'Dr. Sarah Khan'}</strong></span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-2 border-b border-dashed border-gray-400">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-300 text-[10px]">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-center">Sess</th>
              <th className="pb-1 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1">
                  <div>{item.product_name}</div>
                  {item.sessions_allowed > 1 && (
                    <div className="text-[9px] text-gray-600">
                      Total: {item.sessions_allowed} | Used: {item.sessions_consumed} | Rem: {item.sessions_allowed - item.sessions_consumed}
                    </div>
                  )}
                </td>
                <td className="py-1 text-center font-bold">{item.sessions_consumed || 1}</td>
                <td className="py-1 text-right">PKR {item.total_price?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Totals */}
      <div className="py-2 space-y-1 border-b border-dashed border-gray-400 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>PKR {sale.subtotal?.toLocaleString()}</span>
        </div>
        {sale.discount_amount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-PKR {sale.discount_amount?.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
          <span>Grand Total:</span>
          <span>PKR {sale.grand_total?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid ({sale.payment_method?.toUpperCase()}):</span>
          <span>PKR {sale.paid_amount?.toLocaleString()}</span>
        </div>
        {sale.grand_total - sale.paid_amount > 0 && (
          <div className="flex justify-between font-bold text-red-600">
            <span>Balance Due:</span>
            <span>PKR {(sale.grand_total - sale.paid_amount)?.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Clinical Session Remarks */}
      {sale.clinical_remarks && (
        <div className="py-1.5 border-b border-dashed border-gray-400 text-[9px] text-gray-700">
          <strong>Clinical Remarks:</strong> {sale.clinical_remarks}
        </div>
      )}

      {/* Thermal Footer */}
      <div className="text-center pt-2 text-[9px] text-gray-600 leading-normal">
        <p>Appointments: 0300-1234567 | @SkinLabClinic</p>
        <p>Packages valid for 12 months. No refunds after 7 days.</p>
        <p className="font-bold pt-1">*** Thank you for choosing SkinLab ***</p>
      </div>

    </div>
  );
}
