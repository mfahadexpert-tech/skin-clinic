import React, { useState, useEffect } from "react";
import { 
  Stethoscope, User, Clock, CheckCircle, AlertCircle, FileText, 
  Plus, Edit3, History, Save, ChevronRight, Activity, ArrowRight, 
  ShieldCheck, Search, Users, ArrowLeft, Calendar, DollarSign, 
  Sparkles, Award, CheckCircle2, ChevronDown, RefreshCw, Filter,
  ShoppingCart, Package, Layers, Check, Scissors, AlertTriangle
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

export default function DoctorView({ initialDoctorId = null, onNavigateTo, onPatientSelected, activePatientId = null }) {
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

  const [doctorQueueDateFilter, setDoctorQueueDateFilter] = useState("all"); // "all", "today", "tomorrow", or "YYYY-MM-DD"

  // Patient Treatment Packages & Multi-Session Tracking (Doctor Exclusive)
  const [patientPackages, setPatientPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [showNewPackageModal, setShowNewPackageModal] = useState(false);
  const [showEditPackageModal, setShowEditPackageModal] = useState(false);
  const [selectedPackageToEdit, setSelectedPackageToEdit] = useState(null);

  const [newPackageForm, setNewPackageForm] = useState({
    package_name: "",
    package_type: "multi_package",
    total_price: 15000,
    discount_amount: 0,
    notes: "",
    items: [
      { service_id: "", item_name: "", sessions_total: 3, sessions_used: 1, unit_price: 5000 }
    ]
  });

  const [editPackageForm, setEditPackageForm] = useState({
    package_name: "",
    package_type: "multi_package",
    total_price: 15000,
    discount_amount: 0,
    status: "active",
    notes: "",
    items: []
  });

  // Doctor Services Management States
  const [activeChamberTab, setActiveChamberTab] = useState("consultation"); // "consultation" | "services"
  const [doctorServices, setDoctorServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: "",
    category: "Clinical Dermatology",
    base_price: 3500,
    duration_minutes: 30,
    description: ""
  });

  const loadDoctorServices = async (docId = selectedDoctor?.id) => {
    if (!docId) return;
    setLoadingServices(true);
    try {
      const srvs = await hospitalApi.getServices(docId);
      setDoctorServices(srvs || []);
    } catch (err) {
      console.error("Error loading doctor services:", err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleAddDoctorService = async (e) => {
    e.preventDefault();
    if (!newServiceForm.name.trim() || !newServiceForm.base_price) {
      setToast({ type: "error", text: "Please provide a Procedure Name and Base Price." });
      return;
    }
    setIsSubmittingService(true);
    try {
      await hospitalApi.addDoctorService(selectedDoctor.id, {
        name: newServiceForm.name.trim(),
        category: newServiceForm.category.trim(),
        base_price: Number(newServiceForm.base_price),
        duration_minutes: Number(newServiceForm.duration_minutes || 30),
        description: newServiceForm.description.trim() || `Specialized clinical procedure offered by ${selectedDoctor.full_name}`,
        is_active: true
      });
      setToast({ type: "success", text: `Procedure "${newServiceForm.name}" added to your offered services!` });
      setShowAddServiceModal(false);
      setNewServiceForm({
        name: "",
        category: "Clinical Dermatology",
        base_price: 3500,
        duration_minutes: 30,
        description: ""
      });
      loadDoctorServices(selectedDoctor.id);
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to add procedure." });
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteDoctorService = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to remove "${serviceName}" from your chamber offerings?`)) return;
    try {
      await hospitalApi.deleteDoctorService(selectedDoctor.id, serviceId);
      setToast({ type: "success", text: `Procedure "${serviceName}" unlinked from your chamber.` });
      loadDoctorServices(selectedDoctor.id);
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to remove procedure." });
    }
  };

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
          if (match) {
            setSelectedDoctor(match);
            loadDoctorServices(match.id);
          }
        }
      }
      
      // Fetch queue stats for all doctors (across all active queues)
      const currentList = (docList && docList.length > 0) ? docList : DEFAULT_AESTHETIC_DOCTORS;
      const statsMap = {};
      await Promise.all(
        currentList.map(async (doc) => {
          try {
            const q = await hospitalApi.getLiveQueue(doc.id, "all");
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
  const loadDoctorQueue = async (targetDateFilter = doctorQueueDateFilter) => {
    if (!selectedDoctor) return;
    setLoadingQueue(true);
    try {
      let dateParam = targetDateFilter;
      if (targetDateFilter === "today") dateParam = new Date().toISOString().split("T")[0];
      else if (targetDateFilter === "tomorrow") dateParam = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const q = await hospitalApi.getLiveQueue(selectedDoctor.id, dateParam);
      setQueue(q || []);

      // Check if there is an active in_consultation entry or match with activePatientId
      const inConsult = (q || []).find(item => item.queue_status === "in_consultation");
      const matched = activePatientId ? (q || []).find(item => item.patient_id === activePatientId) : null;
      const target = inConsult || matched || (q || [])[0];
      if (target) {
        setActiveConsultation(target);
        loadPatientClinicalData(target.patient_id);
        loadPatientPackages(target.patient_id, selectedDoctor.id);
        onPatientSelected?.(target.patient_id);
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

  // Load Doctor-Prescribed Packages & Multi-Session Items for this Patient
  const loadPatientPackages = async (patientId, docId = selectedDoctor?.id) => {
    if (!patientId) return;
    setLoadingPackages(true);
    try {
      const pkgs = await hospitalApi.getPatientPackages(patientId, docId);
      setPatientPackages(pkgs || []);
    } catch (err) {
      console.error("Could not load patient packages:", err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleConsumeSession = async (pkgId, itemId) => {
    if (!activeConsultation || !selectedDoctor) return;
    try {
      await hospitalApi.consumePackageSession(
        activeConsultation.patient_id,
        pkgId,
        itemId,
        {
          doctor_id: selectedDoctor.id,
          delta: 1,
          notes: `Session served in consultation by ${selectedDoctor.full_name}`
        },
        "doctor"
      );
      setToast({ type: "success", text: "1 Session marked as served today! Progress updated across all clinic desks." });
      loadPatientPackages(activeConsultation.patient_id, selectedDoctor.id);
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to record session served." });
    }
  };

  const handleOpenEditPackage = (pkg) => {
    setSelectedPackageToEdit(pkg);
    setEditPackageForm({
      package_name: pkg.package_name,
      package_type: pkg.package_type,
      total_price: pkg.total_price,
      discount_amount: pkg.discount_amount,
      status: pkg.status,
      notes: pkg.notes || "",
      items: (pkg.items || []).map(it => ({
        service_id: it.service_id || "",
        item_name: it.item_name,
        sessions_total: it.sessions_total,
        sessions_used: it.sessions_used,
        unit_price: it.unit_price
      }))
    });
    setShowEditPackageModal(true);
  };

  const handleCreatePackageSubmit = async (e) => {
    e.preventDefault();
    if (!activeConsultation || !selectedDoctor) return;
    if (!newPackageForm.package_name.trim()) {
      setToast({ type: "error", text: "Please enter a Package or Service Name." });
      return;
    }
    const validItems = newPackageForm.items.filter(it => it.item_name.trim() !== "");
    if (validItems.length === 0) {
      setToast({ type: "error", text: "Please specify at least one treatment item." });
      return;
    }

    try {
      await hospitalApi.createPatientPackage(
        activeConsultation.patient_id,
        {
          ...newPackageForm,
          doctor_id: selectedDoctor.id,
          total_price: Number(newPackageForm.total_price || 0),
          discount_amount: Number(newPackageForm.discount_amount || 0),
          items: validItems.map(it => ({
            service_id: it.service_id || null,
            item_name: it.item_name.trim(),
            sessions_total: Number(it.sessions_total || 1),
            sessions_used: Number(it.sessions_used || 0),
            unit_price: Number(it.unit_price || 0)
          }))
        },
        "doctor"
      );
      setToast({ type: "success", text: `Treatment plan "${newPackageForm.package_name}" prescribed for ${activeConsultation.patient_name}!` });
      setShowNewPackageModal(false);
      loadPatientPackages(activeConsultation.patient_id, selectedDoctor.id);
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to prescribe package." });
    }
  };

  const handleEditPackageSubmit = async (e) => {
    e.preventDefault();
    if (!activeConsultation || !selectedPackageToEdit || !selectedDoctor) return;

    try {
      await hospitalApi.updatePatientPackage(
        activeConsultation.patient_id,
        selectedPackageToEdit.id,
        {
          ...editPackageForm,
          doctor_id: selectedDoctor.id,
          total_price: Number(editPackageForm.total_price || 0),
          discount_amount: Number(editPackageForm.discount_amount || 0),
          items: editPackageForm.items.map(it => ({
            service_id: it.service_id || null,
            item_name: it.item_name.trim(),
            sessions_total: Number(it.sessions_total || 1),
            sessions_used: Number(it.sessions_used || 0),
            unit_price: Number(it.unit_price || 0)
          }))
        },
        "doctor"
      );
      setToast({ type: "success", text: "Package configuration updated!" });
      setShowEditPackageModal(false);
      loadPatientPackages(activeConsultation.patient_id, selectedDoctor.id);
    } catch (err) {
      setToast({ type: "error", text: err.message || "Failed to update package." });
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorQueue(doctorQueueDateFilter);
      loadDoctorServices(selectedDoctor.id);
      const interval = setInterval(() => loadDoctorQueue(doctorQueueDateFilter), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDoctor, doctorQueueDateFilter]);

  // Handler to Enter a Doctor's Chamber
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentCalled(null);
    setActiveConsultation(null);
    setPatientHistory([]);
    setPatientPackages([]);
    setActiveChamberTab("consultation");
    loadDoctorServices(doctor.id);
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
      loadPatientPackages(calledItem.patient_id, selectedDoctor.id);
      onPatientSelected?.(calledItem.patient_id);
      setToast({ type: "success", text: `Consultation started for ${calledItem.patient_name}` });
      loadDoctorQueue();
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleSelectPatientFromQueue = (item) => {
    setActiveConsultation(item);
    loadPatientClinicalData(item.patient_id);
    if (selectedDoctor) {
      loadPatientPackages(item.patient_id, selectedDoctor.id);
    }
    onPatientSelected?.(item.patient_id);
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
      const finishedPatientId = activeConsultation.patient_id;
      if (onPatientSelected && finishedPatientId) {
        onPatientSelected(finishedPatientId);
      }
      setToast({ 
        type: "success", 
        text: `Consultation finalized for ${activeConsultation.patient_name}! Record saved across all clinic portals.` 
      });
      
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

      {/* Chamber Navigation Tab Selector */}
      <div className="flex items-center gap-3 border-b border-[#9DB4C0] pb-2 flex-wrap">
        <button
          onClick={() => setActiveChamberTab("consultation")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
            activeChamberTab === "consultation"
              ? "bg-[#253237] text-white shadow"
              : "bg-white text-[#253237] border border-[#9DB4C0] hover:bg-[#E0FBFC]"
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Patient Queue & Consultations</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#E0FBFC] text-[#253237] font-black ml-1">
            {queue.length}
          </span>
        </button>

        <button
          onClick={() => setActiveChamberTab("services")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all ${
            activeChamberTab === "services"
              ? "bg-[#253237] text-white shadow"
              : "bg-white text-[#253237] border border-[#9DB4C0] hover:bg-[#E0FBFC]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Offered Procedures & Services</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black ml-1">
            {doctorServices.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Patient Queue & Consultations */}
      {activeChamberTab === "consultation" && (
        <div className="space-y-6">
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
            
            {/* Left Column: Doctor Chamber Queue (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-[#9DB4C0] overflow-hidden shadow-sm">
                <div className="bg-[#253237] text-white px-4 py-3 flex items-center justify-between">
                  <h3 className="font-bold text-sm">Chamber Queue ({queue.length})</h3>
                  <span className="text-xs text-[#9DB4C0]">Token Order</span>
                </div>

                {/* Doctor Queue Date Filter Bar */}
                <div className="p-2.5 bg-slate-50 border-b border-[#C2DFE3] flex items-center justify-between gap-1 flex-wrap text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDoctorQueueDateFilter("all")}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${
                        doctorQueueDateFilter === "all"
                          ? "bg-[#253237] text-white border-[#253237]"
                          : "bg-white text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                      }`}
                    >
                      All Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setDoctorQueueDateFilter("today")}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${
                        doctorQueueDateFilter === "today"
                          ? "bg-[#253237] text-white border-[#253237]"
                          : "bg-white text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDoctorQueueDateFilter("tomorrow")}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${
                        doctorQueueDateFilter === "tomorrow"
                          ? "bg-[#253237] text-white border-[#253237]"
                          : "bg-white text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <div className="p-3 divide-y divide-[#C2DFE3] max-h-[600px] overflow-y-auto custom-scrollbar">
                  {queue.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5C6B73]">
                      No patients in queue for this date filter.
                    </div>
                  ) : (
                    queue.map((item) => {
                      const isSelected = activeConsultation?.patient_id === item.patient_id;
                      return (
                        <div 
                          key={item.queue_id || item.appointment_id} 
                          onClick={() => handleSelectPatientFromQueue(item)}
                          className={`py-3 px-2 rounded-xl flex items-center justify-between text-xs gap-2 cursor-pointer transition-all ${
                            isSelected ? "bg-[#E0FBFC] border border-[#253237] shadow-xs" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <TokenBadge tokenNumber={item.token_number} status={item.queue_status} size="sm" />
                            <div>
                              <div className="font-bold text-[#253237] flex items-center gap-1.5">
                                <span>{item.patient_name}</span>
                                <span className="text-[10px] px-1 py-0.2 bg-slate-100 text-[#5C6B73] border border-slate-200 rounded font-semibold">
                                  {item.date}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#5C6B73]">{item.service_name}</div>
                              <div className="mt-0.5">
                                <StatusBadge status={item.queue_status} />
                              </div>
                            </div>
                          </div>

                          {item.queue_status === "called" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartConsultation(item);
                              }}
                              className="px-2.5 py-1 bg-[#253237] text-white rounded font-semibold text-[11px] hover:bg-[#1b2428] cursor-pointer shrink-0"
                            >
                              Start
                            </button>
                          )}
                        </div>
                      );
                    })
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
                    <div className="flex items-center gap-2">
                      {onNavigateTo && (
                        <button
                          type="button"
                          onClick={() => {
                            onPatientSelected?.(activeConsultation.patient_id);
                            onNavigateTo("pos", activeConsultation.patient_id);
                          }}
                          className="px-3 py-1 bg-[#E0FBFC] hover:bg-[#C2DFE3] text-[#253237] border border-[#9DB4C0] text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Open POS Terminal to bill this patient for procedures or medication"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[#253237]" /> Send to POS
                        </button>
                      )}
                      <span className="px-3 py-1 bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold rounded-full flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> Chamber Active
                      </span>
                    </div>
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
                        <label className="block font-bold text-[#253237] mb-1">Physical / Derm Examination Findings *</label>
                        <textarea
                          required
                          rows={2}
                          value={clinicalForm.examination_findings}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, examination_findings: e.target.value })}
                          placeholder="Erythematous papules, comedones, scaling noted..."
                          className="w-full clinical-input"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#253237] mb-1">Definitive Diagnosis *</label>
                        <input
                          type="text"
                          required
                          value={clinicalForm.diagnosis}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })}
                          placeholder="e.g. Moderate Acne Vulgaris (Grade III)"
                          className="w-full clinical-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#253237] mb-1">Treatment Plan & Protocol *</label>
                      <textarea
                        required
                        rows={2}
                        value={clinicalForm.treatment_plan}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, treatment_plan: e.target.value })}
                        placeholder="Prescribe topical retinoid, chemical peel session scheduled..."
                        className="w-full clinical-input"
                      />
                    </div>

                    {/* DOCTOR EXCLUSIVE: Prescribed Services & Multi-Session Treatment Packages */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-[#9DB4C0] space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C2DFE3] pb-2.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Package className="w-4 h-4 text-emerald-800" />
                            <h4 className="font-bold text-xs sm:text-sm text-[#253237]">Prescribed Services & Multi-Session Treatment Plans</h4>
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black px-2 py-0.5 rounded-full">
                              Doctor Clinical Authority Only
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5C6B73] mt-0.5">
                            Prescribe combinations of procedures (e.g. 5x Laser, 3x Facials, 2x Manicures/Pedicures), track served sessions, and manage pricing.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setNewPackageForm({
                              package_name: "",
                              package_type: "multi_package",
                              total_price: 15000,
                              discount_amount: 0,
                              notes: "",
                              items: [
                                {
                                  service_id: doctorServices[0]?.id || "",
                                  item_name: doctorServices[0]?.name || "",
                                  sessions_total: 3,
                                  sessions_used: 1,
                                  unit_price: doctorServices[0]?.base_price || 5000
                                }
                              ]
                            });
                            setShowNewPackageModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#253237] hover:bg-[#1b2428] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#E0FBFC]" /> + Prescribe Package / Service
                        </button>
                      </div>

                      {/* Active Packages for this patient */}
                      {loadingPackages ? (
                        <div className="py-4 text-center text-xs text-[#5C6B73]">
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-[#253237]" />
                          Loading patient treatment packages...
                        </div>
                      ) : patientPackages.length === 0 ? (
                        <div className="p-3.5 bg-white rounded-xl border border-dashed border-[#9DB4C0] text-center space-y-1">
                          <p className="text-xs font-semibold text-[#253237]">No custom treatment packages prescribed for {activeConsultation.patient_name} yet.</p>
                          <p className="text-[11px] text-[#5C6B73]">
                            Click <strong>"+ Prescribe Package / Service"</strong> above to tailor a combination plan (e.g. 5 Laser + 3 Facials) or assign single services.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientPackages.map((pkg) => (
                            <div key={pkg.id} className="p-3 bg-white rounded-xl border border-[#9DB4C0] shadow-xs space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-xs sm:text-sm text-[#253237]">{pkg.package_name}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      pkg.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-teal-100 text-teal-800"
                                    }`}>
                                      {pkg.status === "completed" ? "✓ Completed" : "Active Plan"}
                                    </span>
                                    <span className="text-[11px] text-[#5C6B73]">
                                      Total Sessions: <strong>{pkg.consumed_sessions}/{pkg.total_sessions}</strong>
                                    </span>
                                  </div>
                                  {pkg.notes && <p className="text-[11px] text-[#5C6B73] mt-0.5 italic">"{pkg.notes}"</p>}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  <div className="text-right">
                                    <span className="text-xs font-black text-[#253237] block">
                                      PKR {Number(pkg.final_price ?? pkg.total_price).toLocaleString()}
                                    </span>
                                    {Number(pkg.discount_amount || 0) > 0 && (
                                      <span className="text-[10px] text-emerald-700 font-semibold block">
                                        (Catalog PKR {Number(pkg.total_price).toLocaleString()} - Discount PKR {Number(pkg.discount_amount).toLocaleString()})
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPackage(pkg)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#253237] text-[11px] font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer"
                                    title="Edit sessions or pricing"
                                  >
                                    <Edit3 className="w-3 h-3 text-[#5C6B73]" /> Edit
                                  </button>
                                </div>
                              </div>

                              {/* Package Combination Items & Session Tracker */}
                              <div className="space-y-1.5">
                                {(pkg.items || []).map((it) => {
                                  const pct = Math.min(100, Math.round((it.sessions_used / it.sessions_total) * 100));
                                  return (
                                    <div key={it.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                      <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-bold text-[#253237]">{it.item_name}</span>
                                          <span className="text-[11px] font-bold text-[#5C6B73]">
                                            {it.sessions_used} of {it.sessions_total} used ({it.sessions_remaining} remaining)
                                          </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-1.5 rounded-full transition-all ${
                                              it.status === "completed" ? "bg-emerald-600" : "bg-teal-600"
                                            }`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>

                                      {/* Action for Doctor to mark session served */}
                                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                        {it.sessions_remaining > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => handleConsumeSession(pkg.id, it.id)}
                                            className="px-2.5 py-1 bg-[#253237] hover:bg-[#1b2428] text-white text-[11px] font-bold rounded-md shadow-xs flex items-center gap-1 cursor-pointer"
                                            title="Click when patient receives this procedure in today's visit"
                                          >
                                            <Check className="w-3 h-3 text-[#E0FBFC]" /> Mark 1 Session Served Today
                                          </button>
                                        ) : (
                                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            ✓ Fully Served
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Prescription Item Builder */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-[#9DB4C0] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-[#253237] flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#5C6B73]" /> Prescription Version 1 Builder
                        </div>
                        <button
                          type="button"
                          onClick={handleAddRxItem}
                          className="text-xs font-bold text-[#253237] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Medication
                        </button>
                      </div>

                      {rxItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center">
                          <input
                            type="text"
                            required
                            placeholder="Medicine (e.g. Doxycycline 100mg)"
                            value={item.medication_name}
                            onChange={(e) => handleRxItemChange(idx, "medication_name", e.target.value)}
                            className="sm:col-span-4 clinical-input text-xs"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Dosage (e.g. 1 cap)"
                            value={item.dosage}
                            onChange={(e) => handleRxItemChange(idx, "dosage", e.target.value)}
                            className="sm:col-span-2 clinical-input text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={item.frequency}
                            onChange={(e) => handleRxItemChange(idx, "frequency", e.target.value)}
                            className="sm:col-span-3 clinical-input text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={item.duration}
                            onChange={(e) => handleRxItemChange(idx, "duration", e.target.value)}
                            className="sm:col-span-2 clinical-input text-xs"
                          />
                          {rxItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRxItem(idx)}
                              className="text-rose-600 font-bold hover:text-rose-800 text-center cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-[#253237] mb-1">Patient Visible Advice & Notes</label>
                        <input
                          type="text"
                          value={clinicalForm.clinical_notes}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, clinical_notes: e.target.value })}
                          placeholder="Apply sunscreen SPF 50+, avoid dairy..."
                          className="w-full clinical-input"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#253237] mb-1 flex items-center gap-1.5">
                          <span>Doctor Private Notes</span>
                          <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">Rule 14: Masked from Patient</span>
                        </label>
                        <input
                          type="text"
                          value={clinicalForm.doctor_private_notes}
                          onChange={(e) => setClinicalForm({ ...clinicalForm, doctor_private_notes: e.target.value })}
                          placeholder="Confidential clinical thoughts, compliance risk..."
                          className="w-full clinical-input"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                      <button
                        type="submit"
                        className="btn-primary text-sm px-6 py-2.5 shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> Complete Consultation & Sign
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-[#9DB4C0] text-center space-y-3">
                  <Stethoscope className="w-12 h-12 text-[#9DB4C0] mx-auto opacity-70" />
                  <h3 className="font-bold text-base text-[#253237]">No Active Consultation in Chamber</h3>
                  <p className="text-xs text-[#5C6B73] max-w-md mx-auto">
                    Click <strong>"CALL NEXT PATIENT"</strong> to call the next checked-in waiting patient or select a patient from the queue on the left.
                  </p>
                </div>
              )}

              {/* Patient Historical Clinical Records & Prescriptions */}
              {patientHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
                    <h3 className="font-bold text-sm sm:text-base text-[#253237] flex items-center gap-2">
                      <History className="w-4 h-4 text-[#5C6B73]" /> Patient Past Consultations & Revision Audits
                    </h3>
                    <span className="text-xs text-[#5C6B73]">Immutable Clinical History</span>
                  </div>

                  <div className="space-y-4">
                    {patientHistory.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-[#9DB4C0] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-xs sm:text-sm text-[#253237]">
                            {rec.visit_date} — {rec.diagnosis}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedRecordToEdit(rec);
                              setEditForm({
                                diagnosis: rec.diagnosis,
                                examination_findings: rec.examination_findings,
                                treatment_plan: rec.treatment_plan,
                                clinical_notes: rec.clinical_notes || "",
                                edit_reason: ""
                              });
                              setShowEditModal(true);
                            }}
                            className="px-2.5 py-1 bg-white border border-[#9DB4C0] text-[#253237] rounded text-xs font-semibold hover:bg-[#E0FBFC] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Edit Assessment
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><strong>Chief Complaint:</strong> {rec.chief_complaint}</div>
                          <div><strong>Treatment:</strong> {rec.treatment_plan}</div>
                        </div>

                        {rec.prescription && (
                          <div className="pt-2 border-t border-[#C2DFE3]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#253237]">Prescription (Version {rec.prescription.version_number})</span>
                              <button
                                onClick={() => handleStartPrescriptionCorrection(rec.prescription)}
                                className="text-xs text-teal-800 font-bold hover:underline cursor-pointer"
                              >
                                + Issue Corrected Version
                              </button>
                            </div>
                            <PrescriptionViewer prescription={rec.prescription} />
                          </div>
                        )}

                        {rec.audit_trail && rec.audit_trail.length > 0 && (
                          <div className="pt-2 border-t border-[#C2DFE3]">
                            <div className="text-[11px] font-bold text-[#5C6B73] mb-1">Clinical Record Audit Trail:</div>
                            <AuditTimeline auditEvents={rec.audit_trail} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Doctor Offered Procedures & Services Management */}
      {activeChamberTab === "services" && (
        <div className="bg-white rounded-3xl border border-[#9DB4C0] p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C2DFE3] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#253237]" />
                <h3 className="text-lg font-black text-[#253237]">
                  Clinical & Aesthetic Procedures Offered by {selectedDoctor.full_name}
                </h3>
              </div>
              <p className="text-xs text-[#5C6B73] mt-1">
                Patients booking with you will only see and choose from these specialized procedures. You can write and add new treatments anytime.
              </p>
            </div>

            <button
              onClick={() => setShowAddServiceModal(true)}
              className="btn-primary text-xs sm:text-sm px-5 py-2.5 flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" /> Write & Add New Service
            </button>
          </div>

          {loadingServices ? (
            <div className="py-12 text-center text-xs text-[#5C6B73]">
              <RefreshCw className="w-6 h-6 animate-spin text-[#253237] mx-auto mb-2" />
              Loading procedure catalog...
            </div>
          ) : doctorServices.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5C6B73] bg-slate-50 rounded-2xl border border-dashed border-[#9DB4C0] p-6 space-y-2">
              <FileText className="w-10 h-10 text-[#9DB4C0] mx-auto opacity-70 mb-1" />
              <p className="font-bold text-sm text-[#253237]">No procedures registered for your chamber yet.</p>
              <p>Click the button below to add your clinical treatments and aesthetic procedures.</p>
              <button
                onClick={() => setShowAddServiceModal(true)}
                className="btn-primary text-xs px-4 py-2 mt-2 inline-flex"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Procedure
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctorServices.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-slate-50 hover:bg-[#E0FBFC]/30 rounded-2xl border border-[#9DB4C0] p-5 flex flex-col justify-between space-y-3 transition-all group hover:border-[#253237] hover:shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E0FBFC] text-[#253237] text-[10px] font-black border border-[#9DB4C0]">
                        {srv.category}
                      </span>
                      <span className="text-[11px] font-bold text-[#5C6B73]">
                        {srv.duration_minutes || 30} mins
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[#253237] leading-tight group-hover:text-teal-900 transition-colors">
                      {srv.name}
                    </h4>

                    {srv.description && (
                      <p className="text-xs text-[#5C6B73] line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#C2DFE3] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#5C6B73] uppercase font-bold block">Consultation / Base Fee</span>
                      <span className="font-black text-sm text-[#253237]">
                        PKR {Number(srv.base_price || 0).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoctorService(srv.id, srv.name)}
                      className="px-2.5 py-1 text-[11px] text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Edit Clinical Record Form */}
      {showEditModal && selectedRecordToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237] flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> Edit Clinical Assessment
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-[#5C6B73] cursor-pointer">✕</button>
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

      {/* MODAL 2: Prescription Version Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237] flex items-center gap-2">
                <FileText className="w-5 h-5" /> Issue Corrected Prescription Version
              </h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-[#5C6B73] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCorrection} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#253237] mb-1">Reason for Revision *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adjusted dosage due to mild dryness / improved compliance"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full clinical-input"
                />
              </div>

              <div className="space-y-2">
                <div className="font-bold text-xs text-[#253237]">Medication List</div>
                {correctionItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2">
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

      {/* MODAL 3: Write & Add New Doctor Service */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#E0FBFC] text-[#253237]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-lg text-[#253237]">Add Procedure / Clinical Service</h3>
                  <p className="text-xs text-[#5C6B73]">Offer a new specialized treatment for {selectedDoctor.full_name}</p>
                </div>
              </div>
              <button onClick={() => setShowAddServiceModal(false)} className="text-[#5C6B73] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddDoctorService} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#253237] mb-1">Procedure / Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exosome Scalp Boost / Polynucleotide Skin Glow"
                  value={newServiceForm.name}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                  className="w-full clinical-input font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#253237] mb-1">Clinical Category *</label>
                  <select
                    value={newServiceForm.category}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
                    className="w-full clinical-input font-medium"
                  >
                    <option value="Clinical Dermatology">Clinical Dermatology</option>
                    <option value="Laser & Aesthetics">Laser & Aesthetics</option>
                    <option value="Trichology & Hair">Trichology & Hair</option>
                    <option value="Aesthetic Rejuvenation">Aesthetic Rejuvenation</option>
                    <option value="Skin Rejuvenation">Skin Rejuvenation</option>
                    <option value="Injectables & Anti-Aging">Injectables & Anti-Aging</option>
                    <option value="Medical Facial">Medical Facial</option>
                    <option value="Wellness & Glow">Wellness & Glow</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Base Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    step={100}
                    placeholder="5000"
                    value={newServiceForm.base_price}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, base_price: e.target.value })}
                    className="w-full clinical-input font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Estimated Duration (Minutes)</label>
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={newServiceForm.duration_minutes}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, duration_minutes: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Clinical Description & Indications</label>
                <textarea
                  rows={2}
                  placeholder="Clinical protocol details, targeted skin/hair concerns, recommended sessions..."
                  value={newServiceForm.description}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 text-[#5C6B73] cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingService}
                  className="btn-primary px-5 py-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingService ? "Adding Service..." : "Add to Chamber Offerings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Prescribe New Multi-Session Treatment Package (Doctor Exclusive) */}
      {showNewPackageModal && activeConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#253237] flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-800" /> Prescribe Treatment Plan / Package
                </h3>
                <p className="text-xs text-[#5C6B73]">
                  Patient: <strong>{activeConsultation.patient_name}</strong> • Attending: <strong>{selectedDoctor.full_name}</strong>
                </p>
              </div>
              <button onClick={() => setShowNewPackageModal(false)} className="text-[#5C6B73] hover:text-[#253237] cursor-pointer text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePackageSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#253237] mb-1">Package or Procedure Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5x Laser Hair Removal + 3x HydraFacial Glow Plan"
                    value={newPackageForm.package_name}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, package_name: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Plan Type</label>
                  <select
                    value={newPackageForm.package_type}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, package_type: e.target.value })}
                    className="w-full clinical-input font-medium"
                  >
                    <option value="multi_package">Multi-Session Combination</option>
                    <option value="single_service">Single Service (1 Session)</option>
                  </select>
                </div>
              </div>

              {/* Combination Items Builder */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#9DB4C0] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#253237] block">Combination Items & Session Counts</span>
                    <span className="text-[11px] text-[#5C6B73]">Combine multiple treatments (e.g. 5 Laser, 3 Facials, 2 Manicures)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPackageForm({
                        ...newPackageForm,
                        items: [
                          ...newPackageForm.items,
                          { service_id: doctorServices[0]?.id || "", item_name: doctorServices[0]?.name || "", sessions_total: 1, sessions_used: 0, unit_price: 3000 }
                        ]
                      });
                    }}
                    className="text-xs font-bold text-teal-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Another Item
                  </button>
                </div>

                <div className="space-y-2.5">
                  {newPackageForm.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Procedure / Item Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Procedure (e.g. HydraFacial / Laser / Manicure)"
                          value={item.item_name}
                          onChange={(e) => {
                            const updated = [...newPackageForm.items];
                            updated[idx].item_name = e.target.value;
                            setNewPackageForm({ ...newPackageForm, items: updated });
                          }}
                          className="w-full clinical-input text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Total Sessions</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.sessions_total}
                          onChange={(e) => {
                            const updated = [...newPackageForm.items];
                            updated[idx].sessions_total = Math.max(1, parseInt(e.target.value) || 1);
                            setNewPackageForm({ ...newPackageForm, items: updated });
                          }}
                          className="w-full clinical-input text-xs font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Served Today</label>
                        <input
                          type="number"
                          min="0"
                          max={item.sessions_total}
                          required
                          value={item.sessions_used}
                          onChange={(e) => {
                            const updated = [...newPackageForm.items];
                            updated[idx].sessions_used = Math.min(updated[idx].sessions_total, Math.max(0, parseInt(e.target.value) || 0));
                            setNewPackageForm({ ...newPackageForm, items: updated });
                          }}
                          className="w-full clinical-input text-xs font-bold text-center text-teal-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Unit Price (PKR)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => {
                            const updated = [...newPackageForm.items];
                            updated[idx].unit_price = Math.max(0, parseFloat(e.target.value) || 0);
                            setNewPackageForm({ ...newPackageForm, items: updated });
                          }}
                          className="w-full clinical-input text-xs font-bold"
                        />
                      </div>

                      <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                        {newPackageForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newPackageForm.items.filter((_, i) => i !== idx);
                              setNewPackageForm({ ...newPackageForm, items: updated });
                            }}
                            className="text-rose-600 hover:text-rose-800 font-black text-sm cursor-pointer"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#253237] mb-1">Total Package Price (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPackageForm.total_price}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, total_price: parseFloat(e.target.value) || 0 })}
                    className="w-full clinical-input font-extrabold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Bundle Discount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={newPackageForm.discount_amount}
                    onChange={(e) => setNewPackageForm({ ...newPackageForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full clinical-input text-emerald-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Doctor's Schedule Notes & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient cannot use multiple facials in one day. Sessions must be scheduled 3-4 weeks apart..."
                  value={newPackageForm.notes}
                  onChange={(e) => setNewPackageForm({ ...newPackageForm, notes: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowNewPackageModal(false)}
                  className="px-4 py-2 text-[#5C6B73] cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Prescribe Treatment Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Existing Patient Package (Doctor Exclusive) */}
      {showEditPackageModal && selectedPackageToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#253237] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-teal-800" /> Adjust Treatment Package & Sessions
                </h3>
                <p className="text-xs text-[#5C6B73]">
                  Package ID: <strong>{selectedPackageToEdit.id}</strong> • Patient: <strong>{activeConsultation?.patient_name}</strong>
                </p>
              </div>
              <button onClick={() => setShowEditPackageModal(false)} className="text-[#5C6B73] hover:text-[#253237] cursor-pointer text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleEditPackageSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#253237] mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={editPackageForm.package_name}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, package_name: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Status</label>
                  <select
                    value={editPackageForm.status}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, status: e.target.value })}
                    className="w-full clinical-input font-bold"
                  >
                    <option value="active">Active Plan</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items & Session Adjustment */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-[#9DB4C0] space-y-3">
                <span className="font-bold text-xs text-[#253237] block">Adjust Total Allowed & Served Sessions</span>
                <div className="space-y-2.5">
                  {editPackageForm.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs items-center">
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Item Name</label>
                        <input
                          type="text"
                          required
                          value={item.item_name}
                          onChange={(e) => {
                            const copy = [...editPackageForm.items];
                            copy[idx].item_name = e.target.value;
                            setEditPackageForm({ ...editPackageForm, items: copy });
                          }}
                          className="w-full clinical-input text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Total Sessions</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.sessions_total}
                          onChange={(e) => {
                            const copy = [...editPackageForm.items];
                            copy[idx].sessions_total = Math.max(1, parseInt(e.target.value) || 1);
                            setEditPackageForm({ ...editPackageForm, items: copy });
                          }}
                          className="w-full clinical-input text-xs font-bold text-center"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Sessions Used</label>
                        <input
                          type="number"
                          min="0"
                          max={item.sessions_total}
                          required
                          value={item.sessions_used}
                          onChange={(e) => {
                            const copy = [...editPackageForm.items];
                            copy[idx].sessions_used = Math.min(copy[idx].sessions_total, Math.max(0, parseInt(e.target.value) || 0));
                            setEditPackageForm({ ...editPackageForm, items: copy });
                          }}
                          className="w-full clinical-input text-xs font-bold text-center text-teal-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[#5C6B73] mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => {
                            const copy = [...editPackageForm.items];
                            copy[idx].unit_price = Math.max(0, parseFloat(e.target.value) || 0);
                            setEditPackageForm({ ...editPackageForm, items: copy });
                          }}
                          className="w-full clinical-input text-xs"
                        />
                      </div>

                      <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                        {editPackageForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editPackageForm.items.filter((_, i) => i !== idx);
                              setEditPackageForm({ ...editPackageForm, items: copy });
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold text-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#253237] mb-1">Total Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editPackageForm.total_price}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, total_price: parseFloat(e.target.value) || 0 })}
                    className="w-full clinical-input font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Discount Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={editPackageForm.discount_amount}
                    onChange={(e) => setEditPackageForm({ ...editPackageForm, discount_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full clinical-input text-emerald-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Notes & Spacing Guidance</label>
                <textarea
                  rows={2}
                  value={editPackageForm.notes}
                  onChange={(e) => setEditPackageForm({ ...editPackageForm, notes: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowEditPackageModal(false)}
                  className="px-4 py-2 text-[#5C6B73] cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2.5 shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Package Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
