import React from "react";
import { AlertCircle, CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, FileText, ArrowRight } from "lucide-react";

/**
 * Token Prominence Badge
 */
export function TokenBadge({ tokenNumber, status = "waiting", size = "md" }) {
  const isLarge = size === "lg";
  const formattedToken = String(tokenNumber).padStart(2, "0");

  let statusBg = "bg-[#253237] text-[#E0FBFC]";
  if (status === "cancelled") statusBg = "bg-rose-900 text-rose-100";
  if (status === "in_consultation") statusBg = "bg-emerald-900 text-emerald-100";

  return (
    <div className={`inline-flex flex-col items-center justify-center rounded-lg border border-[#9DB4C0] px-3 py-1.5 ${isLarge ? "p-4 min-w-[120px]" : "min-w-[70px]"} ${statusBg}`}>
      <span className="text-[10px] uppercase font-bold tracking-widest text-[#9DB4C0]">Token</span>
      <span className={`font-mono font-extrabold ${isLarge ? "text-4xl" : "text-xl"} leading-none mt-0.5`}>
        {formattedToken}
      </span>
    </div>
  );
}

/**
 * Status Badge for Appointments & Queue
 */
export function StatusBadge({ status, type = "appointment" }) {
  const normalized = (status || "").toLowerCase();

  const configs = {
    pending: { label: "Pending Approval", bg: "bg-amber-100 text-amber-900 border-amber-300", icon: Clock },
    confirmed: { label: "Confirmed", bg: "bg-[#C2DFE3] text-[#253237] border-[#9DB4C0]", icon: CheckCircle2 },
    declined: { label: "Declined", bg: "bg-rose-100 text-rose-900 border-rose-300", icon: XCircle },
    cancelled: { label: "Cancelled", bg: "bg-gray-200 text-gray-700 border-gray-400", icon: XCircle },
    completed: { label: "Completed", bg: "bg-emerald-100 text-emerald-900 border-emerald-300", icon: ShieldCheck },
    
    // Queue statuses
    not_checked_in: { label: "Not Checked-In", bg: "bg-slate-100 text-slate-700 border-slate-300", icon: Clock },
    waiting: { label: "Waiting in Queue", bg: "bg-[#E0FBFC] text-[#253237] border-[#9DB4C0] font-semibold", icon: Clock },
    called: { label: "Called to Chamber", bg: "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold animate-pulse", icon: AlertCircle },
    in_consultation: { label: "In Consultation", bg: "bg-teal-100 text-teal-900 border-teal-400 font-bold", icon: ShieldCheck },
  };

  const config = configs[normalized] || { label: status, bg: "bg-gray-100 text-gray-800 border-gray-300", icon: AlertCircle };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Confirmation Dialog Modal
 */
export function ConfirmationModal({ isOpen, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel, isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl border border-[#9DB4C0] max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-full ${isDestructive ? "bg-rose-100 text-rose-700" : "bg-[#C2DFE3] text-[#253237]"}`}>
            {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#253237]">{title}</h3>
            <p className="text-sm text-[#5C6B73] mt-1">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[#5C6B73] hover:text-[#253237] hover:bg-[#C2DFE3] rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-all ${
              isDestructive
                ? "bg-rose-700 hover:bg-rose-800 text-white"
                : "bg-[#253237] hover:bg-[#1b2428] text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Clinical Record Edit Audit Timeline
 */
export function AuditTimeline({ audits = [] }) {
  if (!audits || audits.length === 0) {
    return <p className="text-xs text-[#5C6B73] italic">No revisions recorded for this clinical record.</p>;
  }

  return (
    <div className="space-y-3 pt-2">
      <h5 className="text-xs font-bold uppercase tracking-wider text-[#5C6B73]">Immutable Clinical Revision Audit Trail</h5>
      <div className="relative pl-4 border-l-2 border-[#9DB4C0] space-y-4">
        {audits.map((audit, idx) => (
          <div key={audit.id || idx} className="relative text-xs">
            <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#253237] border-2 border-white" />
            <div className="flex items-center justify-between font-semibold text-[#253237]">
              <span>Modified: {audit.field_name.replace("_", " ")}</span>
              <span className="text-[#5C6B73] font-normal">{new Date(audit.created_at).toLocaleString()}</span>
            </div>
            <p className="text-[#5C6B73] mt-0.5"><span className="font-medium text-[#253237]">Reason:</span> {audit.reason || "Physician refinement"}</p>
            <div className="mt-1 bg-[#E0FBFC] p-2 rounded border border-[#9DB4C0] font-mono text-[11px] text-[#253237]">
              <div className="text-rose-800 line-through">Old: {audit.old_value || "(empty)"}</div>
              <div className="text-emerald-800 font-bold">New: {audit.new_value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Prescription Version History Viewer
 */
export function PrescriptionViewer({ prescription }) {
  if (!prescription) {
    return <p className="text-xs text-[#5C6B73] italic">No active prescription recorded for this visit.</p>;
  }

  const current = prescription.current_version;
  const allVersions = prescription.all_versions || [];

  return (
    <div className="space-y-3">
      {/* Current Version */}
      {current && (
        <div className="p-4 rounded-lg bg-[#E0FBFC] border border-[#9DB4C0] space-y-2">
          <div className="flex items-center justify-between border-b border-[#9DB4C0] pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#253237]" />
              <span className="text-sm font-bold text-[#253237]">
                Current Valid Prescription (v{current.version_number})
              </span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold rounded">
              Active Form
            </span>
          </div>

          <div className="divide-y divide-[#C2DFE3]">
            {(current.items || []).map((item, idx) => (
              <div key={idx} className="py-2 flex items-start justify-between text-xs">
                <div>
                  <div className="font-bold text-[#253237]">{item.medication_name} <span className="font-normal text-[#5C6B73]">({item.dosage})</span></div>
                  <div className="text-[#5C6B73] mt-0.5">{item.instructions || "Take as directed"}</div>
                </div>
                <div className="text-right text-[#5C6B73]">
                  <div className="font-semibold text-[#253237]">{item.frequency}</div>
                  <div>{item.duration}</div>
                </div>
              </div>
            ))}
          </div>

          {current.correction_reason && (
            <p className="text-[11px] text-[#5C6B73] pt-1 border-t border-[#C2DFE3]">
              <span className="font-semibold text-[#253237]">Justification:</span> {current.correction_reason}
            </p>
          )}
        </div>
      )}

      {/* Historical Versions Accordion */}
      {allVersions.length > 1 && (
        <details className="text-xs bg-[#C2DFE3]/50 p-3 rounded-lg border border-[#9DB4C0]">
          <summary className="font-semibold text-[#253237] cursor-pointer hover:underline">
            View Historical Revisions ({allVersions.length - 1} earlier versions)
          </summary>
          <div className="mt-3 space-y-2 pt-2 border-t border-[#9DB4C0]">
            {allVersions.filter(v => !v.is_current).map((v) => (
              <div key={v.id} className="p-2.5 bg-white rounded border border-[#9DB4C0] opacity-85">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#5C6B73]">
                  <span>Version {v.version_number} (Archived)</span>
                  <span>{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-1 space-y-1">
                  {(v.items || []).map((it, i) => (
                    <div key={i} className="text-[11px] text-[#5C6B73]">
                      • {it.medication_name} ({it.dosage}) - {it.frequency}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
