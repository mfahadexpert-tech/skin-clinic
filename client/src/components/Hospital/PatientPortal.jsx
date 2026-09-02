import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, Bot, FileText, CreditCard, Bell, User, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, ChevronRight, XCircle, Search, Sparkles 
} from "lucide-react";
import { hospitalApi } from "../../lib/hospitalApi";
import { TokenBadge, StatusBadge, PrescriptionViewer } from "./SharedComponents";

const DEFAULT_AESTHETIC_SERVICES = [
  { id: "srv-01", name: "Dermatology & Skin Assessment", category: "Clinical", base_price: 2500, duration_minutes: 30, description: "Comprehensive skin examination and acne grade assessment." },
  { id: "srv-02", name: "Fractional CO2 Laser Resurfacing", category: "Laser & Aesthetics", base_price: 8500, duration_minutes: 45, description: "Deep acne scar repair and pore tightening." },
  { id: "srv-03", name: "HydraFacial MD Elite Glow", category: "Medical Facial", base_price: 6000, duration_minutes: 40, description: "Deep pore extraction, exfoliation, and hydration infusion." },
  { id: "srv-04", name: "PRP Hair Restoration & Scalp Boost", category: "Trichology", base_price: 9500, duration_minutes: 45, description: "Autologous plasma scalp therapy for hair density." },
  { id: "srv-05", name: "Medical Chemical Peel (Glycolic/TCA)", category: "Aesthetic Dermatology", base_price: 4500, duration_minutes: 30, description: "Targets melasma, hyperpigmentation, and active breakouts." },
  { id: "srv-06", name: "Q-Switched Nd:YAG Carbon Laser Peel", category: "Laser Aesthetics", base_price: 7000, duration_minutes: 35, description: "Hollywood Carbon Laser for instant brightening and oil control." },
  { id: "srv-07", name: "HIFU Non-Surgical Face Lifting", category: "Skin Tightening", base_price: 15000, duration_minutes: 60, description: "Ultrasound SMAS lifting and jawline sculpting." },
  { id: "srv-08", name: "Microneedling RF (Scar & Texture Repair)", category: "Skin Rejuvenation", base_price: 9000, duration_minutes: 45, description: "Radiofrequency collagen remodeling for acne scars." },
  { id: "srv-09", name: "Triple-Wavelength Diode Laser Hair Removal", category: "Laser Care", base_price: 5500, duration_minutes: 30, description: "Ice-cooling diode laser for smooth, permanent hair reduction." },
  { id: "srv-10", name: "Glutathione Radiance IV Infusion", category: "Wellness & Glow", base_price: 6500, duration_minutes: 45, description: "Antioxidant brightening infusion with Vitamin C." },
  { id: "srv-11", name: "Acne Scar Subcision & TCA Cross", category: "Clinical Dermatology", base_price: 8000, duration_minutes: 40, description: "Surgical scar release and icepick scar remodeling." },
  { id: "srv-12", name: "Botox / Dysport Anti-Wrinkle Smoothing", category: "Injectables & Anti-Aging", base_price: 18000, duration_minutes: 30, description: "Targeted wrinkle smoothing for forehead and crow's feet." },
  { id: "srv-13", name: "Hyaluronic Acid Lip & Cheek Filler", category: "Dermal Fillers", base_price: 22000, duration_minutes: 40, description: "Natural volume contouring and hydration." },
  { id: "srv-14", name: "Under-Eye Dark Circle PRP Therapy", category: "Aesthetic Rejuvenation", base_price: 7500, duration_minutes: 35, description: "Tear trough rejuvenation and pigmentation correction." }
];

const DEFAULT_AESTHETIC_DOCTORS = [
  {
    id: "doc-01",
    full_name: "Dr. Ahmed Tariq",
    specialization: "Consultant Dermatologist & Laser Specialist",
    consultation_fee: 2500,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    start_time: "09:00",
    end_time: "17:00"
  },
  {
    id: "doc-02",
    full_name: "Dr. Sarah Khan",
    specialization: "Aesthetic Physician & Trichologist",
    consultation_fee: 2000,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    start_time: "10:00",
    end_time: "18:00"
  }
];

export default function PatientPortal({ patientId = "pat-01", onOpenAI }) {
  const [appointments, setAppointments] = useState([]);
  const [clinicalRecords, setClinicalRecords] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [doctors, setDoctors] = useState(DEFAULT_AESTHETIC_DOCTORS);
  const [services, setServices] = useState(DEFAULT_AESTHETIC_SERVICES);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Booking Stepper State (Steps 1 to 5)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedBookingPath, setSelectedBookingPath] = useState("doctor"); // "doctor" or "service"
  const [selectedDoctor, setSelectedDoctor] = useState(DEFAULT_AESTHETIC_DOCTORS[0]);
  const [selectedService, setSelectedService] = useState(DEFAULT_AESTHETIC_SERVICES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [tokenMetrics, setTokenMetrics] = useState(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  // Notification Preferences State
  const [prefForm, setPrefForm] = useState({
    primary_channel: "whatsapp",
    backup_channel: "email"
  });

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const [appts, records, fin, docList, srvList] = await Promise.all([
        hospitalApi.getPatientAppointments(patientId),
        hospitalApi.getPatientClinicalRecords(patientId, "patient", patientId),
        hospitalApi.getPatientFinancialSummary(patientId),
        hospitalApi.getDoctors(),
        hospitalApi.getServices()
      ]);
      setAppointments(appts || []);
      setClinicalRecords(records || []);
      setFinancials(fin);
      if (docList && docList.length > 0) setDoctors(docList);
      if (srvList && srvList.length > 0) setServices(srvList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const handleFetchTokenMetrics = async (docId, dateStr) => {
    try {
      const metrics = await hospitalApi.getTokenMetrics(docId, dateStr);
      setTokenMetrics(metrics);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartBooking = (initialDoc = null, initialSrv = null) => {
    setSelectedDoctor(initialDoc || doctors[0] || null);
    setSelectedService(initialSrv || services[0] || null);
    setBookingStep(1);
    setBookingResult(null);
    setShowBookingModal(true);
    if (initialDoc) {
      handleFetchTokenMetrics(initialDoc.id, selectedDate);
    }
  };

  const handleStepDateSelect = (newDate) => {
    setSelectedDate(newDate);
    if (selectedDoctor) {
      handleFetchTokenMetrics(selectedDoctor.id, newDate);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedDoctor || !selectedService) return;
    try {
      const res = await hospitalApi.createBookingRequest({
        patient_id: patientId,
        doctor_id: selectedDoctor.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        booking_source: "patient_portal",
        notes: bookingNotes
      });
      setBookingResult(res);
      setBookingStep(5);
      loadPatientData();
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleCheckInSelf = async (apptId) => {
    try {
      await hospitalApi.checkInPatient(apptId);
      setToast({ type: "success", text: "Checked in successfully! You are now active in the doctor's waiting queue." });
      loadPatientData();
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleCancelAppt = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment? Your token will be permanently retired.")) return;
    try {
      await hospitalApi.cancelAppointment(apptId, patientId, "patient", "Cancelled by patient via portal");
      setToast({ type: "success", text: "Appointment cancelled successfully. Token retired." });
      loadPatientData();
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const upcomingAppt = appointments.find(a => a.status === "confirmed" || a.status === "pending");

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm ${
          toast.type === "success" ? "bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0]" : "bg-rose-100 text-rose-900 border border-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-800" /> : <AlertCircle className="w-5 h-5 text-rose-800" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#9DB4C0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#253237]">Patient Health Portal</h1>
            <span className="px-2.5 py-0.5 bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0] rounded-full text-xs font-bold">
              Zainab Fatima (pat-01)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5C6B73] mt-0.5">Manage token appointments, view versioned prescriptions, and access medical records</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleStartBooking()}
            className="btn-primary text-xs sm:text-sm px-5 py-3 shadow-md"
          >
            <Calendar className="w-4 h-4" /> Book New Appointment
          </button>

          <button
            onClick={onOpenAI}
            className="btn-secondary text-xs sm:text-sm px-4 py-3 flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-[#253237]" /> Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Prominent Next Upcoming Token Card */}
      {upcomingAppt && (
        <div className="bg-[#E0FBFC] p-6 rounded-2xl border-2 border-[#253237] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <TokenBadge tokenNumber={upcomingAppt.token_number} status={upcomingAppt.queue_status || "waiting"} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-[#5C6B73] tracking-widest">Next Appointment</span>
                <StatusBadge status={upcomingAppt.status} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#253237] mt-1">{upcomingAppt.doctor_name}</h2>
              <p className="text-xs sm:text-sm text-[#5C6B73] mt-0.5">
                {upcomingAppt.service_name} • Date: <strong>{upcomingAppt.appointment_date}</strong>
              </p>
              {upcomingAppt.status === "pending" && (
                <p className="text-xs font-semibold text-amber-900 mt-2 bg-amber-100/80 px-2.5 py-1 rounded border border-amber-300 inline-block">
                  Awaiting Receptionist Review & Approval
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 self-end sm:self-center">
            {upcomingAppt.status === "confirmed" && upcomingAppt.queue_status === "not_checked_in" && (
              <button
                onClick={() => handleCheckInSelf(upcomingAppt.id)}
                className="btn-primary text-xs sm:text-sm px-5 py-2.5"
              >
                Self Check-In (Enter Queue)
              </button>
            )}

            <button
              onClick={() => handleCancelAppt(upcomingAppt.id)}
              className="px-4 py-2.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold rounded-lg transition-colors"
            >
              Cancel Appointment
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Portal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Clinical History & Prescriptions (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Permitted Clinical History */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-base text-[#253237] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5C6B73]" /> My Medical History & Diagnoses
              </h3>
              <span className="text-xs text-[#5C6B73] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Patient Permitted View
              </span>
            </div>

            {clinicalRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5C6B73]">
                No completed clinical records found on file.
              </div>
            ) : (
              clinicalRecords.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-[#9DB4C0] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-2">
                    <div>
                      <div className="font-bold text-sm text-[#253237]">{rec.visit_date} — {rec.service_name || "Consultation"}</div>
                      <div className="text-xs text-[#5C6B73]">Attending Physician: {rec.doctor_name}</div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#E0FBFC] border border-[#9DB4C0] text-[11px] font-bold rounded text-[#253237]">
                      Verified Record
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-bold text-[#253237]">Diagnosis:</span> {rec.diagnosis}
                    </div>
                    <div>
                      <span className="font-bold text-[#253237]">Chief Complaint:</span> {rec.chief_complaint}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-bold text-[#253237]">Treatment Plan:</span> {rec.treatment_plan}
                    </div>
                    {rec.clinical_notes && (
                      <div className="sm:col-span-2 p-2 bg-[#E0FBFC] rounded border border-[#9DB4C0] text-[#253237]">
                        <span className="font-bold">Physician Advice:</span> {rec.clinical_notes}
                      </div>
                    )}
                  </div>

                  {/* Versioned Prescription Viewer */}
                  {rec.prescription && (
                    <div className="pt-2">
                      <PrescriptionViewer prescription={rec.prescription} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Appointment History */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#253237] flex items-center gap-2 border-b border-[#C2DFE3] pb-3">
              <Calendar className="w-5 h-5 text-[#5C6B73]" /> All Appointments History
            </h3>

            <div className="divide-y divide-[#C2DFE3]">
              {appointments.map((appt) => (
                <div key={appt.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <TokenBadge tokenNumber={appt.token_number} status={appt.status} size="sm" />
                    <div>
                      <div className="font-bold text-[#253237]">{appt.doctor_name} — {appt.service_name}</div>
                      <div className="text-xs text-[#5C6B73]">{appt.appointment_date}</div>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={appt.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Financial Summary & Notification Preferences (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Financial Summary Card */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-[#253237] flex items-center gap-2 border-b border-[#C2DFE3] pb-2">
              <CreditCard className="w-4 h-4 text-[#5C6B73]" /> Billing & Dues Overview
            </h3>

            {financials && (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg border border-[#C2DFE3]">
                  <span className="text-[#5C6B73]">Total Billed:</span>
                  <span className="font-bold text-[#253237]">PKR {financials.total_billed?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800">Total Paid:</span>
                  <span className="font-bold text-emerald-900">PKR {financials.total_paid?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-rose-800 font-bold">Outstanding Dues:</span>
                  <span className="font-bold text-rose-900">PKR {financials.outstanding_due?.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-[#253237] flex items-center gap-2 border-b border-[#C2DFE3] pb-2">
              <Bell className="w-4 h-4 text-[#5C6B73]" /> Notification Preferences
            </h3>
            <p className="text-[11px] text-[#5C6B73]">Select your primary and fallback communication channels for appointment reminders.</p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-[#253237] mb-1">Primary Channel</label>
                <select
                  value={prefForm.primary_channel}
                  onChange={(e) => setPrefForm({ ...prefForm, primary_channel: e.target.value })}
                  className="w-full clinical-input"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS Text</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Backup Failover Channel</label>
                <select
                  value={prefForm.backup_channel}
                  onChange={(e) => setPrefForm({ ...prefForm, backup_channel: e.target.value })}
                  className="w-full clinical-input"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS Text</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <button
                onClick={() => setToast({ type: "success", text: "Notification preferences saved!" })}
                className="w-full btn-secondary text-xs mt-2"
              >
                Save Preferences
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 5-STEP BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#253237]">Appointment Booking Journey</h3>
                <p className="text-xs text-[#5C6B73]">Step {bookingStep} of 5</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#5C6B73] px-2">
              <span className={bookingStep >= 1 ? "text-[#253237]" : ""}>1. Specialty</span>
              <span>→</span>
              <span className={bookingStep >= 2 ? "text-[#253237]" : ""}>2. Date</span>
              <span>→</span>
              <span className={bookingStep >= 3 ? "text-[#253237]" : ""}>3. Token</span>
              <span>→</span>
              <span className={bookingStep >= 4 ? "text-[#253237]" : ""}>4. Review</span>
              <span>→</span>
              <span className={bookingStep >= 5 ? "text-[#253237]" : ""}>5. Pending</span>
            </div>

            {/* STEP 1: Select Doctor & Service */}
            {bookingStep === 1 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#253237] mb-1.5">Select Doctor *</label>
                  <div className="space-y-2">
                    {doctors.map(d => (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedDoctor(d);
                          handleFetchTokenMetrics(d.id, selectedDate);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedDoctor?.id === d.id ? "bg-[#E0FBFC] border-[#253237] shadow-sm" : "border-[#9DB4C0] hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-[#253237]">{d.full_name}</div>
                          <div className="text-xs text-[#5C6B73]">{d.specialization} • Fee: PKR {d.consultation_fee?.toLocaleString()}</div>
                        </div>
                        {selectedDoctor?.id === d.id && <CheckCircle2 className="w-5 h-5 text-[#253237]" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1.5">Select Clinical Service / Aesthetic Treatment *</label>
                  <select
                    value={selectedService?.id || (services[0]?.id) || "srv-01"}
                    onChange={(e) => {
                      const found = services.find(s => s.id === e.target.value);
                      if (found) setSelectedService(found);
                    }}
                    className="w-full clinical-input font-medium"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} • {s.category} — PKR {s.base_price?.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  {/* Quick Aesthetic Treatments Grid */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {services.map(s => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedService(s)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                          (selectedService?.id || services[0]?.id) === s.id
                            ? "bg-[#E0FBFC] border-[#253237] shadow-sm font-semibold"
                            : "border-[#9DB4C0] hover:bg-slate-50 bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[#253237] leading-tight">{s.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#C2DFE3] text-[#253237] rounded font-bold shrink-0">
                            {s.category}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-[#253237] mt-1.5">
                          PKR {s.base_price?.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button onClick={() => setBookingStep(2)} className="btn-primary">
                    Next: Select Date <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Select Date */}
            {bookingStep === 2 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#253237] mb-1.5">Select Consultation Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleStepDateSelect(e.target.value)}
                    className="w-full clinical-input text-sm"
                  />
                </div>

                <div className="p-3 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs">
                  <div><strong>Selected Physician:</strong> {selectedDoctor?.full_name}</div>
                  <div><strong>Available Days:</strong> {(selectedDoctor?.available_days || []).join(", ")}</div>
                  <div><strong>Clinic Hours:</strong> {selectedDoctor?.start_time} - {selectedDoctor?.end_time}</div>
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setBookingStep(1)} className="btn-secondary">Back</button>
                  <button onClick={() => setBookingStep(3)} className="btn-primary">
                    Next: Token Availability <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Token Availability Check */}
            {bookingStep === 3 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 bg-white rounded-xl border border-[#9DB4C0] space-y-2">
                  <div className="font-bold text-[#253237] flex items-center justify-between">
                    <span>Token Allocation Status</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded">Slots Open</span>
                  </div>
                  <p className="text-xs text-[#5C6B73]">
                    Doctor Daily Workload Limit: <strong>{tokenMetrics?.daily_limit || 100}</strong> patients.
                  </p>
                  <p className="text-xs text-[#5C6B73]">
                    Available slots remaining on {selectedDate}: <strong>{tokenMetrics?.available_slots_remaining ?? 98} slots</strong>.
                  </p>
                  <p className="text-[11px] text-[#5C6B73] italic">
                    The backend token engine will atomically assign your unique sequence number during submission.
                  </p>
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setBookingStep(2)} className="btn-secondary">Back</button>
                  <button onClick={() => setBookingStep(4)} className="btn-primary">
                    Next: Review Booking <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review Booking Request */}
            {bookingStep === 4 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] space-y-2">
                  <div className="font-bold text-sm text-[#253237] border-b border-[#9DB4C0] pb-2">Booking Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Doctor:</strong> {selectedDoctor?.full_name}</div>
                    <div><strong>Date:</strong> {selectedDate}</div>
                    <div><strong>Service:</strong> {selectedService?.name}</div>
                    <div><strong>Consultation Fee:</strong> PKR {selectedDoctor?.consultation_fee?.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Additional Symptoms / Notes</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Brief description of primary concerns..."
                    className="w-full clinical-input"
                  />
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setBookingStep(3)} className="btn-secondary">Back</button>
                  <button onClick={handleSubmitBooking} className="btn-primary px-6">
                    Submit Booking Request
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: PENDING Confirmation Result */}
            {bookingStep === 5 && bookingResult && (
              <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-400 text-center space-y-4 animate-in zoom-in-95">
                <TokenBadge tokenNumber={bookingResult.token_number} status="pending" size="lg" />
                
                <div>
                  <h3 className="text-xl font-black text-amber-900">Booking Request Submitted!</h3>
                  <p className="text-xs sm:text-sm text-amber-800 font-semibold mt-1">
                    Your appointment request has been submitted and is awaiting Receptionist approval.
                  </p>
                  <p className="text-xs text-[#5C6B73] mt-2">
                    Allocated Token Sequence: <strong>Token #{String(bookingResult.token_number).padStart(2, "0")}</strong> for {bookingResult.appointment_date}.
                  </p>
                </div>

                <button
                  onClick={() => setShowBookingModal(false)}
                  className="btn-primary px-6 py-2 text-sm"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
