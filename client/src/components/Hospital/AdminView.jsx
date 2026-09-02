import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Activity, Users, Settings, Database, FileText, 
  RefreshCw, DollarSign, Layers, Plus, CheckCircle2, AlertTriangle, 
  Stethoscope, Clock, Edit2, Trash2, X, Check, Search, Calendar, Sparkles, UserPlus, Phone, Mail
} from "lucide-react";
import { hospitalApi } from "../../lib/hospitalApi";

const CLINICAL_CATEGORIES = [
  "Laser & Aesthetics",
  "Clinical Dermatology",
  "Medical Facial",
  "Trichology",
  "Injectables & Anti-Aging",
  "Skin Tightening",
  "Skin Rejuvenation",
  "Wellness & Glow",
  "Body Contouring"
];

const DEFAULT_PATIENTS = [
  { id: "pat-01", full_name: "Zainab Fatima", phone: "+923011112233", email: "zainab@gmail.com", gender: "female", dob: "1996-05-14", cnic: "35202-1234567-1", address: "F-7/2, Islamabad", emergency_contact: "+923011112200" },
  { id: "pat-02", full_name: "Bilal Hassan", phone: "+923022223344", email: "bilal@gmail.com", gender: "male", dob: "1991-11-20", cnic: "35202-7654321-2", address: "Gulberg III, Lahore", emergency_contact: "+923022223300" },
  { id: "pat-03", full_name: "Hamza Ali", phone: "+923033334455", email: "hamza@gmail.com", gender: "male", dob: "1998-02-10", cnic: "35202-9988776-3", address: "DHA Phase 5, Lahore", emergency_contact: "+923033334400" },
  { id: "pat-04", full_name: "Maryam Siddiqui", phone: "+923044445566", email: "maryam@gmail.com", gender: "female", dob: "1994-08-30", cnic: "35202-3344556-4", address: "Clifton Block 4, Karachi", emergency_contact: "+923044445500" },
  { id: "pat-05", full_name: "Usman Sheikh", phone: "+923055556677", email: "usman@gmail.com", gender: "male", dob: "1988-04-18", cnic: "35202-5566778-5", address: "Sector G-11/3, Islamabad", emergency_contact: "+923055556600" }
];

export default function AdminView() {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [patients, setPatients] = useState(DEFAULT_PATIENTS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, doctors, services, patients, audit
  const [toast, setToast] = useState(null);

  // Search & Filter States
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Modals
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showEditDoctorModal, setShowEditDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form States for Doctor
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    specialization: "",
    biography: "",
    qualifications: "",
    experience_years: 5,
    consultation_fee: 2500,
    follow_up_fee: 1500,
    daily_token_limit: 80,
    available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    start_time: "09:00",
    end_time: "17:00",
    service_ids: []
  });

  // Form States for Service
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "Laser & Aesthetics",
    description: "",
    base_price: 5000,
    duration_minutes: 30,
    is_active: true
  });

  // Form States for Patient
  const [patientForm, setPatientForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "female",
    dob: "1995-01-01",
    cnic: "",
    address: "",
    emergency_contact: "",
    whatsapp_available: true,
    primary_notification_channel: "whatsapp"
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, logsData, docList, srvList, patList] = await Promise.all([
        hospitalApi.getAdminStats(),
        hospitalApi.getSystemAuditLogs(50),
        hospitalApi.getDoctors(),
        hospitalApi.getServices(),
        hospitalApi.listPatients(100)
      ]);
      setStats(statsData);
      setAuditLogs(logsData || []);
      setDoctors(docList || []);
      setServices(srvList || []);
      if (patList && patList.length > 0) setPatients(patList);
    } catch (err) {
      console.error("Admin data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showNotification = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // DOCTOR ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddDoctor = () => {
    setDoctorForm({
      full_name: "",
      phone: "+923",
      email: "",
      specialization: "",
      biography: "",
      qualifications: "",
      experience_years: 5,
      consultation_fee: 2500,
      follow_up_fee: 1500,
      daily_token_limit: 80,
      available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      start_time: "09:00",
      end_time: "17:00",
      service_ids: services.map(s => s.id)
    });
    setShowAddDoctorModal(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setSelectedDoctor(doc);
    setDoctorForm({
      full_name: doc.full_name,
      phone: doc.phone || "",
      email: doc.email || "",
      specialization: doc.specialization || "",
      biography: doc.biography || "",
      qualifications: doc.qualifications || "",
      experience_years: doc.experience_years || 5,
      consultation_fee: doc.consultation_fee || 2500,
      follow_up_fee: doc.follow_up_fee || 1500,
      daily_token_limit: doc.daily_token_limit || 80,
      available_days: doc.available_days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      start_time: doc.start_time || "09:00",
      end_time: doc.end_time || "17:00",
      service_ids: (doc.services || []).map(s => s.id)
    });
    setShowEditDoctorModal(true);
  };

  const handleSaveNewDoctor = async (e) => {
    e.preventDefault();
    try {
      const created = await hospitalApi.createDoctor(doctorForm);
      showNotification("success", `Dr. ${doctorForm.full_name} registered successfully!`);
      setShowAddDoctorModal(false);
      setDoctors(prev => [created, ...prev]);
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to create doctor");
    }
  };

  const handleSaveEditDoctor = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      await hospitalApi.updateDoctor(selectedDoctor.id, doctorForm);
      showNotification("success", `Dr. ${doctorForm.full_name} updated!`);
      setShowEditDoctorModal(false);
      setDoctors(prev => prev.map(d => d.id === selectedDoctor.id ? { ...d, ...doctorForm } : d));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to update doctor");
    }
  };

  const handleDeleteDoctor = async (doc) => {
    if (!window.confirm(`Are you sure you want to deactivate Dr. ${doc.full_name}?`)) return;
    try {
      await hospitalApi.deleteDoctor(doc.id);
      showNotification("success", `Dr. ${doc.full_name} deactivated.`);
      setDoctors(prev => prev.filter(d => d.id !== doc.id));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to delete doctor");
    }
  };

  // -------------------------------------------------------------
  // SERVICE ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddService = () => {
    setServiceForm({
      name: "",
      category: "Laser & Aesthetics",
      description: "",
      base_price: 5000,
      duration_minutes: 30,
      is_active: true
    });
    setShowAddServiceModal(true);
  };

  const handleOpenEditService = (srv) => {
    setSelectedService(srv);
    setServiceForm({
      name: srv.name,
      category: srv.category,
      description: srv.description || "",
      base_price: srv.base_price,
      duration_minutes: srv.duration_minutes || 30,
      is_active: srv.is_active !== undefined ? srv.is_active : true
    });
    setShowEditServiceModal(true);
  };

  const handleSaveNewService = async (e) => {
    e.preventDefault();
    try {
      const created = await hospitalApi.createService(serviceForm);
      showNotification("success", `Treatment "${serviceForm.name}" added to catalog!`);
      setShowAddServiceModal(false);
      setServices(prev => [created, ...prev]);
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to add service");
    }
  };

  const handleSaveEditService = async (e) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await hospitalApi.updateService(selectedService.id, serviceForm);
      showNotification("success", `Treatment "${serviceForm.name}" updated!`);
      setShowEditServiceModal(false);
      setServices(prev => prev.map(s => s.id === selectedService.id ? { ...s, ...serviceForm } : s));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to update service");
    }
  };

  const handleDeleteService = async (srv) => {
    if (!window.confirm(`Are you sure you want to deactivate "${srv.name}"?`)) return;
    try {
      await hospitalApi.deleteService(srv.id);
      showNotification("success", `Treatment "${srv.name}" deactivated.`);
      setServices(prev => prev.filter(s => s.id !== srv.id));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to deactivate service");
    }
  };

  const handleToggleServiceStatus = async (srv) => {
    try {
      const nextStatus = !srv.is_active;
      await hospitalApi.updateService(srv.id, { is_active: nextStatus });
      showNotification("success", `Treatment "${srv.name}" marked as ${nextStatus ? "Active" : "Inactive"}`);
      setServices(prev => prev.map(s => s.id === srv.id ? { ...s, is_active: nextStatus } : s));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to toggle status");
    }
  };

  // -------------------------------------------------------------
  // PATIENT ACTIONS
  // -------------------------------------------------------------
  const handleOpenAddPatient = () => {
    setPatientForm({
      full_name: "",
      phone: "+923",
      email: "",
      gender: "female",
      dob: "1995-01-01",
      cnic: "35202-",
      address: "",
      emergency_contact: "",
      whatsapp_available: true,
      primary_notification_channel: "whatsapp"
    });
    setShowAddPatientModal(true);
  };

  const handleOpenEditPatient = (pat) => {
    setSelectedPatient(pat);
    setPatientForm({
      full_name: pat.full_name,
      phone: pat.phone,
      email: pat.email || "",
      gender: pat.gender || "female",
      dob: pat.dob || "1995-01-01",
      cnic: pat.cnic || "",
      address: pat.address || "",
      emergency_contact: pat.emergency_contact || "",
      whatsapp_available: pat.whatsapp_available !== undefined ? pat.whatsapp_available : true,
      primary_notification_channel: "whatsapp"
    });
    setShowEditPatientModal(true);
  };

  const handleSaveNewPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await hospitalApi.registerPatient(patientForm);
      showNotification("success", `Patient ${patientForm.full_name} registered successfully!`);
      setShowAddPatientModal(false);
      if (res && res.patient) {
        setPatients(prev => [res.patient, ...prev]);
      }
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to register patient");
    }
  };

  const handleSaveEditPatient = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await hospitalApi.updatePatient(selectedPatient.id, patientForm);
      showNotification("success", `Patient ${patientForm.full_name} updated!`);
      setShowEditPatientModal(false);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, ...patientForm } : p));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to update patient");
    }
  };

  const handleDeletePatient = async (pat) => {
    if (!window.confirm(`Are you sure you want to remove patient ${pat.full_name}?`)) return;
    try {
      await hospitalApi.deletePatient(pat.id);
      showNotification("success", `Patient ${pat.full_name} removed.`);
      setPatients(prev => prev.filter(p => p.id !== pat.id));
      loadAdminData();
    } catch (err) {
      showNotification("error", err.message || "Failed to delete patient");
    }
  };

  // Filtered Services
  const filteredServices = services.filter(s => {
    const matchesQuery = s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
                         (s.description || "").toLowerCase().includes(serviceSearch.toLowerCase());
    const matchesCategory = serviceCategoryFilter === "all" || s.category === serviceCategoryFilter;
    return matchesQuery && matchesCategory;
  });

  // Filtered Patients
  const filteredPatients = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || 
           (p.phone || "").toLowerCase().includes(q) ||
           (p.cnic || "").toLowerCase().includes(q) ||
           (p.id || "").toLowerCase().includes(q);
  });

  // Filtered Audit Logs
  const filteredLogs = auditLogs.filter(log => {
    const q = auditSearch.toLowerCase();
    return log.action.toLowerCase().includes(q) || 
           log.resource_type.toLowerCase().includes(q) ||
           log.actor_type.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
          toast.type === "error" ? "bg-red-900 text-white border border-red-700" : "bg-[#253237] text-[#E0FBFC] border border-[#5C6B73]"
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === "error" ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#9DB4C0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#253237] text-[#E0FBFC]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#253237]">Hospital Administration</h1>
            <p className="text-xs sm:text-sm text-[#5C6B73]">Doctors, Aesthetic Services, Patients Directory & System Audit Trail</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#C2DFE3]/50 p-1.5 rounded-xl border border-[#9DB4C0] text-xs flex-wrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "overview" ? "bg-[#253237] text-white shadow-sm" : "text-[#5C6B73] hover:text-[#253237]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "doctors" ? "bg-[#253237] text-white shadow-sm" : "text-[#5C6B73] hover:text-[#253237]"
            }`}
          >
            Doctors ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "services" ? "bg-[#253237] text-white shadow-sm" : "text-[#5C6B73] hover:text-[#253237]"
            }`}
          >
            Services Catalog ({services.length})
          </button>
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "patients" ? "bg-[#253237] text-white shadow-sm" : "text-[#5C6B73] hover:text-[#253237]"
            }`}
          >
            Patients Directory ({patients.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "audit" ? "bg-[#253237] text-white shadow-sm" : "text-[#5C6B73] hover:text-[#253237]"
            }`}
          >
            System Audit Trail
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Quick Actions Bar */}
          <div className="bg-[#E0FBFC] p-4 rounded-2xl border border-[#9DB4C0] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#253237]" />
              <span className="font-bold text-sm text-[#253237]">Quick Admin Actions:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenAddDoctor}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Doctor
              </button>
              <button
                onClick={handleOpenAddService}
                className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Treatment
              </button>
              <button
                onClick={handleOpenAddPatient}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#253237] rounded-xl border border-[#9DB4C0] text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Add Patient
              </button>
              <button
                onClick={loadAdminData}
                className="px-3 py-2 bg-[#253237] hover:bg-[#1a2327] text-[#E0FBFC] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#9DB4C0] shadow-sm">
              <div className="text-xs uppercase font-bold text-[#5C6B73]">Registered Patients</div>
              <div className="text-3xl font-black text-[#253237] mt-1">{patients.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#9DB4C0] shadow-sm">
              <div className="text-xs uppercase font-bold text-[#5C6B73]">Active Physicians</div>
              <div className="text-3xl font-black text-[#253237] mt-1">{doctors.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#9DB4C0] shadow-sm">
              <div className="text-xs uppercase font-bold text-[#5C6B73]">Aesthetic Treatments</div>
              <div className="text-3xl font-black text-[#253237] mt-1">{services.length}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#9DB4C0] shadow-sm">
              <div className="text-xs uppercase font-bold text-[#5C6B73]">Today's Tokens</div>
              <div className="text-3xl font-black text-[#253237] mt-1">{stats?.today_tokens_issued || 0}</div>
            </div>
          </div>

          {/* Doctors Overview Quick Card */}
          <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#253237]">Active Doctors & Workload Caps</h3>
                <p className="text-xs text-[#5C6B73]">Configure physician daily token capacity and fees</p>
              </div>
              <button onClick={() => setActiveTab("doctors")} className="text-xs font-bold text-[#253237] hover:underline">
                Manage All Doctors →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(d => (
                <div key={d.id} className="p-4 rounded-xl border border-[#9DB4C0] bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-[#253237]">{d.full_name}</h4>
                      <p className="text-[#5C6B73]">{d.specialization}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded">
                      Active
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#C2DFE3]">
                    <div><strong>Daily Token Cap:</strong> <span className="font-bold text-[#253237]">{d.daily_token_limit} slots</span></div>
                    <div><strong>Consultation Fee:</strong> PKR {d.consultation_fee?.toLocaleString()}</div>
                    <div><strong>Follow-up Fee:</strong> PKR {d.follow_up_fee?.toLocaleString()}</div>
                    <div><strong>Hours:</strong> {d.start_time} - {d.end_time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTORS & LIMITS */}
      {activeTab === "doctors" && (
        <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C2DFE3] pb-4">
            <div>
              <h3 className="font-bold text-lg text-[#253237]">Doctor Configuration & Token Allocation Limits</h3>
              <p className="text-xs text-[#5C6B73]">Add new doctors, set token allocation limits, and adjust fees</p>
            </div>
            <button
              onClick={handleOpenAddDoctor}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Doctor
            </button>
          </div>

          <div className="divide-y divide-[#C2DFE3]">
            {doctors.map(d => (
              <div key={d.id} className="py-4 space-y-3 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#253237] text-base">{d.full_name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                        Active Physician
                      </span>
                    </div>
                    <p className="text-xs text-[#5C6B73] mt-0.5">
                      {d.qualifications} • {d.specialization} • {d.experience_years} years experience
                    </p>
                    <p className="text-xs text-[#5C6B73]">
                      Phone: <strong>{d.phone}</strong> • Email: <strong>{d.email}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1.5 bg-[#E0FBFC] rounded-xl border border-[#9DB4C0] text-xs font-black text-[#253237]">
                      Cap: {d.daily_token_limit} Patients/Day
                    </span>
                    <button
                      onClick={() => handleOpenEditDoctor(d)}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile & Limit
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(d)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#5C6B73] leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-[#C2DFE3]">
                  {d.biography || "No biography provided."}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div><strong>Consultation Fee:</strong> PKR {d.consultation_fee?.toLocaleString()}</div>
                  <div><strong>Follow-up Fee:</strong> PKR {d.follow_up_fee?.toLocaleString()}</div>
                  <div><strong>Working Days:</strong> {(d.available_days || []).join(", ") || "Mon-Fri"}</div>
                  <div><strong>Consultation Hours:</strong> {d.start_time} - {d.end_time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES CATALOG */}
      {activeTab === "services" && (
        <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C2DFE3] pb-4">
            <div>
              <h3 className="font-bold text-lg text-[#253237]">Clinical Treatments & Pricing Master</h3>
              <p className="text-xs text-[#5C6B73]">Manage aesthetic treatments, pricing, duration, and clinical descriptions</p>
            </div>
            <button
              onClick={handleOpenAddService}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add New Treatment / Service
            </button>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#5C6B73] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search treatment by name or protocol..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full pl-9 clinical-input text-xs"
              />
            </div>
            <select
              value={serviceCategoryFilter}
              onChange={(e) => setServiceCategoryFilter(e.target.value)}
              className="clinical-input text-xs w-full sm:w-auto font-semibold"
            >
              <option value="all">All Categories ({services.length})</option>
              {CLINICAL_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map(s => (
              <div 
                key={s.id} 
                className={`p-4 rounded-xl border transition-all text-xs space-y-3 flex flex-col justify-between ${
                  s.is_active ? "bg-white border-[#9DB4C0] shadow-sm" : "bg-slate-100 border-slate-300 opacity-60"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-extrabold text-sm text-[#253237]">{s.name}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 bg-[#C2DFE3] text-[#253237] font-bold text-[10px] rounded">
                          {s.category}
                        </span>
                        <span className="text-[11px] text-[#5C6B73] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {s.duration_minutes} mins
                        </span>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#253237] bg-[#E0FBFC] px-2.5 py-1 rounded-lg border border-[#9DB4C0] text-xs">
                      PKR {s.base_price?.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[#5C6B73] mt-2 leading-relaxed">
                    {s.description || "No description provided."}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#C2DFE3] flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${s.is_active ? "text-emerald-700" : "text-slate-500"}`}>
                    ● {s.is_active ? "Active in Booking" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditService(s)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#253237] font-bold rounded-lg border border-[#9DB4C0] text-[11px] flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleServiceStatus(s)}
                      className={`px-2.5 py-1 font-bold rounded-lg border text-[11px] ${
                        s.is_active 
                          ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100" 
                          : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      {s.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteService(s)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PATIENTS DIRECTORY */}
      {activeTab === "patients" && (
        <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C2DFE3] pb-4">
            <div>
              <h3 className="font-bold text-lg text-[#253237]">Registered Patients Directory</h3>
              <p className="text-xs text-[#5C6B73]">Manage patient registrations, contact profiles, and emergency records</p>
            </div>
            <button
              onClick={handleOpenAddPatient}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" /> Add New Patient
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#5C6B73] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patients by Name, Phone, CNIC, or ID..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-9 clinical-input text-xs"
            />
          </div>

          {/* Patients Table */}
          <div className="border border-[#9DB4C0] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#253237] text-white">
                <tr>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Phone & Email</th>
                  <th className="p-3">CNIC</th>
                  <th className="p-3">Gender / DOB</th>
                  <th className="p-3">Address & Emergency</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C2DFE3]">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#253237]">{p.full_name}</div>
                      <div className="text-[10px] text-[#5C6B73]">ID: {p.id}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-[#253237]">{p.phone}</div>
                      <div className="text-[#5C6B73]">{p.email || "No email"}</div>
                    </td>
                    <td className="p-3 font-mono text-[#253237] font-semibold">{p.cnic || "N/A"}</td>
                    <td className="p-3">
                      <span className="capitalize">{p.gender}</span> • {p.dob}
                    </td>
                    <td className="p-3">
                      <div>{p.address || "N/A"}</div>
                      <div className="text-[10px] text-[#5C6B73]">Emerg: {p.emergency_contact || "N/A"}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditPatient(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#253237] rounded border border-[#9DB4C0]"
                          title="Edit Patient"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePatient(p)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                          title="Remove Patient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="bg-white rounded-2xl border border-[#9DB4C0] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C2DFE3] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#5C6B73]" />
              <div>
                <h3 className="font-bold text-base text-[#253237]">Append-Only System Audit History</h3>
                <p className="text-xs text-[#5C6B73]">Immutable governance log recording every operational, admin, and clinical action</p>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#5C6B73] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter logs by action / actor..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 clinical-input text-xs"
              />
            </div>
          </div>

          <div className="border border-[#9DB4C0] rounded-xl overflow-hidden divide-y divide-[#C2DFE3] max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 text-xs space-y-1 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between font-semibold text-[#253237]">
                  <span className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#253237] text-white text-[10px] uppercase font-bold rounded">
                      {log.actor_type}
                    </span>
                    <span>Action: {log.action.replace("_", " ")}</span>
                  </span>
                  <span className="text-[#5C6B73] font-normal">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="text-[#5C6B73]">
                  Target Resource: <strong className="text-[#253237]">{log.resource_type}</strong> (ID: {log.resource_id})
                </div>
                {log.metadata && (
                  <pre className="bg-[#E0FBFC] p-2 rounded text-[11px] font-mono text-[#253237] overflow-x-auto mt-1 border border-[#9DB4C0]">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: ADD DOCTOR */}
      {/* ============================================================= */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Add New Doctor Profile</h3>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleSaveNewDoctor} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                    placeholder="e.g. Dr. Fatima Zahra"
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    placeholder="+923001234567"
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Email</label>
                  <input
                    type="email"
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="dr.fatima@hospital.com"
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    placeholder="e.g. Consultant Dermatologist & Aesthetic Surgeon"
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Daily Token Limit *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="300"
                    value={doctorForm.daily_token_limit}
                    onChange={(e) => setDoctorForm({ ...doctorForm, daily_token_limit: parseInt(e.target.value) || 50 })}
                    className="w-full clinical-input font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Consultation Fee (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: parseFloat(e.target.value) || 2000 })}
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Follow-up Fee (PKR)</label>
                  <input
                    type="number"
                    value={doctorForm.follow_up_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, follow_up_fee: parseFloat(e.target.value) || 1000 })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Qualifications</label>
                <input
                  type="text"
                  value={doctorForm.qualifications}
                  onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                  placeholder="e.g. MBBS, FCPS (Dermatology), Fellow Aesthetic Medicine"
                  className="w-full clinical-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Clinical Biography & Notes</label>
                <textarea
                  rows={2}
                  value={doctorForm.biography}
                  onChange={(e) => setDoctorForm({ ...doctorForm, biography: e.target.value })}
                  placeholder="Detailed background in aesthetic lasers and clinical dermatology..."
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: EDIT DOCTOR */}
      {/* ============================================================= */}
      {showEditDoctorModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Edit Doctor & Daily Token Limit</h3>
              <button onClick={() => setShowEditDoctorModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleSaveEditDoctor} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.full_name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, full_name: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#E0FBFC] p-2.5 rounded-xl border border-[#9DB4C0]">
                  <label className="block text-xs font-bold text-[#253237] mb-1">Daily Token Cap *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="300"
                    value={doctorForm.daily_token_limit}
                    onChange={(e) => setDoctorForm({ ...doctorForm, daily_token_limit: parseInt(e.target.value) || 50 })}
                    className="w-full clinical-input font-black text-base text-[#253237]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Consultation Fee (PKR)</label>
                  <input
                    type="number"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: parseFloat(e.target.value) || 2000 })}
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Follow-up Fee (PKR)</label>
                  <input
                    type="number"
                    value={doctorForm.follow_up_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, follow_up_fee: parseFloat(e.target.value) || 1000 })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Qualifications</label>
                <input
                  type="text"
                  value={doctorForm.qualifications}
                  onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Biography</label>
                <textarea
                  rows={2}
                  value={doctorForm.biography}
                  onChange={(e) => setDoctorForm({ ...doctorForm, biography: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowEditDoctorModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Update Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: ADD SERVICE / TREATMENT */}
      {/* ============================================================= */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Add Aesthetic Treatment / Service</h3>
              <button onClick={() => setShowAddServiceModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleSaveNewService} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Treatment Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Q-Switched Nd:YAG Carbon Laser Peel"
                  className="w-full clinical-input font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Category *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full clinical-input font-semibold"
                  >
                    {CLINICAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Duration (Minutes) *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="180"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Base Price (PKR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseFloat(e.target.value) || 0 })}
                  className="w-full clinical-input font-bold text-base text-[#253237]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Clinical Description / Protocol</label>
                <textarea
                  rows={3}
                  required
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Describe indications, treatment steps, and expected results..."
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Add Treatment to Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: EDIT SERVICE */}
      {/* ============================================================= */}
      {showEditServiceModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Edit Treatment & Pricing</h3>
              <button onClick={() => setShowEditServiceModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleSaveEditService} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Treatment Name *</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full clinical-input font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Category *</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full clinical-input font-semibold"
                  >
                    {CLINICAL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Base Price (PKR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseFloat(e.target.value) || 0 })}
                  className="w-full clinical-input font-bold text-base text-[#253237]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#253237] mb-1">Clinical Protocol</label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full clinical-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowEditServiceModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 5: ADD PATIENT */}
      {/* ============================================================= */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Register New Patient</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleSaveNewPatient} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.full_name}
                    onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                    placeholder="e.g. Zainab Fatima"
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Phone Number (Mandatory) *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    placeholder="+923011112233"
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">CNIC (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.cnic}
                    onChange={(e) => setPatientForm({ ...patientForm, cnic: e.target.value })}
                    placeholder="35202-1234567-1"
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Email</label>
                  <input
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    placeholder="patient@gmail.com"
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Gender *</label>
                  <select
                    value={patientForm.gender}
                    onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                    className="w-full clinical-input font-medium"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={patientForm.dob}
                    onChange={(e) => setPatientForm({ ...patientForm, dob: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.address}
                    onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                    placeholder="Residential address"
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Emergency Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.emergency_contact}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact: e.target.value })}
                    placeholder="+923011112200"
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 6: EDIT PATIENT */}
      {/* ============================================================= */}
      {showEditPatientModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#253237]/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#9DB4C0] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-[#C2DFE3] pb-3">
              <h3 className="font-bold text-lg text-[#253237]">Edit Patient Record</h3>
              <button onClick={() => setShowEditPatientModal(false)} className="text-[#5C6B73]">✕</button>
            </div>

            <form onSubmit={handleSaveEditPatient} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.full_name}
                    onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">CNIC</label>
                  <input
                    type="text"
                    value={patientForm.cnic}
                    onChange={(e) => setPatientForm({ ...patientForm, cnic: e.target.value })}
                    className="w-full clinical-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Email</label>
                  <input
                    type="email"
                    value={patientForm.email}
                    onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Address</label>
                  <input
                    type="text"
                    value={patientForm.address}
                    onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#253237] mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={patientForm.emergency_contact}
                    onChange={(e) => setPatientForm({ ...patientForm, emergency_contact: e.target.value })}
                    className="w-full clinical-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#C2DFE3]">
                <button
                  type="button"
                  onClick={() => setShowEditPatientModal(false)}
                  className="px-4 py-2 text-[#5C6B73] hover:bg-[#C2DFE3] rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-6">
                  Update Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
