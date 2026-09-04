import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, Clock, Bot, FileText, CreditCard, Bell, User, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, ChevronRight, XCircle, Search, 
  Sparkles, UserPlus, Users, Phone, MapPin, RefreshCw, X, Stethoscope,
  Activity, Pill, HeartPulse, Check
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
    biography: "Senior Consultant with 12+ years in clinical dermatology, acne scar pathology, and advanced cosmetic laser resurfacing.",
    qualifications: "MBBS, FCPS (Dermatology), Fellow American Academy of Dermatology",
    experience_years: 12,
    consultation_fee: 2500,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    start_time: "09:00",
    end_time: "17:00",
    areas_of_expertise: ["Severe Acne Vulgaris", "Fractional CO2 Laser", "Chemical Peels", "Melasma & Pigmentation", "Acne Scars"]
  },
  {
    id: "doc-02",
    full_name: "Dr. Sarah Khan",
    specialization: "Aesthetic Physician & Trichologist",
    biography: "Specialist in autologous PRP hair restoration, scalp therapy, anti-aging injectables, and advanced skin rejuvenation.",
    qualifications: "MBBS, MCPS (Dermatology), Board Certified in Aesthetic Medicine",
    experience_years: 8,
    consultation_fee: 2000,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    start_time: "10:00",
    end_time: "18:00",
    areas_of_expertise: ["PRP Hair Restoration", "Alopecia & Hair Density", "HydraFacial MD", "Botox & Fillers", "Glutathione Radiance"]
  }
];

const DEFAULT_REGISTERED_PATIENTS = [
  { id: "pat-01", full_name: "Zainab Fatima", phone: "+923011112233", email: "zainab@gmail.com", gender: "female", dob: "1996-05-14", cnic: "35202-1234567-1", address: "F-7/2, Islamabad", emergency_contact: "+923011112200" },
  { id: "pat-02", full_name: "Bilal Hassan", phone: "+923022223344", email: "bilal@gmail.com", gender: "male", dob: "1991-11-20", cnic: "35202-7654321-2", address: "Gulberg III, Lahore", emergency_contact: "+923022223300" },
  { id: "pat-03", full_name: "Hamza Ali", phone: "+923033334455", email: "hamza@gmail.com", gender: "male", dob: "1998-02-10", cnic: "35202-9988776-3", address: "DHA Phase 5, Lahore", emergency_contact: "+923033334400" },
  { id: "pat-04", full_name: "Maryam Siddiqui", phone: "+923044445566", email: "maryam@gmail.com", gender: "female", dob: "1994-08-30", cnic: "35202-3344556-4", address: "Clifton Block 4, Karachi", emergency_contact: "+923044445500" },
  { id: "pat-05", full_name: "Usman Sheikh", phone: "+923055556677", email: "usman@gmail.com", gender: "male", dob: "1988-04-18", cnic: "35202-5566778-5", address: "Sector G-11/3, Islamabad", emergency_contact: "+923055556600" }
];

export default function PatientPortal({ patientId = "pat-01", onPatientChange, onOpenAI }) {
  // Active Patient State
  const [activePatient, setActivePatient] = useState(DEFAULT_REGISTERED_PATIENTS[0]);
  const [allPatients, setAllPatients] = useState(DEFAULT_REGISTERED_PATIENTS);

  // Search Patient Records State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regForm, setRegForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "female",
    dob: "1998-01-01",
    cnic: "",
    address: "",
    emergency_contact: "",
    whatsapp_available: true,
    primary_notification_channel: "whatsapp"
  });

  // Clinical & Appointment States
  const [appointments, setAppointments] = useState([]);
  const [clinicalRecords, setClinicalRecords] = useState([]);
  const [financials, setFinancials] = useState(null);
  const [doctors, setDoctors] = useState(DEFAULT_AESTHETIC_DOCTORS);
  const [services, setServices] = useState(DEFAULT_AESTHETIC_SERVICES);
  const [doctorServices, setDoctorServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Generic Booking Stepper State (Steps 1 to 5)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(DEFAULT_AESTHETIC_DOCTORS[0]);
  const [selectedService, setSelectedService] = useState(DEFAULT_AESTHETIC_SERVICES[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [tokenMetrics, setTokenMetrics] = useState(null);
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  // Patient info for generic booking (anyone can book!)
  const [bookingPatientForm, setBookingPatientForm] = useState({
    full_name: "",
    phone: "",
    gender: "female",
    email: "",
    notes: ""
  });

  // Fetch Services specialized for selected doctor
  const fetchDoctorServices = async (docId) => {
    if (!docId) return;
    setLoadingServices(true);
    try {
      const srvs = await hospitalApi.getServices(docId);
      const list = (srvs && Array.isArray(srvs) && srvs.length > 0) ? srvs : DEFAULT_AESTHETIC_SERVICES;
      setDoctorServices(list);
      if (list.length > 0) {
        setSelectedService(list[0]);
      }
    } catch (err) {
      console.error("Error loading doctor services:", err);
      setDoctorServices(DEFAULT_AESTHETIC_SERVICES);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSelectDoctorInBooking = (doc) => {
    setSelectedDoctor(doc);
    handleFetchTokenMetrics(doc.id, selectedDate);
    fetchDoctorServices(doc.id);
  };

  // Notification Preferences State
  const [prefForm, setPrefForm] = useState({
    primary_channel: "whatsapp",
    backup_channel: "email"
  });

  // Load All Patients from DB or fallback
  const loadPatientsList = async () => {
    try {
      const pList = await hospitalApi.listPatients(100);
      if (pList && Array.isArray(pList) && pList.length > 0) {
        setAllPatients(pList);
        const match = pList.find(p => p.id === patientId);
        if (match) {
          setActivePatient(match);
        }
      }
    } catch (err) {
      console.warn("Using default patients directory:", err);
    }
  };

  // Load Active Patient Data (Appointments, Clinical Records / Checkups, Financials)
  const loadPatientData = async (targetId = activePatient?.id) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [appts, records, fin, docList, srvList] = await Promise.all([
        hospitalApi.getPatientAppointments(targetId).catch(() => []),
        hospitalApi.getPatientClinicalRecords(targetId, "patient", targetId).catch(() => []),
        hospitalApi.getPatientFinancialSummary(targetId).catch(() => null),
        hospitalApi.getDoctors().catch(() => DEFAULT_AESTHETIC_DOCTORS),
        hospitalApi.getServices().catch(() => DEFAULT_AESTHETIC_SERVICES)
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
    loadPatientsList();
  }, []);

  useEffect(() => {
    loadPatientData(patientId);
  }, [patientId]);

  // Close search suggestions dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Handle live search input & backend query
  const handleSearchInputChange = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setShowSearchDropdown(true);
    const q = val.toLowerCase().trim();
    const localMatches = allPatients.filter(p =>
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q) ||
      (p.cnic || "").includes(q) ||
      (p.id || "").toLowerCase().includes(q)
    );
    setSearchResults(localMatches);

    // Also attempt remote search API
    try {
      const remoteMatches = await hospitalApi.searchPatients(val.trim());
      if (remoteMatches && Array.isArray(remoteMatches)) {
        const merged = [...localMatches];
        remoteMatches.forEach(rm => {
          if (!merged.some(m => m.id === rm.id)) {
            merged.push(rm);
          }
        });
        setSearchResults(merged);
      }
    } catch (e) {
      // Fallback to local matches
    }
  };

  const handleSearch = async (val) => {
    if (!val.trim()) return;
    setIsSearching(true);
    try {
      const q = val.toLowerCase().trim();
      const match = allPatients.find(p =>
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(q) ||
        (p.cnic || "").includes(q) ||
        (p.id || "").toLowerCase() === q
      );
      if (match) {
        handleSelectPatient(match);
      } else {
        const results = await hospitalApi.searchPatients(val.trim());
        if (results && results.length > 0) {
          handleSelectPatient(results[0]);
        } else {
          setToast({ 
            type: "error", 
            text: `No patient record found matching "${val}". Click "+ Register Patient" to create a profile or book directly.` 
          });
        }
      }
    } catch (e) {
      setToast({ type: "error", text: "Search failed. Please try again." });
    } finally {
      setIsSearching(false);
      setShowSearchDropdown(false);
    }
  };

  // Switch Active Patient and Load their records
  const handleSelectPatient = (p) => {
    setActivePatient(p);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
    if (onPatientChange) {
      onPatientChange(p.id);
    }
    loadPatientData(p.id);
    setToast({ 
      type: "success", 
      text: `Loaded previous doctor checkup records for ${p.full_name} (${p.id}).` 
    });
  };

  // Register New Patient Handler
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!regForm.full_name.trim() || !regForm.phone.trim() || !regForm.cnic.trim()) {
      setToast({ type: "error", text: "Please provide Full Name, Phone Number, and CNIC." });
      return;
    }

    setIsSubmittingReg(true);
    try {
      const res = await hospitalApi.registerPatient({
        full_name: regForm.full_name.trim(),
        phone: regForm.phone.trim(),
        email: regForm.email.trim() || undefined,
        gender: regForm.gender,
        dob: regForm.dob,
        cnic: regForm.cnic.trim(),
        address: regForm.address.trim() || "Address on record",
        emergency_contact: regForm.emergency_contact.trim() || regForm.phone.trim(),
        whatsapp_available: regForm.whatsapp_available,
        primary_notification_channel: regForm.primary_notification_channel
      });

      const newId = res.patient_id || res.id;
      const newPatientObj = {
        id: newId,
        full_name: regForm.full_name.trim(),
        phone: regForm.phone.trim(),
        cnic: regForm.cnic.trim(),
        email: regForm.email.trim(),
        gender: regForm.gender,
        dob: regForm.dob
      };

      setAllPatients(prev => [newPatientObj, ...prev]);
      setActivePatient(newPatientObj);
      if (onPatientChange) onPatientChange(newId);

      setShowRegisterModal(false);
      setToast({ 
        type: "success", 
        text: `Patient "${newPatientObj.full_name}" registered! Portal records switched to this patient.` 
      });

      // Reset Form
      setRegForm({
        full_name: "",
        phone: "",
        email: "",
        gender: "female",
        dob: "1998-01-01",
        cnic: "",
        address: "",
        emergency_contact: "",
        whatsapp_available: true,
        primary_notification_channel: "whatsapp"
      });

      loadPatientData(newId);
    } catch (err) {
      setToast({ type: "error", text: err.message || "Patient registration failed." });
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleFetchTokenMetrics = async (docId, dateStr) => {
    try {
      const metrics = await hospitalApi.getTokenMetrics(docId, dateStr);
      setTokenMetrics(metrics);
    } catch (err) {
      console.error(err);
    }
  };

  // Generic Book Appointment Handler (Anyone can book!)
  const handleStartBooking = (initialDoc = null, initialSrv = null) => {
    const doc = initialDoc || selectedDoctor || doctors[0] || DEFAULT_AESTHETIC_DOCTORS[0];
    setSelectedDoctor(doc);
    setBookingStep(1);
    setBookingResult(null);
    setBookingPatientForm({
      full_name: activePatient ? activePatient.full_name : "",
      phone: activePatient ? activePatient.phone : "",
      gender: activePatient ? (activePatient.gender || "female") : "female",
      email: activePatient ? (activePatient.email || "") : "",
      notes: ""
    });
    setShowBookingModal(true);
    if (doc) {
      handleFetchTokenMetrics(doc.id, selectedDate);
      fetchDoctorServices(doc.id);
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
    const name = (bookingPatientForm.full_name || activePatient?.full_name || "").trim();
    const phone = (bookingPatientForm.phone || activePatient?.phone || "").trim();
    if (!name || !phone) {
      setToast({ type: "error", text: "Please provide Patient Full Name and Phone Number." });
      return;
    }

    try {
      const res = await hospitalApi.createBookingRequest({
        patient_id: activePatient?.id,
        patient_name: name,
        patient_phone: phone,
        patient_email: bookingPatientForm.email.trim() || undefined,
        patient_gender: bookingPatientForm.gender || "female",
        doctor_id: selectedDoctor.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        booking_source: "patient_portal",
        notes: bookingPatientForm.notes || bookingNotes
      });
      setBookingResult(res);
      setBookingStep(5);
      
      // If new patient was registered dynamically, reload list
      loadPatientsList();
      if (res.patient_id) {
        loadPatientData(res.patient_id);
      }
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleCheckInSelf = async (apptId) => {
    try {
      await hospitalApi.checkInPatient(apptId);
      setToast({ type: "success", text: "Checked in successfully! You are now active in the doctor's waiting queue." });
      loadPatientData(activePatient.id);
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const handleCancelAppt = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment? Your token will be permanently retired.")) return;
    try {
      await hospitalApi.cancelAppointment(apptId, activePatient.id, "patient", "Cancelled by patient via portal");
      setToast({ type: "success", text: "Appointment cancelled successfully. Token retired." });
      loadPatientData(activePatient.id);
    } catch (err) {
      setToast({ type: "error", text: err.message });
    }
  };

  const fillSampleCnic = () => {
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000);
    const lastDigit = Math.floor(1 + Math.random() * 9);
    setRegForm(prev => ({
      ...prev,
      cnic: `35202-${randomDigits}-${lastDigit}`
    }));
  };

  const upcomingAppt = appointments.find(a => a.status === "confirmed" || a.status === "pending");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm ${
          toast.type === "success" ? "bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0]" : "bg-rose-100 text-rose-900 border border-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-800" /> : <AlertCircle className="w-5 h-5 text-rose-800" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="font-bold hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#9DB4C0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-[#253237]">Patient Health Portal</h1>
            <span className="px-3 py-1 bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0] rounded-full text-xs font-black shadow-inner flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activePatient ? `${activePatient.full_name} (${activePatient.id})` : "Public Health Portal"}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5C6B73] mt-1">
            Book appointments with specialist doctors, view versioned prescriptions, and look up verified medical records.
          </p>
        </div>

        {/* Top-Right Action Buttons: UNDISTURBED BOOK APPOINTMENT */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleStartBooking()}
            className="btn-primary text-xs sm:text-sm px-5 py-3 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Book New Appointment
          </button>

          <button
            onClick={onOpenAI}
            className="btn-secondary text-xs sm:text-sm px-4 py-3 flex items-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#253237]" /> Ask AI Assistant
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH PATIENT RECORD BAR (WITH DYNAMIC SUGGESTIONS DROPDOWN)              */}
      {/* ========================================================================= */}
      <div ref={searchContainerRef} className="bg-white p-5 rounded-2xl border border-[#9DB4C0] shadow-sm space-y-3.5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C2DFE3] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E0FBFC] text-[#253237]">
              <Search className="w-5 h-5 text-[#253237]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#253237] flex items-center gap-2">
                <span>Search Patient Records & Previous Doctor Checkups</span>
                {activePatient && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active: {activePatient.full_name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#5C6B73]">
                Type patient name, phone, or CNIC below to view suggestions and load past consultations, diagnoses, and prescriptions.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setRegForm(prev => ({ ...prev, full_name: searchQuery }));
              setShowRegisterModal(true);
            }}
            className="text-xs font-bold text-teal-800 hover:underline flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Register New Patient Profile</span>
          </button>
        </div>

        {/* Search Input Row with Live Dropdown */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#5C6B73] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type patient name, phone number, or CNIC to search records..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchDropdown(true);
                }}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#9DB4C0] text-xs sm:text-sm text-[#253237] focus:outline-none focus:ring-2 focus:ring-[#253237] font-medium shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => { 
                    setSearchQuery(""); 
                    setSearchResults([]); 
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B73] hover:text-[#253237] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={isSearching}
              className="btn-primary text-xs sm:text-sm px-6 py-3 shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? "Searching..." : "Search Records"}</span>
            </button>
          </div>

          {/* DYNAMIC SUGGESTIONS DROPDOWN (Displays as user types, not already on screen) */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl border-2 border-[#253237] shadow-2xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
              <div className="p-3 bg-[#E0FBFC] border-b border-[#9DB4C0] flex items-center justify-between text-xs text-[#253237]">
                <span className="font-bold">
                  {searchResults.length > 0 
                    ? `Matching Patient Records (${searchResults.length})` 
                    : "No Exact Patient Match"}
                </span>
                <span className="text-[11px] text-[#5C6B73]">Click a suggestion to load medical records</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-[#C2DFE3]">
                  {searchResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className="p-3.5 hover:bg-[#E0FBFC]/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#253237] text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-teal-900 transition-colors">
                          {p.full_name?.split(" ")[0]?.[0] || "P"}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-[#253237] flex items-center gap-2">
                            <span>{p.full_name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-[#5C6B73] border font-semibold">
                              {p.id}
                            </span>
                          </div>
                          <div className="text-xs text-[#5C6B73] mt-0.5 flex items-center gap-3 flex-wrap">
                            <span>📞 {p.phone}</span>
                            {p.cnic && <span>🪪 {p.cnic}</span>}
                            {p.address && <span>📍 {p.address}</span>}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-[#253237] group-hover:text-teal-900 group-hover:translate-x-0.5 transition-all flex items-center gap-1 shrink-0">
                        <span>Load Checkups</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <User className="w-8 h-8 text-[#9DB4C0] mx-auto opacity-70" />
                  <p className="text-xs text-[#5C6B73]">
                    No registered patient found matching <strong>"{searchQuery}"</strong>.
                  </p>
                  <p className="text-xs text-[#5C6B73]">
                    Anyone can book an appointment without pre-registering, or you can register this patient now.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        setRegForm(prev => ({ ...prev, full_name: searchQuery }));
                        setShowSearchDropdown(false);
                        setShowRegisterModal(true);
                      }}
                      className="btn-primary text-xs px-4 py-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Register "{searchQuery}"
                    </button>
                    <button
                      onClick={() => {
                        setShowSearchDropdown(false);
                        handleStartBooking();
                      }}
                      className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                    >
                      Book Generic Appointment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE APPOINTMENT & QUEUE STATUS                                         */}
      {/* ========================================================================= */}
      {upcomingAppt && (
        <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in">
          <div className="flex items-start gap-4">
            <TokenBadge tokenNumber={upcomingAppt.token_number} status={upcomingAppt.status} size="lg" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-bold text-[#5C6B73] tracking-widest">Next Appointment</span>
                <StatusBadge status={upcomingAppt.status} />
                <span className="text-xs text-[#5C6B73]">For: <strong className="text-[#253237]">{upcomingAppt.patient_name || activePatient.full_name}</strong></span>
              </div>
              <h3 className="text-xl font-black text-[#253237] mt-1">{upcomingAppt.doctor_name}</h3>
              <p className="text-xs text-[#5C6B73]">{upcomingAppt.service_name} • Date: {upcomingAppt.appointment_date}</p>
              <div className="mt-2 text-xs font-semibold text-teal-800 bg-[#E0FBFC] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-[#9DB4C0]">
                <Clock className="w-3.5 h-3.5" /> Queue Status: <strong>{upcomingAppt.queue_status || "Awaiting Receptionist Approval"}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {upcomingAppt.status === "confirmed" && upcomingAppt.queue_status === "not_checked_in" && (
              <button
                onClick={() => handleCheckInSelf(upcomingAppt.id)}
                className="btn-primary text-xs sm:text-sm px-6 py-3 cursor-pointer shadow-md"
              >
                Self Check-In (Enter Queue)
              </button>
            )}

            <button
              onClick={() => handleCancelAppt(upcomingAppt.id)}
              className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              Cancel Appointment
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MEDICAL HISTORY & PREVIOUS DOCTOR CHECKUPS FOR SEARCHED PATIENT           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Doctor Checkups & Clinical Records (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#253237]" />
                <h3 className="font-black text-base text-[#253237]">
                  Medical History & Previous Doctor Checkups
                </h3>
              </div>
              <span className="text-xs text-[#5C6B73] font-semibold">
                Verified Records for <strong>{activePatient.full_name}</strong>
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#5C6B73]">
                <RefreshCw className="w-6 h-6 animate-spin text-[#253237] mx-auto mb-2" />
                Loading medical checkup records...
              </div>
            ) : clinicalRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#5C6B73] bg-slate-50 rounded-xl border border-dashed border-[#9DB4C0] p-6 space-y-2">
                <FileText className="w-10 h-10 text-[#9DB4C0] mx-auto opacity-70 mb-1" />
                <p className="font-bold text-sm text-[#253237]">No past doctor checkups on record for {activePatient.full_name}.</p>
                <p>When this patient attends a consultation, the attending doctor's assessment, diagnosis, and prescription will appear here.</p>
                <button
                  onClick={() => handleStartBooking()}
                  className="btn-primary text-xs px-4 py-2 mt-2 inline-flex cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book First Consultation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {clinicalRecords.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl bg-slate-50 border border-[#9DB4C0] space-y-3 hover:border-[#253237] transition-all">
                    <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-2">
                      <div>
                        <span className="font-extrabold text-sm text-[#253237] block">
                          {rec.visit_date} — {rec.service_name || "Clinical Consultation"}
                        </span>
                        <span className="text-xs text-[#5C6B73]">Attending Doctor: <strong>{rec.doctor_name}</strong></span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black">
                        ✓ Verified Checkup
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-[#C2DFE3]">
                        <span className="font-bold text-[#253237] block mb-0.5">Clinical Diagnosis:</span>
                        <span className="text-[#5C6B73] font-medium">{rec.diagnosis}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-[#C2DFE3]">
                        <span className="font-bold text-[#253237] block mb-0.5">Chief Complaint:</span>
                        <span className="text-[#5C6B73] font-medium">{rec.chief_complaint}</span>
                      </div>
                      <div className="sm:col-span-2 p-2.5 bg-white rounded-lg border border-[#C2DFE3]">
                        <span className="font-bold text-[#253237] block mb-0.5">Examination Findings & Treatment Plan:</span>
                        <p className="text-[#5C6B73] font-medium">{rec.examination_findings}</p>
                        <p className="text-[#253237] font-semibold mt-1">Plan: {rec.treatment_plan}</p>
                      </div>
                      {rec.clinical_notes && (
                        <div className="sm:col-span-2 p-2.5 bg-teal-50 rounded-lg border border-teal-200 text-teal-900">
                          <span className="font-bold block mb-0.5">Doctor's Advice to Patient:</span>
                          <span>{rec.clinical_notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Prescription Component */}
                    {rec.prescription && (
                      <div className="pt-2 border-t border-[#C2DFE3]">
                        <div className="text-xs font-bold text-[#253237] mb-1.5 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-800" />
                          <span>Prescription Formulation (Version {rec.prescription.version_number})</span>
                        </div>
                        <PrescriptionViewer prescription={rec.prescription} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Billing & Financial Overview (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#C2DFE3] pb-3">
              <CreditCard className="w-5 h-5 text-[#253237]" />
              <h3 className="font-black text-base text-[#253237]">Billing & Dues Overview</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[#C2DFE3]">
                <span className="text-[#5C6B73] font-medium">Total Billed:</span>
                <span className="font-black text-[#253237] text-sm">
                  PKR {Number(financials?.total_billed || 2500).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#C2DFE3]">
                <span className="text-[#5C6B73] font-medium">Total Paid:</span>
                <span className="font-black text-emerald-800 text-sm">
                  PKR {Number(financials?.total_paid || 2500).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 bg-slate-50 p-3 rounded-xl border border-[#C2DFE3]">
                <span className="font-bold text-[#253237]">Outstanding Dues:</span>
                <span className="font-black text-rose-700 text-sm">
                  PKR {Number(financials?.outstanding_balance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Appointment History List */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-black text-sm text-[#253237] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5C6B73]" /> Appointment History
              </h3>
              <span className="text-xs text-[#5C6B73]">{appointments.length} Records</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {appointments.length === 0 ? (
                <p className="text-xs text-[#5C6B73] text-center py-4">No appointment history.</p>
              ) : (
                appointments.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-[#C2DFE3] text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#253237]">{a.appointment_date}</div>
                      <div className="text-[11px] text-[#5C6B73]">{a.doctor_name} • {a.service_name}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5-STEP BOOKING MODAL (GENERIC ACCESS FOR ANY PATIENT)                     */}
      {/* ========================================================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#9DB4C0] max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header & Step Indicator */}
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div>
                <h3 className="font-black text-lg text-[#253237] flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Book Consultation Appointment
                </h3>
                <p className="text-xs text-[#5C6B73]">5-Step Verified Booking & Atomic Token Allocation</p>
              </div>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-[#5C6B73] hover:text-[#253237] cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="flex items-center justify-between text-xs font-bold text-[#5C6B73] px-2 flex-wrap gap-1">
              <span className={bookingStep >= 1 ? "text-[#253237]" : ""}>1. Doctor & Service</span>
              <span>→</span>
              <span className={bookingStep >= 2 ? "text-[#253237]" : ""}>2. Date</span>
              <span>→</span>
              <span className={bookingStep >= 3 ? "text-[#253237]" : ""}>3. Patient Info</span>
              <span>→</span>
              <span className={bookingStep >= 4 ? "text-[#253237]" : ""}>4. Review</span>
              <span>→</span>
              <span className={bookingStep >= 5 ? "text-[#253237]" : ""}>5. Confirmation</span>
            </div>

            {/* STEP 1: Select Doctor & View Specialist Bio + Doctor-Specific Services */}
            {bookingStep === 1 && (
              <div className="space-y-5 text-xs sm:text-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-black text-[#253237] text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#5C6B73]" />
                      <span>Step 1: Choose Specialist Doctor *</span>
                    </label>
                    <span className="text-[11px] text-[#5C6B73]">Select a doctor to view their specialized procedures</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {doctors.map(d => {
                      const isSelected = selectedDoctor?.id === d.id;
                      const expertiseTags = d.areas_of_expertise || (d.id === "doc-01" 
                        ? ["Severe Acne", "Fractional Laser", "Chemical Peels", "Acne Scars"]
                        : ["PRP Hair Restoration", "Alopecia", "HydraFacial", "Anti-Aging"]);

                      return (
                        <div
                          key={d.id}
                          onClick={() => handleSelectDoctorInBooking(d)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                            isSelected
                              ? "bg-[#E0FBFC] border-2 border-[#253237] shadow-md"
                              : "bg-white border-[#9DB4C0] hover:border-[#253237] hover:shadow-sm"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-[#253237] text-white flex items-center justify-center font-black text-sm shrink-0">
                                  {d.full_name?.split(" ")[1]?.[0] || "D"}
                                </div>
                                <div>
                                  <div className="font-black text-sm text-[#253237] flex items-center gap-1.5">
                                    <span>{d.full_name}</span>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                                  </div>
                                  <div className="text-xs font-bold text-teal-800">
                                    {d.specialization}
                                  </div>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded-full bg-white text-[#253237] text-[11px] font-black border border-[#9DB4C0] shrink-0">
                                PKR {d.consultation_fee?.toLocaleString()}
                              </span>
                            </div>

                            <p className="text-xs text-[#5C6B73] leading-relaxed line-clamp-2">
                              {d.biography || `${d.specialization} offering clinical assessments and aesthetic treatments.`}
                            </p>

                            <div className="text-[11px] text-[#5C6B73] font-semibold">
                              <span>🎓 {d.qualifications || "MBBS, Specialist Certification"}</span>
                              {d.experience_years && <span> • {d.experience_years}+ Yrs Exp</span>}
                            </div>

                            <div className="flex flex-wrap gap-1 pt-1">
                              {expertiseTags.map((tag, tIdx) => (
                                <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-[#253237] text-[10px] font-bold border border-slate-200">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#C2DFE3] flex items-center justify-between text-[11px] text-[#5C6B73]">
                            <span>🕒 {d.start_time || "09:00"} - {d.end_time || "17:00"}</span>
                            <span className="font-bold text-[#253237]">{isSelected ? "✓ Selected Doctor" : "Click to Select →"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Doctor-Specific Services Selection */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-[#9DB4C0] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <label className="font-black text-[#253237] text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#253237]" />
                        <span>Select Specialized Procedure for {selectedDoctor?.full_name} *</span>
                      </label>
                      <p className="text-xs text-[#5C6B73]">
                        Showing only treatments specialized & offered by <strong>{selectedDoctor?.full_name}</strong>
                      </p>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E0FBFC] text-[#253237] border border-[#9DB4C0] self-start sm:self-center">
                      {doctorServices.length} Specialized Procedures Available
                    </span>
                  </div>

                  {loadingServices ? (
                    <div className="py-6 text-center text-xs text-[#5C6B73]">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-[#253237]" />
                      Loading doctor procedures...
                    </div>
                  ) : doctorServices.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5C6B73]">
                      No specialized procedures found for this doctor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
                      {doctorServices.map(s => {
                        const isSelected = (selectedService?.id || doctorServices[0]?.id) === s.id;
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedService(s)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all text-xs flex flex-col justify-between space-y-2 ${
                              isSelected
                                ? "bg-[#E0FBFC] border-2 border-[#253237] shadow-sm font-semibold"
                                : "border-[#9DB4C0] hover:bg-white bg-white"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[#253237] font-bold leading-tight">{s.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-[#C2DFE3] text-[#253237] rounded font-bold shrink-0">
                                {s.category}
                              </span>
                            </div>

                            {s.description && (
                              <p className="text-[11px] text-[#5C6B73] line-clamp-2 leading-relaxed">
                                {s.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-[#C2DFE3] text-[11px]">
                              <span className="font-black text-[#253237]">PKR {s.base_price?.toLocaleString()}</span>
                              <span className="text-[#5C6B73]">{s.duration_minutes || 30} mins</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={() => setBookingStep(2)} className="btn-primary cursor-pointer">
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
                  
                  {/* Quick Date Chips */}
                  <div className="flex items-center gap-2 mb-2">
                    {[
                      { label: "Today", val: new Date().toISOString().split("T")[0] },
                      { label: "Tomorrow", val: new Date(Date.now() + 86400000).toISOString().split("T")[0] },
                      { label: "Day After", val: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0] },
                    ].map(d => (
                      <button
                        key={d.label}
                        type="button"
                        onClick={() => handleStepDateSelect(d.val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          selectedDate === d.val
                            ? "bg-[#253237] text-white border-[#253237] shadow-sm"
                            : "bg-slate-50 text-[#253237] border-[#9DB4C0] hover:bg-[#E0FBFC]"
                        }`}
                      >
                        {d.label} ({d.val})
                      </button>
                    ))}
                  </div>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleStepDateSelect(e.target.value)}
                    className="w-full clinical-input text-sm font-bold"
                  />
                </div>

                <div className="p-3 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs">
                  <div><strong>Selected Physician:</strong> {selectedDoctor?.full_name}</div>
                  <div><strong>Available Days:</strong> {(selectedDoctor?.available_days || []).join(", ")}</div>
                  <div><strong>Clinic Hours:</strong> {selectedDoctor?.start_time} - {selectedDoctor?.end_time}</div>
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setBookingStep(1)} className="btn-secondary cursor-pointer">Back</button>
                  <button onClick={() => setBookingStep(3)} className="btn-primary cursor-pointer">
                    Next: Patient Information <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Generic Patient Information (Anyone can book!) */}
            {bookingStep === 3 && (
              <div className="space-y-4 text-xs sm:text-sm animate-in fade-in">
                <div className="p-3.5 bg-[#E0FBFC] rounded-2xl border border-[#9DB4C0] flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-[#253237] shrink-0" />
                  <div>
                    <h4 className="font-bold text-[#253237] text-xs sm:text-sm">Patient Contact Details</h4>
                    <p className="text-[11px] text-[#5C6B73]">
                      Enter patient details below. Any new or registered patient can book without prior login.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ayesha Malik / Bilal Hassan"
                      value={bookingPatientForm.full_name}
                      onChange={(e) => setBookingPatientForm({ ...bookingPatientForm, full_name: e.target.value })}
                      className="w-full clinical-input font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Mobile / WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 1234567"
                      value={bookingPatientForm.phone}
                      onChange={(e) => setBookingPatientForm({ ...bookingPatientForm, phone: e.target.value })}
                      className="w-full clinical-input font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Gender</label>
                    <select
                      value={bookingPatientForm.gender}
                      onChange={(e) => setBookingPatientForm({ ...bookingPatientForm, gender: e.target.value })}
                      className="w-full clinical-input font-medium"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#253237] mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="patient@gmail.com"
                      value={bookingPatientForm.email}
                      onChange={(e) => setBookingPatientForm({ ...bookingPatientForm, email: e.target.value })}
                      className="w-full clinical-input font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Primary Symptoms / Reason for Visit</label>
                  <textarea
                    rows={2}
                    placeholder="Describe your skin, hair, or aesthetic concerns..."
                    value={bookingPatientForm.notes}
                    onChange={(e) => setBookingPatientForm({ ...bookingPatientForm, notes: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setBookingStep(2)} className="btn-secondary cursor-pointer">Back</button>
                  <button 
                    onClick={() => {
                      if (!bookingPatientForm.full_name.trim() || !bookingPatientForm.phone.trim()) {
                        setToast({ type: "error", text: "Please provide Patient Full Name and Mobile Number." });
                        return;
                      }
                      setBookingStep(4);
                    }} 
                    className="btn-primary cursor-pointer"
                  >
                    Next: Review Booking <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Review Booking Request */}
            {bookingStep === 4 && (
              <div className="space-y-4 text-xs sm:text-sm animate-in fade-in">
                <div className="p-4 bg-[#E0FBFC] rounded-2xl border border-[#9DB4C0] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#9DB4C0] pb-2">
                    <span className="font-black text-sm text-[#253237]">Appointment Summary</span>
                    <span className="text-xs font-black px-2.5 py-0.5 bg-[#253237] text-white rounded-full">
                      Patient: {bookingPatientForm.full_name || activePatient?.full_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div><strong>Patient Name:</strong> {bookingPatientForm.full_name || activePatient?.full_name}</div>
                    <div><strong>Patient Phone:</strong> {bookingPatientForm.phone || activePatient?.phone}</div>
                    <div><strong>Attending Doctor:</strong> {selectedDoctor?.full_name}</div>
                    <div><strong>Specialty:</strong> {selectedDoctor?.specialization}</div>
                    <div><strong>Appointment Date:</strong> {selectedDate}</div>
                    <div><strong>Procedure:</strong> {selectedService?.name}</div>
                    <div><strong>Base / Consultation Fee:</strong> PKR {Number(selectedService?.base_price || selectedDoctor?.consultation_fee || 2500).toLocaleString()}</div>
                    <div><strong>Live Slots:</strong> {tokenMetrics?.available_slots_remaining ?? 98} slots remaining</div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900">
                  <strong>Notice:</strong> Your appointment request will be placed into the Receptionist Review queue. A unique token sequence will be allocated atomically.
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setBookingStep(3)} className="btn-secondary cursor-pointer">Back</button>
                  <button onClick={handleSubmitBooking} className="btn-primary px-6 cursor-pointer shadow-md">
                    Confirm & Submit Booking Request
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
                    Your appointment request for <strong>{bookingPatientForm.full_name || activePatient?.full_name}</strong> has been submitted and is awaiting Receptionist approval.
                  </p>
                  <p className="text-xs text-[#5C6B73] mt-2">
                    Allocated Token Sequence: <strong>Token #{String(bookingResult.token_number).padStart(2, "0")}</strong> for {bookingResult.appointment_date}.
                  </p>
                </div>

                <button
                  onClick={() => setShowBookingModal(false)}
                  className="btn-primary px-6 py-2.5 text-sm cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PATIENT REGISTRATION MODAL                                                */}
      {/* ========================================================================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#9DB4C0] max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#E0FBFC] text-[#253237]">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-lg text-[#253237]">Register New Patient Profile</h3>
                  <p className="text-xs text-[#5C6B73]">Create a permanent clinic record for checkups and appointments</p>
                </div>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-[#5C6B73] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[#253237] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. M Dawood / Ayesha Malik"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  className="w-full clinical-input font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#253237] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+923001234567"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full clinical-input font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Gender *</label>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#253237]">CNIC *</label>
                    <button
                      type="button"
                      onClick={fillSampleCnic}
                      className="text-[10px] text-teal-800 font-bold hover:underline cursor-pointer"
                    >
                      Generate Sample
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="35202-1234567-1"
                    value={regForm.cnic}
                    onChange={(e) => setRegForm({ ...regForm, cnic: e.target.value })}
                    className="w-full clinical-input font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#253237] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regForm.dob}
                    onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                    className="w-full clinical-input font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@gmail.com"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full clinical-input font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-[#253237] mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Sector F-7/2, Islamabad"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full clinical-input font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-[#5C6B73] cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReg}
                  className="btn-primary px-5 py-2.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSubmittingReg ? "Registering..." : "Create Patient Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
