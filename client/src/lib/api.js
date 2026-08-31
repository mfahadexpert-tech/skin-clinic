/**
 * ==============================================================================
 * SkinLab AI - Frontend API & Streaming Client
 * ==============================================================================
 * Communicates with the FastAPI backend on port 8000.
 * Includes methods for POS, PRM, AI Streaming, Voice Agent, Calendar, and Backups.
 * ==============================================================================
 */

const API_BASE = "http://127.0.0.1:8000/api";

export const api = {
  // 1. Health Check
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch (e) {
      console.warn("[API] Backend offline or unavailable:", e);
      return { status: "offline" };
    }
  },

  // 2. POS Billing Terminal
  async getPOSOverview() {
    const res = await fetch(`${API_BASE}/pos/overview`);
    return await res.json();
  },

  async createSale(saleData) {
    const res = await fetch(`${API_BASE}/pos/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });
    return await res.json();
  },

  async splitCheckout(splitData) {
    const res = await fetch(`${API_BASE}/pos/split-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(splitData),
    });
    return await res.json();
  },

  async loadSale(invoiceNumber) {
    const res = await fetch(`${API_BASE}/pos/sale/${invoiceNumber}`);
    return await res.json();
  },

  // 3. Patient PRM & Multi-Session Tracking
  async listPatients(search = "") {
    const url = search ? `${API_BASE}/patients/?search=${encodeURIComponent(search)}` : `${API_BASE}/patients/`;
    const res = await fetch(url);
    return await res.json();
  },

  async getPatientDetails(patientId) {
    const res = await fetch(`${API_BASE}/patients/${patientId}`);
    return await res.json();
  },

  async registerPatient(patientData) {
    const res = await fetch(`${API_BASE}/patients/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientData),
    });
    return await res.json();
  },

  async redeemSession(redeemData) {
    const res = await fetch(`${API_BASE}/patients/redeem-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(redeemData),
    });
    return await res.json();
  },

  // 4. LangGraph AI Doctor Assistant (SSE Streaming)
  async streamAIChat(query, patientId, onChunk, onDone) {
    try {
      const response = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, patient_id: patientId, language: "auto" }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // Keep last incomplete chunk

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.replace("data: ", ""));
            if (data.token) onChunk(data.token);
            if (data.done && onDone) onDone(data);
          }
        }
      }
    } catch (err) {
      console.error("[AI Stream] Error:", err);
      onChunk("\n⚠️ Error communicating with AI Doctor Assistant. Please ensure Python backend is running.");
      if (onDone) onDone({ done: true });
    }
  },

  // 5. AI Voice Booking Agent Simulator & Reception Calendar
  async simulateVoiceCall(callData) {
    const res = await fetch(`${API_BASE}/voice/simulate-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(callData),
    });
    return await res.json();
  },

  async getCalendarSchedule() {
    const res = await fetch(`${API_BASE}/voice/appointments`);
    return await res.json();
  },

  async createAppointment(apptData) {
    const res = await fetch(`${API_BASE}/voice/appointments/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apptData),
    });
    return await res.json();
  },

  async updateAppointment(id, apptData) {
    const res = await fetch(`${API_BASE}/voice/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apptData),
    });
    return await res.json();
  },

  async deleteAppointment(id) {
    const res = await fetch(`${API_BASE}/voice/appointments/${id}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  // 6. Multi-Channel WhatsApp Hub
  async getWhatsAppLogs() {
    const res = await fetch(`${API_BASE}/whatsapp/logs`);
    return await res.json();
  },

  async sendWhatsAppMessage(data) {
    const res = await fetch(`${API_BASE}/whatsapp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  // 7. Reports & Analytics
  async getDashboardKPIs() {
    const res = await fetch(`${API_BASE}/reports/dashboard-kpi`);
    return await res.json();
  },

  async getMachineROI() {
    const res = await fetch(`${API_BASE}/reports/machine-roi`);
    return await res.json();
  },

  async getSalesBook() {
    const res = await fetch(`${API_BASE}/reports/sales-book`);
    return await res.json();
  },

  // 8. Catalog, Barcodes & SRM
  async getServicesCatalog() {
    const res = await fetch(`${API_BASE}/catalog/services`);
    return await res.json();
  },

  async getBarcodeLabel(productId) {
    const res = await fetch(`${API_BASE}/catalog/barcode/${productId}`);
    return await res.json();
  },

  async getSuppliers() {
    const res = await fetch(`${API_BASE}/purchases/suppliers`);
    return await res.json();
  },

  async processRefund(refundData) {
    const res = await fetch(`${API_BASE}/purchases/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refundData),
    });
    return await res.json();
  },

  // 9. HRM Staff & Payroll
  async getStaff() {
    const res = await fetch(`${API_BASE}/hrm/staff`);
    return await res.json();
  },

  // 10. Settings & SQL Database Backup
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings/`);
    return await res.json();
  },

  async exportSQLBackup() {
    const res = await fetch(`${API_BASE}/settings/backup/export`, { method: "POST" });
    return await res.json();
  }
};
