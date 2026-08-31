/**
 * ==============================================================================
 * SkinLab AI - Reusable Design System Component Library
 * ==============================================================================
 * Premium Clinical SaaS Design System Tokens & Reusable UI Components:
 * - Light Clinical Canvas (`#f8fafc` / `#ffffff`)
 * - Dark Slate Navigation (`#0f172a`)
 * - Emerald Primary Actions (`#059669`)
 * - Restrained Amber / Orange / Rose Alerts
 * - Responsive for Desktop, Tablet, and Reception Touchscreens
 * ==============================================================================
 */

'use client';

import React from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle, Inbox } from 'lucide-react';

// 1. PAGE HEADER
export function PageHeader({ icon: Icon, title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center space-x-3.5">
        {Icon && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center space-x-2.5">{actions}</div>}
    </div>
  );
}

// 2. KPI METRIC CARD
export function KPICard({ title, value, subtitle, trend, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${colorMap[color] || colorMap.emerald}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-200">
          {trend}
        </div>
      )}
    </div>
  );
}

// 3. CLINICAL BADGE
export function ClinicalBadge({ variant = 'slate', children }) {
  const badgeStyles = {
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    amber: 'bg-amber-100 text-amber-800 border-amber-300',
    rose: 'bg-rose-100 text-rose-800 border-rose-300',
    slate: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold border ${badgeStyles[variant] || badgeStyles.slate}`}>
      {children}
    </span>
  );
}

// 4. CLINICAL BUTTON
export function ClinicalButton({ variant = 'emerald', size = 'md', children, onClick, type = 'button', disabled = false, className = '' }) {
  const variants = {
    emerald: 'bg-emerald-600 hover:bg-slate-900 text-white font-black shadow-sm',
    slate: 'bg-slate-900 hover:bg-slate-800 text-white font-extrabold shadow-sm',
    orange: 'bg-orange-600 hover:bg-slate-900 text-white font-black shadow-sm',
    outline: 'bg-white hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-300 font-bold',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 font-bold'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-xs rounded-xl',
    lg: 'px-5 py-3 text-sm rounded-xl'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.emerald} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </button>
  );
}

// 5. CLINICAL TABLE WRAPPER
export function ClinicalTable({ headers = [], children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-slate-700 font-black bg-slate-100">
            {headers.map((h, i) => (
              <th key={i} className={`py-3 px-3.5 ${h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : ''}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-900 font-medium">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// 6. CLINICAL INPUT & SELECT
export function ClinicalInput({ label, error, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-extrabold text-slate-800">{label}</label>}
      <input
        {...props}
        className={`w-full glass-input text-xs font-bold text-slate-900 py-2.5 px-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition ${props.className || ''}`}
      />
      {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
    </div>
  );
}

export function ClinicalSelect({ label, options = [], ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-extrabold text-slate-800">{label}</label>}
      <select
        {...props}
        className={`w-full glass-input text-xs font-bold text-slate-900 py-2.5 px-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition cursor-pointer ${props.className || ''}`}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt.value} className="bg-white text-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// 7. CLINICAL MODAL
export function ClinicalModal({ isOpen, onClose, title, icon: Icon, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 p-6 rounded-2xl max-w-lg w-full shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
            {Icon && <Icon className="w-4.5 h-4.5 text-emerald-600" />}
            <span>{title}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// 8. CLINICAL ALERT
export function ClinicalAlert({ type = 'info', title, message }) {
  const styles = {
    info: 'bg-blue-50 text-blue-900 border-blue-200 icon-text-blue-600',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200 icon-text-emerald-600',
    warning: 'bg-amber-50 text-amber-900 border-amber-200 icon-text-amber-600',
    danger: 'bg-rose-50 text-rose-900 border-rose-200 icon-text-rose-600'
  };

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle
  };

  const AlertIcon = icons[type] || Info;

  return (
    <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start space-x-3 ${styles[type]}`}>
      <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        {title && <div className="font-extrabold text-slate-900 text-xs mb-0.5">{title}</div>}
        <div>{message}</div>
      </div>
    </div>
  );
}

// 9. SKELETON LOADER
export function SkeletonLoader({ rows = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-200 rounded-xl w-full" />
      ))}
    </div>
  );
}

// 10. EMPTY STATE
export function EmptyState({ icon: Icon = Inbox, title = "No Records Found", description = "There are no items to display at this time.", action }) {
  return (
    <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
      <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl mx-auto flex items-center justify-center border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-sm mx-auto">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
