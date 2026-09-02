import React, { useState, useEffect } from "react";
import { 
  Stethoscope, User, Clock, CheckCircle, AlertCircle, FileText, 
  Plus, Edit3, History, Save, ChevronRight, Activity, ArrowRight, 
  ShieldCheck, Search, Users, ArrowLeft, Calendar, DollarSign, 
  Sparkles, Award, CheckCircle2, ChevronDown, RefreshCw, Filter
} from "lucide-react";
import { hospitalApi } from "../../lib/hospitalApi";
import { TokenBadge, StatusBadge, AuditTimeline, PrescriptionViewer } from "./SharedComponents";

const DEFAULT_AESTHETIC_DOCTORS = [
  {
    id: "doc-01",
    user_id: "user-doc-01",
    full_name: "Dr. Ahmed Tariq",
    phone: "+923000000003",
    email: "dr.ahmed@hospital.com",
    specialization: "Consultant Dermatologist & Laser Specialist",
    biography: "Senior Consultant with 12+ years in clinical dermatology, acne pathology, and advanced cosmetic laser treatments.",
    qualifications: "MBBS, FCPS (Dermatology), Fellow American Academy of Dermatology",
    experience_years: 12,
    consultation_fee: 2500,
    follow_up_fee: 1500,
    daily_token_limit: 100,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    start_time: "09:00",
    end_time: "17:00",
    areas_of_expertise: ["Severe Acne", "Eczema", "Laser Skin Resurfacing", "Melasma"]
  },
  {
    id: "doc-02",
    user_id: "user-doc-02",
    full_name: "Dr. Sarah Khan",
    phone: "+923000000004",
    email: "dr.sarah@hospital.com",
    specialization: "Aesthetic Physician & Trichologist",
    biography: "Specialist in hair restoration, PRP therapies, anti-aging rejuvenation, and micro-pigmentation.",
    qualifications: "MBBS, MCPS (Dermatology), Board Certified in Aesthetic Medicine",
    experience_years: 8,
    consultation_fee: 2000,
    follow_up_fee: 1200,
    daily_token_limit: 80,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    start_time: "10:00",
    end_time: "18:00",
    areas_of_expertise: ["Alopecia", "PRP Hair Therapy", "Chemical Peels", "HydraFacial Pro"]
  }
];

export default function DoctorView({ initialDoctorId = null }) {
  // Directory & Selection States
  const [doctors, setDoctors] = useState(DEFAULT_AESTHETIC_DOCTORS);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorQueueStats, setDoctorQueueStats] = useState({});
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Active Chamber States
  const [queue, setQueue] = useState([]);
  const [currentCalled, setCurrentCalled] = useState(null);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [selectedRecordToEdit, setSelectedRecordToEdit] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [toast, setToast] = useState(null);

  // Clinical Record Form
  const [clinicalForm, setClinicalForm] = useState({
    chief_complaint: "",
    examination_findings: "",
    diagnosis: "",
    treatment_plan: "",
    clinical_notes: "",
    doctor_private_notes: "",
    follow_up_days: 14,
    follow_up_instructions: "Review skin response in 2 weeks"
  });

  // Prescription items state for new prescription
  const [rxItems, setRxItems] = useState([
    { medication_name: "", dosage: "", frequency: "Twice daily", duration: "7 days", instructions: "Take after meals" }
  ]);

  // Prescription Correction Modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [targetRxId, setTargetRxId] = useState(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionItems, setCorrectionItems] = useState([]);

  // Edit clinical record state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    diagnosis: "",
    examination_findings: "",
    treatment_plan: "",
    clinical_notes: "",
    edit_reason: ""
  });

  // 1. Fetch Registered Doctors and their Queue Stats
  const loadDoctorsDirectory = async () => {
    setLoadingDoctors(true);
    try {
      const docList = await hospitalApi.getDoctors();
      if (docList && Array.isArray(docList) && docList.length > 0) {
        setDoctors(docList);
        // If initialDoctorId provided, auto-select
        if (initialDoctorId && !selectedDoctor) {
          const match = docList.find(d => d.id === initialDoctorId);
          if (match) setSelectedDoctor(match);
        }
      }
      
      // Fetch queue stats for all doctors
      const currentList = (docList && docList.length > 0) ? docList : DEFAULT_AESTHETIC_DOCTORS;
      const statsMap = {};
      await Promise.all(
        currentList.map(async (doc) => {
          try {
            const q = await hospitalApi.getLiveQueue(doc.id);
            const waiting = (q || []).filter(item => item.queue_status === "waiting").length;
            const inConsult = (q || []).filter(item => item.queue_status === "in_consultation").length;
            const called = (q || []).filter(item => item.queue_status === "called").length;
            statsMap[doc.id] = {
              total: (q || []).length,
              waiting,
              inConsult,
              called
            };
          } catch (e) {
            statsMap[doc.id] = { total: 0, waiting: 0, inConsult: 0, called: 0 };
          }
        })
      );
      setDoctorQueueStats(statsMap);
    } catch (err) {
      console.warn("Could not load dynamic doctors list, fallback to default:", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadDoctorsDirectory();
  }, [initialDoctorId]);

  // 2. Load Selected Doctor's Live Queue & Consultations
  const loadDoctorQueue = async () => {
    if (!selectedDoctor) return;
    setLoadingQueue(true);
    try {
      const q = await hospitalApi.getLiveQueue(selectedDoctor.id);
      setQueue(q || []);

      // Check if there is an active in_consultation entry
      const inConsult = (q || []).find(item => item.queue_status === "in_consultation");
      if (inConsult) {
        setActiveConsultation(inConsult);
        loadPatientClinicalData(inConsult.patient_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadPatientClinicalData = async (patientId) => {
    if (!selectedDoctor) return;
    try {
      const records = await hospitalApi.getPatientClinicalRecords(
        patientId, 
        "doctor", 
        selectedDoctor.id, 
        selectedDoctor.id
      );
      setPatientHistory(records || []);
    } catch (err) {
      console.error("Clinical history error:", err);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorQueue();
      const interval = setInterval(loadDoctorQueue, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDoctor]);

  // Handler to Enter a Doctor's Chamber
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentCalled(null);
    setActiveConsultation(null);
    setPatientHistory([]);
    setClinicalForm({
      chief_complaint: "",
      examination_findings: "",
      diagnosis: "",
      treatment_plan: "",
      clinical_notes: "",
      doctor_private_notes: "",
      follow_up_days: 14,
      follow_up_instructions: "Review skin response in 2 weeks"
    });
    setRxItems([
      { medication_name: "", dosage: "", frequency: "Twice daily", duration: "7 days", instructions: "Take after meals" }
    ]);
  };

  // Handler to Call Next Patient in selected chamber
  const handleCallNext = async () => {
    if (!selectedDoctor) return;
    try {
      const res = await hospitalApi.callNextPatient(selectedDoctor.id);
      if (res.has_patient) {
        setCurrentCalled(res);
        setToast({ 
          type: "success", 
          text: `Called Token #${String(res.token_number).padStart(2, "0")}: ${res.patient_name}` 
        });
        loadDoctorQueue();
      } else {
        setToast({ type: "info", text: res.message || "No checked-in waiting patients in queue." });
      }
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleStartConsultation = async (calledItem) => {
    if (!selectedDoctor) return;
    try {
      await hospitalApi.startConsultation(calledItem.queue_id, selectedDoctor.id);
      setActiveConsultation(calledItem);
      setCurrentCalled(null);
      loadPatientClinicalData(calledItem.patient_id);
      setToast({ type: "success", text: `Consultation started for ${calledItem.patient_name}` });
      loadDoctorQueue();
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleAddRxItem = () => {
    setRxItems([
      ...rxItems, 
      { medication_name: "", dosage: "", frequency: "Twice daily", duration: "7 days", instructions: "Take after meals" }
    ]);
  };

  const handleSaveClinicalRecord = async (e) => {
    e.preventDefault();
    if (!activeConsultation || !selectedDoctor) return;

    try {
      const filteredRx = rxItems.filter(it => it.medication_name.trim() !== "");
      const payload = {
        appointment_id: activeConsultation.appointment_id,
        chief_complaint: clinicalForm.chief_complaint,
        examination_findings: clinicalForm.examination_findings,
        diagnosis: clinicalForm.diagnosis,
        treatment_plan: clinicalForm.treatment_plan,
        clinical_notes: clinicalForm.clinical_notes,
        doctor_private_notes: clinicalForm.doctor_private_notes,
        follow_up_days: Number(clinicalForm.follow_up_days),
        follow_up_instructions: clinicalForm.follow_up_instructions,
        prescription: filteredRx.length > 0 ? { items: filteredRx, notes: "Standard physician formulation" } : null
      };

      await hospitalApi.createClinicalRecord(
        payload, 
        selectedDoctor.id, 
        selectedDoctor.user_id || "user-doc-01"
      );
      setToast({ type: "success", text: "Clinical consultation finalized and immutable prescription issued!" });
      
      // Reset form
      setClinicalForm({
        chief_complaint: "", examination_findings: "", diagnosis: "",
        treatment_plan: "", clinical_notes: "", doctor_private_notes: "",
        follow_up_days: 14, follow_up_instructions: ""
      });
      setRxItems([{ medication_name: "", dosage: "", frequency: "Twice daily", duration: "7 days", instructions: "Take after meals" }]);
      setActiveConsultation(null);
      loadDoctorQueue();
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleOpenEditModal = (rec) => {
    setSelectedRecordToEdit(rec);
    setEditForm({
      diagnosis: rec.diagnosis,
      examination_findings: rec.examination_findings,
      treatment_plan: rec.treatment_plan,
      clinical_notes: rec.clinical_notes || "",
      edit_reason: ""
    });
    setShowEditModal(true);
  };

  const handleSaveEditRecord = async (e) => {
    e.preventDefault();
    if (!selectedRecordToEdit || !selectedDoctor) return;

    try {
      await hospitalApi.updateClinicalRecord(
        selectedRecordToEdit.id,
        {
          diagnosis: editForm.diagnosis,
          examination_findings: editForm.examination_findings,
          treatment_plan: editForm.treatment_plan,
          clinical_notes: editForm.clinical_notes,
          edit_reason: editForm.edit_reason || "Physician diagnostic re-evaluation"
        },
        selectedDoctor.id,
        selectedDoctor.user_id || "user-doc-01"
      );
      setToast({ type: "success", text: "Clinical record updated and immutable audit event appended!" });
      setShowEditModal(false);
      if (activeConsultation) {
        loadPatientClinicalData(activeConsultation.patient_id);
      }
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleOpenCorrectionModal = (rx) => {
    setTargetRxId(rx.id);
    const currItems = rx.current_version?.items || [];
    setCorrectionItems(currItems.map(it => ({ ...it })));
    setCorrectionReason("");
    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!targetRxId || !selectedDoctor) return;

    try {
      await hospitalApi.correctPrescription(
        targetRxId,
        {
          items: correctionItems,
          correction_reason: correctionReason || "Dosage & regimen refinement",
          notes: "Physician updated version"
        },
        selectedDoctor.id,
        selectedDoctor.user_id || "user-doc-01"
      );
      setToast({ type: "success", text: "New prescription version issued! Prior versions preserved in history." });
      setShowCorrectionModal(false);
      if (activeConsultation) {
        loadPatientClinicalData(activeConsultation.patient_id);
      }
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  // Filter doctors in directory
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = 
      (doc.full_name || "").toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (doc.specialization || "").toLowerCase().includes(doctorSearch.toLowerCase()) ||
      (doc.qualifications || "").toLowerCase().includes(doctorSearch.toLowerCase());

    const matchesSpecialty = 
      specialtyFilter === "all" || 
      (doc.specialization || "").toLowerCase().includes(specialtyFilter.toLowerCase());

    return matchesSearch && matchesSpecialty;
  });

  const waitingCount = queue.filter(q => q.queue_status === "waiting").length;

  // =========================================================================
  // VIEW 1: REGISTERED DOCTORS DIRECTORY / CHAMBER LOBBY
  // =========================================================================
  if (!selectedDoctor) {
    const totalRegistered = doctors.length;
    const totalWaitingPatients = Object.values(doctorQueueStats).reduce((acc, curr) => acc + (curr.waiting || 0), 0);
    const totalInConsultation = Object.values(doctorQueueStats).reduce((acc, curr) => acc + (curr.inConsult || 0), 0);

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Toast Alert */}
        {toast && (
          <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm ${
            toast.type === "success" ? "bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0]" : "bg-rose-100 text-rose-900 border border-rose-300"
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-800" /> : <AlertCircle className="w-5 h-5 text-rose-800" />}
              <span>{toast.text}</span>
            </div>
            <button onClick={() => setToast(null)} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* Doctor Chambers Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#253237] via-[#1f2b2f] to-[#141d20] text-white p-7 sm:p-9 rounded-3xl border border-[#5C6B73] shadow-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-[#E0FBFC]/5 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0FBFC]/10 border border-[#E0FBFC]/20 text-[#E0FBFC] text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Physician Consultation Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#E0FBFC] tracking-tight">
                Doctors Chamber Directory & Lobby
              </h1>
              <p className="text-xs sm:text-sm text-[#9DB4C0] leading-relaxed">
                Select your registered doctor profile below to enter your dedicated clinical chamber, call waiting patients in token order, access complete patient histories, and issue versioned prescriptions.
              </p>
            </div>

            <button
              onClick={loadDoctorsDirectory}
              className="self-start md:self-center px-4 py-2.5 rounded-xl bg-[#1b2428] hover:bg-[#253237] text-[#C2DFE3] hover:text-white border border-[#5C6B73] text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="Refresh queue counts & doctors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingDoctors ? 'animate-spin text-[#E0FBFC]' : ''}`} />
              <span>Refresh Chambers</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[#5C6B73]/60">
            <div className="bg-[#1b2428]/80 p-3.5 rounded-xl border border-[#5C6B73]/50">
              <div className="text-[11px] text-[#9DB4C0] font-semibold uppercase tracking-wider">Registered Specialists</div>
              <div className="text-xl font-black text-[#E0FBFC] mt-0.5">{totalRegistered} Doctors</div>
            </div>
            <div className="bg-[#1b2428]/80 p-3.5 rounded-xl border border-[#5C6B73]/50">
              <div className="text-[11px] text-[#9DB4C0] font-semibold uppercase tracking-wider">Waiting in Queues</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{totalWaitingPatients} Patients</div>
            </div>
            <div className="bg-[#1b2428]/80 p-3.5 rounded-xl border border-[#5C6B73]/50">
              <div className="text-[11px] text-[#9DB4C0] font-semibold uppercase tracking-wider">Active In-Consultation</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{totalInConsultation} Active</div>
            </div>
            <div className="bg-[#1b2428]/80 p-3.5 rounded-xl border border-[#5C6B73]/50">
              <div className="text-[11px] text-[#9DB4C0] font-semibold uppercase tracking-wider">Queue Policy</div>
              <div className="text-xs font-bold text-[#C2DFE3] mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Isolated Token Streams</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#9DB4C0] shadow-sm">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5C6B73] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by doctor name or qualification..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#E0FBFC]/30 border border-[#9DB4C0] text-xs sm:text-sm text-[#253237] placeholder-[#5C6B73] focus:outline-none focus:ring-2 focus:ring-[#253237] focus:bg-white transition-all"
            />
          </div>

          {/* Specialty Filters */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSpecialtyFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                specialtyFilter === "all"
                  ? "bg-[#253237] text-white shadow-sm"
                  : "bg-[#E0FBFC] text-[#253237] hover:bg-[#C2DFE3]"
              }`}
            >
              All Specialties
            </button>
            <button
              onClick={() => setSpecialtyFilter("dermatology")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                specialtyFilter === "dermatology"
                  ? "bg-[#253237] text-white shadow-sm"
                  : "bg-[#E0FBFC] text-[#253237] hover:bg-[#C2DFE3]"
              }`}
            >
              Dermatology
            </button>
            <button
              onClick={() => setSpecialtyFilter("trichology")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                specialtyFilter === "trichology"
                  ? "bg-[#253237] text-white shadow-sm"
                  : "bg-[#E0FBFC] text-[#253237] hover:bg-[#C2DFE3]"
              }`}
            >
              Aesthetic & Hair
            </button>
          </div>
        </div>

        {/* Registered Doctors Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredDoctors.map((doc, idx) => {
            const stats = doctorQueueStats[doc.id] || { total: 0, waiting: 0, inConsult: 0, called: 0 };
            const isConsulting = stats.inConsult > 0;
            const waitingPatients = stats.waiting;

            return (
              <div 
                key={doc.id}
                className="bg-white rounded-3xl border border-[#9DB4C0] hover:border-[#253237] shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Top Doctor Profile Strip */}
                  <div className="p-6 bg-gradient-to-r from-slate-50 to-[#E0FBFC]/20 border-b border-[#C2DFE3]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-[#253237] text-[#E0FBFC] flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                            {doc.full_name?.split(" ")[1]?.[0] || doc.full_name?.[0] || "D"}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isConsulting ? "bg-emerald-500 animate-pulse" : "bg-teal-400"
                          }`} title={isConsulting ? "In Consultation" : "Available Today"} />
                        </div>

                        {/* Title & Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-[#253237] group-hover:text-teal-900 transition-colors">
                              {doc.full_name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                              Verified MD
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#5C6B73] mt-0.5">{doc.specialization}</p>
                          <p className="text-[11px] text-[#5C6B73]/80 italic mt-0.5">{doc.qualifications}</p>
                        </div>
                      </div>

                      {/* Chamber Room Badge */}
                      <span className="px-3 py-1.5 rounded-xl bg-[#253237] text-[#E0FBFC] font-extrabold text-xs tracking-tight shadow-sm shrink-0">
                        Chamber #{idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    {/* Live Queue Pulse Box */}
                    <div className="p-4 rounded-2xl bg-[#E0FBFC]/40 border border-[#9DB4C0] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#5C6B73]">
                          Live Queue Status
                        </div>
                        <div className="text-xs text-[#253237] flex items-center gap-1.5 font-bold">
                          <span className={`w-2 h-2 rounded-full ${waitingPatients > 0 ? "bg-amber-500" : "bg-slate-400"}`} />
                          <span>{waitingPatients} Patients Waiting</span>
                          <span>•</span>
                          <span className={isConsulting ? "text-emerald-700 font-extrabold" : "text-[#5C6B73]"}>
                            {isConsulting ? "Consultation Active" : "Chamber Idle"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-[#5C6B73] font-semibold">Daily Cap</div>
                        <div className="text-xs font-extrabold text-[#253237]">{doc.daily_token_limit || 100} Tokens</div>
                      </div>
                    </div>

                    {/* Meta Grid: Schedule & Fees */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-[#C2DFE3]">
                        <div className="text-[10px] uppercase font-bold text-[#5C6B73] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#5C6B73]" /> Shift Timing
                        </div>
                        <div className="font-bold text-[#253237] mt-1">{doc.start_time || "09:00"} - {doc.end_time || "17:00"}</div>
                        <div className="text-[10px] text-[#5C6B73] truncate mt-0.5">
                          {Array.isArray(doc.available_days) ? doc.available_days.slice(0, 3).join(", ") + "..." : "Mon - Sat"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-[#C2DFE3]">
                        <div className="text-[10px] uppercase font-bold text-[#5C6B73] flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[#5C6B73]" /> Consultation Fee
                        </div>
                        <div className="font-bold text-[#253237] mt-1">Rs. {Number(doc.consultation_fee || 2500).toLocaleString()}</div>
                        <div className="text-[10px] text-[#5C6B73] mt-0.5">
                          Follow-up: Rs. {Number(doc.follow_up_fee || 1500).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Areas of Expertise Chips */}
                    {doc.areas_of_expertise && doc.areas_of_expertise.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-[#5C6B73] tracking-wider">
                          Key Clinical Specialties
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.areas_of_expertise.map((exp, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-[#E0FBFC] text-[#253237] text-[11px] font-semibold border border-[#9DB4C0]/40">
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleSelectDoctor(doc)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-[#253237] hover:bg-[#1b2428] text-[#E0FBFC] hover:text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4 text-[#E0FBFC]" />
                    <span>Enter {doc.full_name?.split(" ")[0]} {doc.full_name?.split(" ")[1]}'s Chamber</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredDoctors.length === 0 && (
          <div className="bg-white rounded-3xl border border-[#9DB4C0] p-12 text-center text-[#5C6B73] shadow-sm space-y-3">
            <Users className="w-12 h-12 mx-auto text-[#9DB4C0] opacity-80" />
            <h3 className="font-extrabold text-base text-[#253237]">No registered doctors match your criteria</h3>
            <p className="text-xs">Try adjusting your search terms or specialty filter.</p>
            <button
              onClick={() => { setDoctorSearch(""); setSpecialtyFilter("all"); }}
              className="px-4 py-2 bg-[#253237] text-white rounded-xl font-bold text-xs hover:bg-[#1b2428]"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE DOCTOR CLINICAL WORKSPACE / CHAMBER
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm ${
          toast.type === "success" ? "bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0]" : "bg-rose-100 text-rose-900 border border-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-800" /> : <AlertCircle className="w-5 h-5 text-rose-800" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Top Chamber Navigation Bar with Back & Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-2xl border border-[#9DB4C0] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDoctor(null)}
            className="px-3.5 py-2 rounded-xl bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] font-extrabold text-xs transition-all flex items-center gap-2 border border-[#9DB4C0] shadow-sm group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>All Doctors Directory</span>
          </button>

          <span className="text-xs text-[#5C6B73] hidden md:inline">|</span>

          {/* Quick Doctor Selector Dropdown */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-[#5C6B73] font-semibold">Switch Chamber:</span>
            <select
              value={selectedDoctor.id}
              onChange={(e) => {
                const target = doctors.find(d => d.id === e.target.value);
                if (target) handleSelectDoctor(target);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-[#9DB4C0] text-xs font-bold text-[#253237] focus:outline-none focus:ring-1 focus:ring-[#253237]"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.specialization?.split(" ")[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-3 justify-end">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Chamber Online & Ready</span>
          </span>
          <button
            onClick={loadDoctorQueue}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#253237] text-xs transition-colors cursor-pointer"
            title="Refresh Live Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Prominent Call Next Patient Header Banner */}
      <div className="bg-[#253237] text-white p-6 sm:p-7 rounded-3xl border border-[#5C6B73] shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#E0FBFC] text-[#253237] shadow-inner">
              <Stethoscope className="w-7 h-7" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#E0FBFC]">Doctor Clinical Workspace</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#5C6B73] text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Active Chamber
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#C2DFE3] font-semibold mt-0.5">
                Attending: <strong className="text-white">{selectedDoctor.full_name}</strong> ({selectedDoctor.specialization || "Dermatology Specialist"})
              </p>
              <p className="text-[11px] text-[#9DB4C0]">
                {selectedDoctor.qualifications} • Shift: {selectedDoctor.start_time || "09:00"} - {selectedDoctor.end_time || "17:00"} • Fee: Rs. {Number(selectedDoctor.consultation_fee || 2500).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs text-[#C2DFE3]">
            <span>Today's Waiting Patients: <strong className="text-amber-300 text-sm">{waitingCount}</strong></span>
            <span>•</span>
            <span>In Consultation: <strong className="text-emerald-400 text-sm">{activeConsultation ? 1 : 0}</strong></span>
            <span>•</span>
            <span>Daily Capacity: <strong>{selectedDoctor.daily_token_limit || 100}</strong></span>
          </div>
        </div>

        {/* PROMINENT CALL NEXT BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCallNext}
            disabled={waitingCount === 0}
            className="px-6 py-4 bg-[#E0FBFC] hover:bg-white text-[#253237] font-black text-base sm:text-lg rounded-2xl shadow-md transition-all flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <span>CALL NEXT PATIENT</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Called Patient Popup Notification */}
      {currentCalled && (
        <div className="p-5 bg-[#E0FBFC] rounded-2xl border-2 border-[#253237] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in zoom-in-95">
          <div className="flex items-center gap-4">
            <TokenBadge tokenNumber={currentCalled.token_number} status="called" size="lg" />
            <div>
              <div className="text-xs uppercase font-bold text-[#5C6B73] tracking-widest">Called to Chamber</div>
              <h3 className="text-xl font-black text-[#253237]">{currentCalled.patient_name}</h3>
              <p className="text-xs text-[#5C6B73]">{currentCalled.service_name} • Phone: {currentCalled.patient_phone}</p>
            </div>
          </div>

          <button
            onClick={() => handleStartConsultation(currentCalled)}
            className="btn-primary text-sm px-6 py-3 cursor-pointer"
          >
            Start Consultation
          </button>
        </div>
      )}

      {/* Active Consultation & Clinical Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Queue (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] overflow-hidden shadow-sm">
            <div className="bg-[#253237] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Today's Patient Queue ({queue.length})</h3>
              <span className="text-xs text-[#9DB4C0]">Token Order</span>
            </div>

            <div className="p-3 divide-y divide-[#C2DFE3] max-h-[600px] overflow-y-auto custom-scrollbar">
              {queue.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#5C6B73]">
                  No patients booked for {selectedDoctor.full_name} today.
                </div>
              ) : (
                queue.map((item) => (
                  <div key={item.queue_id || item.appointment_id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <TokenBadge tokenNumber={item.token_number} status={item.queue_status} size="sm" />
                      <div>
                        <div className="font-bold text-[#253237]">{item.patient_name}</div>
                        <div className="text-[11px] text-[#5C6B73]">{item.service_name}</div>
                        <div className="mt-0.5">
                          <StatusBadge status={item.queue_status} />
                        </div>
                      </div>
                    </div>

                    {item.queue_status === "called" && (
                      <button
                        onClick={() => handleStartConsultation(item)}
                        className="px-2.5 py-1 bg-[#253237] text-white rounded font-semibold text-[11px] hover:bg-[#1b2428] cursor-pointer"
                      >
                        Start
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Consultation Room & Medical History (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeConsultation ? (
            /* Active Consultation Form */
            <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-4">
                <div className="flex items-center gap-3">
                  <TokenBadge tokenNumber={activeConsultation.token_number} status="in_consultation" size="md" />
                  <div>
                    <h3 className="text-lg font-bold text-[#253237]">{activeConsultation.patient_name}</h3>
                    <p className="text-xs text-[#5C6B73]">In Consultation • {activeConsultation.service_name}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold rounded-full flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Chamber Active
                </span>
              </div>

              <form onSubmit={handleSaveClinicalRecord} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-[#253237] mb-1">Chief Complaint *</label>
                  <textarea
                    required
                    rows={2}
                    value={clinicalForm.chief_complaint}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, chief_complaint: e.target.value })}
                    placeholder="Patient reports rash, acne outbreak, burning sensation..."
                    className="w-full clinical-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Examination & Findings *</label>
                    <textarea
                      required
                      rows={3}
                      value={clinicalForm.examination_findings}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, examination_findings: e.target.value })}
                      placeholder="Physical inspection, lesion characteristics..."
                      className="w-full clinical-input"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Diagnosis / Clinical Assessment *</label>
                    <textarea
                      required
                      rows={3}
                      value={clinicalForm.diagnosis}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })}
                      placeholder="e.g. Grade III Inflammatory Acne Vulgaris"
                      className="w-full clinical-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Treatment / Procedure Plan *</label>
                  <textarea
                    required
                    rows={2}
                    value={clinicalForm.treatment_plan}
                    onChange={(e) => setClinicalForm({ ...clinicalForm, treatment_plan: e.target.value })}
                    placeholder="Procedural details, laser settings, or clinical regimen"
                    className="w-full clinical-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Clinical Notes (Visible to Patient)</label>
                    <textarea
                      rows={2}
                      value={clinicalForm.clinical_notes}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, clinical_notes: e.target.value })}
                      placeholder="Dietary advice, sun avoidance instructions..."
                      className="w-full clinical-input"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#253237] mb-1 flex items-center justify-between">
                      <span>Doctor Private Notes</span>
                      <span className="text-[10px] text-amber-800 font-semibold">(Hidden from Patient & Reception)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={clinicalForm.doctor_private_notes}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, doctor_private_notes: e.target.value })}
                      placeholder="Internal clinical differential notes..."
                      className="w-full clinical-input"
                    />
                  </div>
                </div>

                {/* Prescription Items (Version 1 Formulation) */}
                <div className="p-4 rounded-xl bg-[#E0FBFC]/50 border border-[#9DB4C0] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#253237] flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Prescription Formulation (Version 1)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddRxItem}
                      className="px-2.5 py-1 bg-white border border-[#9DB4C0] hover:bg-[#C2DFE3] text-[#253237] font-semibold text-xs rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Medication
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rxItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-[#C2DFE3]">
                        <input
                          type="text"
                          placeholder="Medication name (e.g. Doxycycline)"
                          value={item.medication_name}
                          onChange={(e) => {
                            const copy = [...rxItems];
                            copy[idx].medication_name = e.target.value;
                            setRxItems(copy);
                          }}
                          className="clinical-input text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 100mg)"
                          value={item.dosage}
                          onChange={(e) => {
                            const copy = [...rxItems];
                            copy[idx].dosage = e.target.value;
                            setRxItems(copy);
                          }}
                          className="clinical-input text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. Twice daily)"
                          value={item.frequency}
                          onChange={(e) => {
                            const copy = [...rxItems];
                            copy[idx].frequency = e.target.value;
                            setRxItems(copy);
                          }}
                          className="clinical-input text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g. 14 days)"
                          value={item.duration}
                          onChange={(e) => {
                            const copy = [...rxItems];
                            copy[idx].duration = e.target.value;
                            setRxItems(copy);
                          }}
                          className="clinical-input text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                  <button type="submit" className="btn-primary px-6 py-2.5 text-sm cursor-pointer">
                    <Save className="w-4 h-4" /> Finalize Record & Complete Consultation
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#9DB4C0] p-12 text-center text-xs sm:text-sm text-[#5C6B73] shadow-sm">
              <Stethoscope className="w-12 h-12 text-[#9DB4C0] mx-auto mb-3 opacity-70" />
              <h4 className="font-bold text-[#253237] text-base">No Active Consultation in Progress</h4>
              <p className="mt-1">Click <strong>CALL NEXT PATIENT</strong> in the top banner to bring in the next checked-in patient.</p>
            </div>
          )}

          {/* Patient Permitted Clinical History & Audit Logs */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-base text-[#253237] flex items-center gap-2">
                <History className="w-5 h-5 text-[#5C6B73]" /> Permitted Clinical History & Version Records
              </h3>
              <span className="text-xs text-[#5C6B73]">Treated / Assigned Patient Only</span>
            </div>

            {patientHistory.length === 0 ? (
              <p className="text-xs text-[#5C6B73] italic">No historical visits recorded for this patient.</p>
            ) : (
              patientHistory.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-[#9DB4C0] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C2DFE3] pb-2">
                    <div>
                      <div className="font-bold text-sm text-[#253237]">{rec.visit_date} — {rec.service_name || "Consultation"}</div>
                      <div className="text-xs text-[#5C6B73]">Attending: {rec.doctor_name}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(rec)}
                        className="px-2.5 py-1 bg-white border border-[#9DB4C0] hover:bg-[#C2DFE3] text-[#253237] text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Record
                      </button>

                      {rec.prescription && (
                        <button
                          onClick={() => handleOpenCorrectionModal(rec.prescription)}
                          className="px-2.5 py-1 bg-[#253237] hover:bg-[#1b2428] text-white text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Correct Rx (New Version)
                        </button>
                      )}
                    </div>
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
                    {rec.doctor_private_notes && (
                      <div className="sm:col-span-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                        <span className="font-bold">Private Doctor Notes:</span> {rec.doctor_private_notes}
                      </div>
                    )}
                  </div>

                  {/* Prescription Component */}
                  {rec.prescription && <PrescriptionViewer prescription={rec.prescription} />}

                  {/* Audit Trail Component */}
                  {rec.audit_trail && <AuditTimeline audits={rec.audit_trail} />}
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* MODAL 1: Edit Clinical Record Form (Appends Audit Event) */}
      {showEditModal && selectedRecordToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237] flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> Edit Clinical Assessment
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#5C6B73] cursor-pointer">✕</button>
            </div>

            <div className="p-3 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs text-[#253237]">
              <strong>Rule 11 Enforced:</strong> All modifications generate an immutable append-only audit trail record with physician actor ID and timestamp.
            </div>

            <form onSubmit={handleSaveEditRecord} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#253237] mb-1">Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={editForm.diagnosis}
                  onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Examination Findings *</label>
                <textarea
                  rows={2}
                  required
                  value={editForm.examination_findings}
                  onChange={(e) => setEditForm({ ...editForm, examination_findings: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Clinical Justification / Edit Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Refined diagnosis based on lab / physical exam"
                  value={editForm.edit_reason}
                  onChange={(e) => setEditForm({ ...editForm, edit_reason: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-[#5C6B73] cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="btn-primary cursor-pointer">
                  Save Changes & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Prescription Version Correction Modal (Rule 12: Never Overwrites) */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237] flex items-center gap-2">
                <FileText className="w-5 h-5" /> Issue Corrected Prescription Version
              </h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-[#5C6B73] cursor-pointer">✕</button>
            </div>

            <div className="p-3 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs text-[#253237]">
              <strong>Rule 12 Enforced:</strong> Prescriptions are versioned. Previous versions will remain intact in historical audit, and a new version will be issued.
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#253237] mb-1">Reason for Revision *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adjusted dosage due to response / added sunscreen"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full clinical-input"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[#253237]">Medication List for New Version</label>
                {correctionItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-[#9DB4C0]">
                    <input
                      type="text"
                      placeholder="Medication"
                      value={item.medication_name}
                      onChange={(e) => {
                        const copy = [...correctionItems];
                        copy[idx].medication_name = e.target.value;
                        setCorrectionItems(copy);
                      }}
                      className="clinical-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={item.dosage}
                      onChange={(e) => {
                        const copy = [...correctionItems];
                        copy[idx].dosage = e.target.value;
                        setCorrectionItems(copy);
                      }}
                      className="clinical-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={item.frequency}
                      onChange={(e) => {
                        const copy = [...correctionItems];
                        copy[idx].frequency = e.target.value;
                        setCorrectionItems(copy);
                      }}
                      className="clinical-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={item.duration}
                      onChange={(e) => {
                        const copy = [...correctionItems];
                        copy[idx].duration = e.target.value;
                        setCorrectionItems(copy);
                      }}
                      className="clinical-input text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button type="button" onClick={() => setShowCorrectionModal(false)} className="px-4 py-2 text-[#5C6B73] cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="btn-primary cursor-pointer">
                  Issue Next Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
