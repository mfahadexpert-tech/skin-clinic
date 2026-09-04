import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, Clock, CheckCircle2, XCircle, Search, UserPlus, 
  CreditCard, ShieldAlert, AlertTriangle, RefreshCw, Phone, UserCheck, 
  ArrowRight, DollarSign, FileText, Activity
} from "lucide-react";
import { hospitalApi } from "../../lib/hospitalApi";
import { TokenBadge, StatusBadge, ConfirmationModal } from "./SharedComponents";

const DEFAULT_AESTHETIC_SERVICES = [
  { id: "srv-01", name: "Dermatology & Skin Assessment", category: "Clinical", base_price: 2500, duration_minutes: 30 },
  { id: "srv-02", name: "Fractional CO2 Laser Resurfacing", category: "Laser & Aesthetics", base_price: 8500, duration_minutes: 45 },
  { id: "srv-03", name: "HydraFacial MD Elite Glow", category: "Medical Facial", base_price: 6000, duration_minutes: 40 },
  { id: "srv-04", name: "PRP Hair Restoration & Scalp Boost", category: "Trichology", base_price: 9500, duration_minutes: 45 },
  { id: "srv-05", name: "Medical Chemical Peel (Glycolic/TCA)", category: "Aesthetic Dermatology", base_price: 4500, duration_minutes: 30 },
  { id: "srv-06", name: "Q-Switched Nd:YAG Carbon Laser Peel", category: "Laser Aesthetics", base_price: 7000, duration_minutes: 35 },
  { id: "srv-07", name: "HIFU Non-Surgical Face Lifting", category: "Skin Tightening", base_price: 15000, duration_minutes: 60 },
  { id: "srv-08", name: "Microneedling RF (Scar & Texture Repair)", category: "Skin Rejuvenation", base_price: 9000, duration_minutes: 45 },
  { id: "srv-09", name: "Triple-Wavelength Diode Laser Hair Removal", category: "Laser Care", base_price: 5500, duration_minutes: 30 },
  { id: "srv-10", name: "Glutathione Radiance IV Infusion", category: "Wellness & Glow", base_price: 6500, duration_minutes: 45 },
  { id: "srv-11", name: "Acne Scar Subcision & TCA Cross", category: "Clinical Dermatology", base_price: 8000, duration_minutes: 40 },
  { id: "srv-12", name: "Botox / Dysport Anti-Wrinkle Smoothing", category: "Injectables & Anti-Aging", base_price: 18000, duration_minutes: 30 },
  { id: "srv-13", name: "Hyaluronic Acid Lip & Cheek Filler", category: "Dermal Fillers", base_price: 22000, duration_minutes: 40 },
  { id: "srv-14", name: "Under-Eye Dark Circle PRP Therapy", category: "Aesthetic Rejuvenation", base_price: 7500, duration_minutes: 35 }
];

const DEFAULT_AESTHETIC_DOCTORS = [
  { id: "doc-01", full_name: "Dr. Ahmed Tariq", specialization: "Consultant Dermatologist & Laser Specialist", consultation_fee: 2500 },
  { id: "doc-02", full_name: "Dr. Sarah Khan", specialization: "Aesthetic Physician & Trichologist", consultation_fee: 2000 }
];

export default function ReceptionistView({ onPatientSelected }) {
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [doctors, setDoctors] = useState(DEFAULT_AESTHETIC_DOCTORS);
  const [services, setServices] = useState(DEFAULT_AESTHETIC_SERVICES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNewApptModal, setShowNewApptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedApptForPay, setSelectedApptForPay] = useState(null);
  const [selectedPatientOperational, setSelectedPatientOperational] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);

  // Form states for Patient Registration
  const [regForm, setRegForm] = useState({
    full_name: "",
    phone: "",
    gender: "female",
    dob: "1995-01-01",
    cnic: "",
    address: "",
    emergency_contact: "",
    email: "",
    whatsapp_available: true,
    primary_notification_channel: "whatsapp"
  });
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Form states for Direct Walk-in Appointment
  const [walkinForm, setWalkinForm] = useState({
    patient_id: "",
    doctor_id: "doc-01",
    service_id: "srv-01",
    appointment_date: new Date().toISOString().split("T")[0],
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amount_paid: 2500,
    total_amount: 2500,
    payment_method: "cash",
    notes: "Front desk POS receipt"
  });

  const [queueDateFilter, setQueueDateFilter] = useState("all"); // "all", "today", "tomorrow", or "YYYY-MM-DD"

  const loadData = async (targetFilter = queueDateFilter) => {
    setLoading(true);
    try {
      let dateParam = targetFilter;
      if (targetFilter === "today") {
        dateParam = new Date().toISOString().split("T")[0];
      } else if (targetFilter === "tomorrow") {
        dateParam = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      }

      const [statsData, pendingData, queueData, docData, srvData] = await Promise.all([
        hospitalApi.getAdminStats(),
        hospitalApi.getPendingBookingRequests(),
        hospitalApi.getLiveQueue(null, dateParam),
        hospitalApi.getDoctors(),
        hospitalApi.getServices()
      ]);
      setStats(statsData);
      setPendingRequests(pendingData || []);
      setLiveQueue(queueData || []);
      if (docData && docData.length > 0) setDoctors(docData);
      if (srvData && srvData.length > 0) setServices(srvData);
    } catch (err) {
      console.error("Error loading receptionist data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(queueDateFilter);
    const interval = setInterval(() => loadData(queueDateFilter), 12000);
    return () => clearInterval(interval);
  }, [queueDateFilter]);

  const handleApprove = async (apptId, reqObj = null) => {
    try {
      const res = await hospitalApi.processBookingApproval(apptId, "approve", "Approved by Front Desk Reception");
      const apptDate = reqObj?.appointment_date || res?.appointment_date || "scheduled date";
      const patientName = reqObj?.patient_name || res?.patient_name || "Patient";
      const tokNum = reqObj?.token_number || res?.token_number || "";

      setActionAlert({ 
        type: "success", 
        text: `Approved Token #${tokNum} for ${patientName} on ${apptDate}! Successfully added to active Queue.` 
      });
      loadData(queueDateFilter);
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handleDecline = async (apptId) => {
    try {
      await hospitalApi.processBookingApproval(apptId, "decline", "Declined due to scheduling constraint");
      setActionAlert({ type: "success", text: "Appointment declined and token safely retired." });
      loadData(queueDateFilter);
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handleCheckIn = async (apptId) => {
    try {
      await hospitalApi.checkInPatient(apptId);
      setActionAlert({ type: "success", text: "Patient checked in! Now eligible for Doctor's Call Next." });
      loadData();
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handleCheckDuplicate = async () => {
    try {
      const dup = await hospitalApi.checkDuplicate(regForm.cnic, regForm.phone, regForm.email);
      if (dup.has_duplicate) {
        setDuplicateWarning(dup.warning_message);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await hospitalApi.registerPatient(regForm);
      setActionAlert({ type: "success", text: `Patient ${res.full_name} registered successfully (ID: ${res.patient_id})` });
      setShowRegisterModal(false);
      setRegForm({
        full_name: "", phone: "", gender: "female", dob: "1995-01-01",
        cnic: "", address: "", emergency_contact: "", email: "",
        whatsapp_available: true, primary_notification_channel: "whatsapp"
      });
      setDuplicateWarning(null);
      loadData();
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    try {
      await hospitalApi.createBookingRequest({
        ...walkinForm,
        booking_source: "receptionist_walkin"
      });
      setActionAlert({ type: "success", text: "Walk-in appointment booked and confirmed directly." });
      setShowNewApptModal(false);
      loadData();
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedApptForPay) return;
    try {
      await hospitalApi.processPayment({
        appointment_id: selectedApptForPay.id || selectedApptForPay.appointment_id,
        total_amount: Number(paymentForm.total_amount),
        amount_paid: Number(paymentForm.amount_paid),
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes
      });
      setActionAlert({ type: "success", text: "Payment processed and POS receipt generated!" });
      setShowPaymentModal(false);
      loadData();
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await hospitalApi.searchPatients(searchQuery);
      setSearchResults(res || []);
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  const handleViewOperationalPatient = async (patientId) => {
    try {
      const data = await hospitalApi.getPatientOperationalData(patientId);
      setSelectedPatientOperational(data);
    } catch (err) {
      setActionAlert({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {actionAlert && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm ${
          actionAlert.type === "success" ? "bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0]" : "bg-rose-100 text-rose-900 border border-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {actionAlert.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-800" /> : <AlertTriangle className="w-5 h-5 text-rose-800" />}
            <span>{actionAlert.text}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#9DB4C0] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#253237] tracking-tight">Front Desk Operations</h1>
          <p className="text-xs sm:text-sm text-[#5C6B73]">Combined Operational Matrix & Real-time Queue Dispatch</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn-primary text-xs sm:text-sm"
          >
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>

          <button
            onClick={() => setShowNewApptModal(true)}
            className="btn-secondary text-xs sm:text-sm"
          >
            <Calendar className="w-4 h-4" /> Walk-In Booking
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-lg border border-[#9DB4C0] text-[#5C6B73] hover:text-[#253237] hover:bg-[#C2DFE3] transition-colors"
            title="Refresh Live Operations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#9DB4C0] shadow-sm">
          <div className="text-[11px] uppercase font-bold text-[#5C6B73] tracking-wider">Today Total</div>
          <div className="text-2xl font-black text-[#253237] mt-1">{stats?.total_appointments_today || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 bg-amber-50/50 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-amber-800 tracking-wider">Pending Review</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{pendingRequests.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#9DB4C0] bg-[#E0FBFC]/50 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-[#253237] tracking-wider">Waiting Queue</div>
          <div className="text-2xl font-black text-[#253237] mt-1">{stats?.waiting_queue_count || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-300 bg-teal-50/50 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-teal-800 tracking-wider">In Consultation</div>
          <div className="text-2xl font-black text-teal-900 mt-1">{stats?.in_consultation_count || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-sm">
          <div className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">Completed</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{stats?.completed_today_count || 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#9DB4C0] shadow-sm">
          <div className="text-[11px] uppercase font-bold text-[#5C6B73] tracking-wider">Today Revenue</div>
          <div className="text-lg font-black text-[#253237] mt-1.5">PKR {stats?.today_revenue?.toLocaleString() || "0"}</div>
        </div>
      </div>

      {/* Main Two-Column Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: PENDING Booking Requests & Patient Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Pending Approval Requests Panel */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] overflow-hidden shadow-sm">
            <div className="bg-[#253237] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm sm:text-base">Pending Booking Requests ({pendingRequests.length})</h3>
              </div>
              <span className="text-xs text-[#9DB4C0]">Authoritative Receptionist Review</span>
            </div>

            <div className="p-4 divide-y divide-[#C2DFE3]">
              {pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-xs sm:text-sm text-[#5C6B73]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2 opacity-60" />
                  All patient booking requests have been reviewed and approved!
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <TokenBadge tokenNumber={req.token_number} status="pending" size="sm" />
                      <div>
                        <div className="font-bold text-sm text-[#253237] flex items-center gap-2">
                          {req.patient_name}
                          <span className="text-[11px] font-normal text-[#5C6B73]">({req.patient_phone})</span>
                        </div>
                        <div className="text-xs text-[#5C6B73] mt-0.5">
                          <strong>{req.doctor_name}</strong> • {req.service_name} • {req.appointment_date}
                        </div>
                        <div className="text-[11px] text-[#5C6B73] mt-0.5">
                          Source: <span className="font-semibold">{req.booking_source.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleApprove(req.id, req)}
                        className="px-3 py-1.5 bg-[#253237] hover:bg-[#1b2428] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Patient Lookup Panel (Operational Data Only) */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#253237] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#5C6B73]" /> Patient Operational Directory
              </h3>
              <span className="text-xs text-[#5C6B73] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" /> Clinical Data Redacted
              </span>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, Phone, CNIC (e.g., 35202-...), or ID..."
                className="flex-1 clinical-input text-xs sm:text-sm"
              />
              <button type="submit" className="btn-primary text-xs sm:text-sm px-4">
                Search
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-[#9DB4C0] rounded-xl overflow-hidden divide-y divide-[#C2DFE3]">
                {searchResults.map((p) => (
                  <div key={p.id} className="p-3 bg-[#E0FBFC]/30 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <div className="font-bold text-[#253237]">{p.full_name}</div>
                      <div className="text-xs text-[#5C6B73]">CNIC: {p.cnic} • Phone: {p.phone}</div>
                    </div>
                    <button
                      onClick={() => handleViewOperationalPatient(p.id)}
                      className="px-3 py-1 bg-[#C2DFE3] hover:bg-[#9DB4C0] text-[#253237] font-semibold rounded-lg text-xs transition-colors"
                    >
                      View Operational History
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Queue & Check-in Desk (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Queue Panel */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] overflow-hidden shadow-sm">
            <div className="bg-[#253237] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#E0FBFC]" />
                <h3 className="font-bold text-sm sm:text-base">
                  Live Queue Matrix ({liveQueue.length})
                </h3>
              </div>
              <span className="text-xs text-[#9DB4C0]">Token Order</span>
            </div>

            {/* Queue Date Filter Bar */}
            <div className="p-3 bg-slate-50 border-b border-[#C2DFE3] flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="text-[#5C6B73] font-bold text-[11px]">Filter Date:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setQueueDateFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    queueDateFilter === "all"
                      ? "bg-[#253237] text-white border-[#253237]"
                      : "bg-white text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                  }`}
                >
                  All Active
                </button>
                <button
                  type="button"
                  onClick={() => setQueueDateFilter("today")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    queueDateFilter === "today"
                      ? "bg-[#253237] text-white border-[#253237]"
                      : "bg-white text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQueueDateFilter("tomorrow")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    queueDateFilter === "tomorrow"
                      ? "bg-[#253237] text-white border-[#253237]"
                      : "bg-white text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                  }`}
                >
                  Tomorrow
                </button>
                <input
                  type="date"
                  value={queueDateFilter !== "all" && queueDateFilter !== "today" && queueDateFilter !== "tomorrow" ? queueDateFilter : ""}
                  onChange={(e) => {
                    if (e.target.value) setQueueDateFilter(e.target.value);
                  }}
                  className="px-2 py-0.5 border border-[#9DB4C0] rounded-lg text-xs font-medium bg-white text-[#253237]"
                  title="Select custom date"
                />
              </div>
            </div>

            <div className="p-4 divide-y divide-[#C2DFE3] max-h-[550px] overflow-y-auto custom-scrollbar">
              {liveQueue.length === 0 ? (
                <div className="py-8 text-center text-xs sm:text-sm text-[#5C6B73]">
                  No active tokens found for this date filter.
                </div>
              ) : (
                liveQueue.map((item) => (
                  <div key={item.queue_id || item.appointment_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <TokenBadge tokenNumber={item.token_number} status={item.queue_status} size="sm" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#253237] flex items-center gap-2">
                          <span>{item.patient_name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0] rounded font-bold">
                            {item.date}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5C6B73]">{item.doctor_name} • {item.service_name}</div>
                        <div className="mt-1">
                          <StatusBadge status={item.queue_status} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                      {item.queue_status === "not_checked_in" && (
                        <button
                          onClick={() => handleCheckIn(item.appointment_id)}
                          className="px-2.5 py-1 bg-[#253237] hover:bg-[#1b2428] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
                        >
                          Check-In
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedApptForPay(item);
                          setPaymentForm({
                            amount_paid: 2500,
                            total_amount: 2500,
                            payment_method: "cash",
                            notes: `POS receipt for Token #${item.token_number}`
                          });
                          setShowPaymentModal(true);
                        }}
                        className="px-2.5 py-1 bg-[#C2DFE3] hover:bg-[#9DB4C0] text-[#253237] text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <DollarSign className="w-3 h-3" /> Billing
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: Patient Registration with Duplicate Detection Warning */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237] flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Patient Front-Desk Registration
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-[#5C6B73] hover:text-[#253237]">✕</button>
            </div>

            {duplicateWarning && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Duplicate Detection Alert:</strong> {duplicateWarning}
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regForm.full_name}
                    onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                    className="w-full clinical-input"
                    placeholder="e.g. Zainab Fatima"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Phone Number (Mandatory) *</label>
                  <input
                    type="text"
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    className="w-full clinical-input"
                    placeholder="+923011112233"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">CNIC (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={regForm.cnic}
                    onChange={(e) => setRegForm({ ...regForm, cnic: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    className="w-full clinical-input"
                    placeholder="35202-1234567-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={regForm.dob}
                    onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Gender *</label>
                  <select
                    value={regForm.gender}
                    onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                    className="w-full clinical-input"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Emergency Contact *</label>
                  <input
                    type="text"
                    required
                    value={regForm.emergency_contact}
                    onChange={(e) => setRegForm({ ...regForm, emergency_contact: e.target.value })}
                    className="w-full clinical-input"
                    placeholder="+923011112200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Residential Address *</label>
                <input
                  type="text"
                  required
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full clinical-input"
                  placeholder="Street / Sector / City"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    onBlur={handleCheckDuplicate}
                    className="w-full clinical-input"
                    placeholder="patient@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Primary Notification Channel</label>
                  <select
                    value={regForm.primary_notification_channel}
                    onChange={(e) => setRegForm({ ...regForm, primary_notification_channel: e.target.value })}
                    className="w-full clinical-input"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Walk-In Direct Booking */}
      {showNewApptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Create Walk-In Appointment</h3>
              <button onClick={() => setShowNewApptModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Patient ID or MRN *</label>
                <input
                  type="text"
                  required
                  value={walkinForm.patient_id}
                  onChange={(e) => setWalkinForm({ ...walkinForm, patient_id: e.target.value })}
                  placeholder="e.g. pat-01"
                  className="w-full clinical-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Attending Doctor *</label>
                <select
                  value={walkinForm.doctor_id}
                  onChange={(e) => setWalkinForm({ ...walkinForm, doctor_id: e.target.value })}
                  className="w-full clinical-input"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Clinical Service *</label>
                <select
                  value={walkinForm.service_id}
                  onChange={(e) => setWalkinForm({ ...walkinForm, service_id: e.target.value })}
                  className="w-full clinical-input"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (PKR {s.base_price})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={walkinForm.appointment_date}
                  onChange={(e) => setWalkinForm({ ...walkinForm, appointment_date: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowNewApptModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Booking & Allocate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: POS Billing Payment */}
      {showPaymentModal && selectedApptForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237] flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Front Desk POS Checkout
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <div className="p-3 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs">
              <div><strong>Patient:</strong> {selectedApptForPay.patient_name}</div>
              <div><strong>Service:</strong> {selectedApptForPay.service_name} (Token #{selectedApptForPay.token_number})</div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Total Bill (PKR)</label>
                  <input
                    type="number"
                    value={paymentForm.total_amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, total_amount: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Amount Paid (PKR)</label>
                  <input
                    type="number"
                    value={paymentForm.amount_paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full clinical-input"
                >
                  <option value="cash">Cash Counter</option>
                  <option value="card">Debit / Credit Card POS</option>
                  <option value="online">Online Transfer / QR</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Payment & Issue Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Operational Patient Record Viewer (STRICTLY REDACTED CLINICAL DATA) */}
      {selectedPatientOperational && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#253237]">{selectedPatientOperational.full_name}</h3>
                <p className="text-xs text-[#5C6B73]">Operational History • CNIC: {selectedPatientOperational.cnic}</p>
              </div>
              <button onClick={() => setSelectedPatientOperational(null)} className="text-[#5C6B73]">✕</button>
            </div>

            <div className="p-3 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                <strong>Privacy Policy:</strong> Operational overview only. Diagnosis, examination findings, and clinical prescriptions are restricted to authorized physicians.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-[#C2DFE3]">
                <div className="font-bold text-[#253237]">Phone Number</div>
                <div className="text-[#5C6B73]">{selectedPatientOperational.phone}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-[#C2DFE3]">
                <div className="font-bold text-[#253237]">Total Completed Visits</div>
                <div className="text-[#5C6B73]">{selectedPatientOperational.total_visits} visits</div>
              </div>
            </div>

            {/* Appointment Log */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C6B73]">Past & Upcoming Appointments</h4>
              <div className="border border-[#9DB4C0] rounded-xl overflow-hidden divide-y divide-[#C2DFE3]">
                {(selectedPatientOperational.appointments || []).map((a, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#253237]">{a.doctor_name} — {a.service_name}</div>
                      <div className="text-[#5C6B73]">{a.appointment_date} • Token #{a.token_number}</div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={a.status} />
                      <div className="text-[11px] font-semibold text-[#5C6B73] mt-1">Payment: {a.payment_status || "unpaid"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
