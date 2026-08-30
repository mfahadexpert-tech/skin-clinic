/**
 * ==============================================================================
 * SkinLab AI - Module 3: Standard A4 Clinical Medical Invoice Generator
 * ==============================================================================
 * Formats a formal A4 clinical invoice for medical reimbursement, insurance,
 * and comprehensive documentation.
 * ==============================================================================
 */

'use client';

import React from 'react';

export default function MedicalInvoiceA4({ sale }) {
  if (!sale) return null;

  return (
    <div className="bg-white text-black p-8 font-sans text-xs leading-normal max-w-2xl mx-auto border border-gray-300 shadow-md rounded-lg">
      
      {/* Header Banner */}
      <div className="flex justify-between items-start border-b-2 border-teal-600 pb-4">
        <div>
          <h1 className="text-xl font-bold text-teal-800 tracking-tight">SKIN LAB CLINIC</h1>
          <p className="text-xs text-gray-600">Aesthetic Medicine, Laser Care & Dermatology Center</p>
          <p className="text-xs text-gray-500">Plaza 45, Commercial Avenue, DHA Phase 5, Lahore</p>
          <p className="text-xs text-gray-500">Tel: +92 300 1234567 | info@skinlabclinic.com</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold bg-teal-100 text-teal-900 px-3 py-1 rounded">CLINICAL INVOICE</span>
          <div className="text-xs mt-2 font-mono"><strong>Invoice #:</strong> {sale.invoice_number}</div>
          <div className="text-xs font-mono"><strong>Date:</strong> {new Date(sale.date).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">Doctor PMDC: PMC-8921-DERMA</div>
        </div>
      </div>

      {/* Patient & Practitioner Details */}
      <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patient Information</h4>
          <div className="text-xs font-bold text-gray-900">{sale.customer_name}</div>
          <div className="text-[11px] text-gray-600">Medical ID (MRN): <span className="font-mono font-bold text-teal-700">{sale.customer_mrn || '0001-08-2026'}</span></div>
          <div className="text-[11px] text-gray-600">Queue Token: {sale.token_number || 'P-01'}</div>
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Attending Specialist</h4>
          <div className="text-xs font-bold text-gray-900">{sale.doctor_name || 'Dr. Sarah Khan'}</div>
          <div className="text-[11px] text-gray-600">Department: Aesthetic & Laser Dermatology</div>
          <div className="text-[11px] text-gray-600">Payment Status: <span className="uppercase font-bold text-teal-700">{sale.payment_status}</span></div>
        </div>
      </div>

      {/* Itemized Procedures Table */}
      <div className="my-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-teal-700 text-white text-[11px]">
              <th className="py-2 px-3">Procedure / Treatment Description</th>
              <th className="py-2 px-3 text-center">Package Sessions</th>
              <th className="py-2 px-3 text-center">Sessions Consumed</th>
              <th className="py-2 px-3 text-right">Unit Price (PKR)</th>
              <th className="py-2 px-3 text-right">Total (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs">
            {sale.items?.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-gray-900">{item.product_name}</div>
                  {item.item_group_name && <div className="text-[10px] text-teal-600 font-medium">Bundled: {item.item_group_name}</div>}
                </td>
                <td className="py-2.5 px-3 text-center font-mono">{item.sessions_allowed}</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold text-teal-700">{item.sessions_consumed || 1}</td>
                <td className="py-2.5 px-3 text-right font-mono">PKR {item.unit_price?.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">PKR {item.total_price?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clinical Notes & Vitals */}
      <div className="my-4 p-3 bg-teal-50/50 rounded-lg border border-teal-100 text-xs">
        <div className="font-bold text-teal-900 mb-1">Clinical Procedure Notes & Laser Parameters:</div>
        <p className="text-gray-700 leading-relaxed font-mono text-[11px]">
          {sale.clinical_remarks || 'Standard medical protocol executed. Patient instructed on post-procedure photoprotection.'}
        </p>
      </div>

      {/* Financial Summary */}
      <div className="flex justify-end my-4">
        <div className="w-64 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span className="font-mono">PKR {sale.subtotal?.toLocaleString()}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount:</span>
              <span className="font-mono text-red-600">-PKR {sale.discount_amount?.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-300">
            <span>Total Payable:</span>
            <span className="font-mono text-teal-800">PKR {sale.grand_total?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Amount Paid:</span>
            <span className="font-mono font-bold">PKR {sale.paid_amount?.toLocaleString()}</span>
          </div>
          {sale.grand_total - sale.paid_amount > 0 && (
            <div className="flex justify-between font-bold text-red-600 pt-1 border-t border-dashed border-gray-300">
              <span>Balance Remaining:</span>
              <span className="font-mono">PKR {(sale.grand_total - sale.paid_amount)?.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signatures & Legal Disclaimer */}
      <div className="pt-8 mt-6 border-t border-gray-300 flex justify-between items-end text-[10px] text-gray-500">
        <div>
          <p>Generated by: SkinLab AI Clinical Desk</p>
          <p>This document constitutes a valid clinical invoice.</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-gray-400 mb-1"></div>
          <p className="font-bold text-gray-800">Authorized Specialist Signature</p>
        </div>
      </div>

    </div>
  );
}
