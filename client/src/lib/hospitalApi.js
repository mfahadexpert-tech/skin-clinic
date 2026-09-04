/**
 * Hospital Management & AI Agent System - API Client
 * Connects React / Next.js client to FastAPI backend endpoints.
 */

const API_BASE = "http://127.0.0.1:8000/api/hospital";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on [${config.method || "GET"} ${endpoint}]:`, error);
    throw error;
  }
}

export const hospitalApi = {
  // Auth
  login: (identifier, password) => request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  }),

  // Doctors & Services
  getDoctors: () => request("/doctors"),
  createDoctor: (doctorData) => request("/doctors", {
    method: "POST",
    body: JSON.stringify(doctorData),
  }),
  updateDoctor: (doctorId, doctorData) => request(`/doctors/${encodeURIComponent(doctorId)}`, {
    method: "PUT",
    body: JSON.stringify(doctorData),
  }),
  deleteDoctor: (doctorId) => request(`/doctors/${encodeURIComponent(doctorId)}`, {
    method: "DELETE",
  }),
  getServices: (doctorId) => request(doctorId ? `/services?doctor_id=${encodeURIComponent(doctorId)}` : "/services"),
  getDoctorServices: (doctorId) => request(`/doctors/${encodeURIComponent(doctorId)}/services`),
  addDoctorService: (doctorId, serviceData) => request(`/doctors/${encodeURIComponent(doctorId)}/services`, {
    method: "POST",
    body: JSON.stringify(serviceData),
  }),
  deleteDoctorService: (doctorId, serviceId) => request(`/doctors/${encodeURIComponent(doctorId)}/services/${encodeURIComponent(serviceId)}`, {
    method: "DELETE",
  }),
  createService: (serviceData) => request("/services", {
    method: "POST",
    body: JSON.stringify(serviceData),
  }),
  updateService: (serviceId, serviceData) => request(`/services/${encodeURIComponent(serviceId)}`, {
    method: "PUT",
    body: JSON.stringify(serviceData),
  }),
  deleteService: (serviceId) => request(`/services/${encodeURIComponent(serviceId)}`, {
    method: "DELETE",
  }),

  // Tokens & Queue
  getTokenMetrics: (doctorId, dateStr) => 
    request(`/tokens/metrics?doctor_id=${encodeURIComponent(doctorId)}${dateStr ? `&date_str=${encodeURIComponent(dateStr)}` : ""}`),
  getLiveQueue: (doctorId, dateStr) => 
    request(`/queue/live?${doctorId ? `doctor_id=${encodeURIComponent(doctorId)}&` : ""}${dateStr ? `date_str=${encodeURIComponent(dateStr)}` : ""}`),
  checkInPatient: (appointmentId) => request(`/queue/check-in?appointment_id=${encodeURIComponent(appointmentId)}`, { method: "POST" }),
  callNextPatient: (doctorId, dateStr) => 
    request(`/queue/call-next?doctor_id=${encodeURIComponent(doctorId)}${dateStr ? `&date_str=${encodeURIComponent(dateStr)}` : ""}`, { method: "POST" }),
  startConsultation: (queueId, doctorId) => 
    request(`/queue/start-consultation?queue_id=${encodeURIComponent(queueId)}&doctor_id=${encodeURIComponent(doctorId)}`, { method: "POST" }),

  // Appointments & Receptionist Approval
  getPendingBookingRequests: () => request("/appointments/pending"),
  getPatientAppointments: (patientId) => request(`/appointments/patient/${encodeURIComponent(patientId)}`),
  createBookingRequest: (bookingData) => request("/appointments/booking-request", {
    method: "POST",
    body: JSON.stringify(bookingData),
  }),
  processBookingApproval: (appointmentId, action, reason, receptionistId = "user-recep-01") => 
    request(`/appointments/${encodeURIComponent(appointmentId)}/approval?receptionist_id=${encodeURIComponent(receptionistId)}`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),
  cancelAppointment: (appointmentId, actorId, actorRole, reason) => 
    request(`/appointments/${encodeURIComponent(appointmentId)}/cancel?actor_id=${encodeURIComponent(actorId)}&actor_role=${encodeURIComponent(actorRole)}${reason ? `&reason=${encodeURIComponent(reason)}` : ""}`, {
      method: "POST",
    }),
  rescheduleAppointment: (appointmentId, rescheduleData, actorId, actorRole) => 
    request(`/appointments/${encodeURIComponent(appointmentId)}/reschedule?actor_id=${encodeURIComponent(actorId)}&actor_role=${encodeURIComponent(actorRole)}`, {
      method: "POST",
      body: JSON.stringify(rescheduleData),
    }),

  // Patients (Duplicate checks, Directory & Operational Data)
  listPatients: (limit = 100) => request(`/patients?limit=${limit}`),
  checkDuplicate: (cnic, phone, email) => {
    const params = new URLSearchParams();
    if (cnic) params.append("cnic", cnic);
    if (phone) params.append("phone", phone);
    if (email) params.append("email", email);
    return request(`/patients/check-duplicate?${params.toString()}`, { method: "POST" });
  },
  registerPatient: (patientData) => request("/patients/register", {
    method: "POST",
    body: JSON.stringify(patientData),
  }),
  updatePatient: (patientId, patientData) => request(`/patients/${encodeURIComponent(patientId)}`, {
    method: "PUT",
    body: JSON.stringify(patientData),
  }),
  deletePatient: (patientId) => request(`/patients/${encodeURIComponent(patientId)}`, {
    method: "DELETE",
  }),
  searchPatients: (query) => request(`/patients/search?query=${encodeURIComponent(query)}`),
  getPatientOperationalData: (patientId) => request(`/patients/${encodeURIComponent(patientId)}/operational`),

  // Clinical Records & Prescriptions
  getPatientClinicalRecords: (patientId, callerRole = "patient", callerId = "pat-01", doctorId = null) => {
    let url = `/clinical-records/patient/${encodeURIComponent(patientId)}?caller_role=${encodeURIComponent(callerRole)}&caller_id=${encodeURIComponent(callerId)}`;
    if (doctorId) url += `&doctor_id=${encodeURIComponent(doctorId)}`;
    return request(url);
  },
  createClinicalRecord: (recordData, doctorId = "doc-01", doctorUserId = "user-doc-01") => 
    request(`/clinical-records?doctor_id=${encodeURIComponent(doctorId)}&doctor_user_id=${encodeURIComponent(doctorUserId)}`, {
      method: "POST",
      body: JSON.stringify(recordData),
    }),
  updateClinicalRecord: (recordId, updateData, doctorId = "doc-01", doctorUserId = "user-doc-01") => 
    request(`/clinical-records/${encodeURIComponent(recordId)}?doctor_id=${encodeURIComponent(doctorId)}&doctor_user_id=${encodeURIComponent(doctorUserId)}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),
  correctPrescription: (prescriptionId, correctionData, doctorId = "doc-01", doctorUserId = "user-doc-01") => 
    request(`/prescriptions/${encodeURIComponent(prescriptionId)}/correction?doctor_id=${encodeURIComponent(doctorId)}&doctor_user_id=${encodeURIComponent(doctorUserId)}`, {
      method: "POST",
      body: JSON.stringify(correctionData),
    }),

  // Billing & Payments
  processPayment: (paymentData, actorId = "user-recep-01") => request(`/billing/pay?actor_id=${encodeURIComponent(actorId)}`, {
    method: "POST",
    body: JSON.stringify(paymentData),
  }),
  getPatientFinancialSummary: (patientId) => request(`/billing/summary/${encodeURIComponent(patientId)}`),

  // AI Agent Assistant
  sendAIChat: (message, conversationId = null, patientId = "pat-01", confirmedActionId = null) => 
    request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        patient_id: patientId,
        confirmed_action_id: confirmedActionId,
      }),
    }),

  // Admin Stats & Audit
  getAdminStats: () => request("/admin/stats"),
  getSystemAuditLogs: (limit = 50) => request(`/admin/audit-logs?limit=${limit}`),
};
