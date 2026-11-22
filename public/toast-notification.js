/**
 * CareConnect360 - Modern Floating Toast & Notification Dispatch System
 * Project ID: P_013 | Telemedicine Platform
 */

(function () {
  // Ensure Toast Container exists in DOM
  function getOrCreateToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      document.body.appendChild(container);
    }
    return container;
  }

  const TOAST_ICONS = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    warning: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };

  const TOAST_TITLES = {
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Notice"
  };

  /**
   * Display floating healthcare toast notification
   * @param {string} message 
   * @param {'success'|'error'|'info'|'warning'} type 
   * @param {string} [title] 
   * @param {number} [duration=4500] 
   */
  window.showToast = function (message, type = "info", title = "", duration = 4500) {
    const container = getOrCreateToastContainer();
    const finalTitle = title || TOAST_TITLES[type] || "CareConnect360";
    const iconClass = TOAST_ICONS[type] || "fa-bell";

    const toast = document.createElement("div");
    toast.className = `care-toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon-wrap">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="toast-content-wrap">
        <div class="toast-title">${finalTitle}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close-btn" aria-label="Close">&times;</button>
      <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
    `;

    const closeBtn = toast.querySelector(".toast-close-btn");
    const removeToast = () => {
      toast.classList.add("toast-hiding");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    closeBtn.addEventListener("click", removeToast);
    const timer = setTimeout(removeToast, duration);

    toast.addEventListener("mouseenter", () => clearTimeout(timer));
    toast.addEventListener("mouseleave", () => setTimeout(removeToast, 2000));

    container.appendChild(toast);
  };

  // Gracefully enhance window.alert so any unexpected call uses toast
  const originalAlert = window.alert;
  window.alert = function (msg) {
    if (!msg) return;
    const text = String(msg);
    if (text.toLowerCase().includes("failed") || text.toLowerCase().includes("error") || text.toLowerCase().includes("invalid")) {
      window.showToast(text, "error", "Operation Failed");
    } else if (text.toLowerCase().includes("success") || text.toLowerCase().includes("confirmed") || text.toLowerCase().includes("welcome")) {
      window.showToast(text, "success", "Confirmation");
    } else {
      window.showToast(text, "info", "CareConnect360");
    }
  };

  /**
   * Display simulated SMS & Email dispatch modal when appointment is booked
   */
  window.showDispatchModal = function (appt) {
    const existing = document.getElementById("dispatchModalRoot");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "dispatchModalRoot";
    root.className = "dispatch-modal-backdrop";

    const dateStr = appt.appointmentDate || appt.date || "Today";
    const timeStr = appt.slotTime || appt.slot || "Scheduled Hour";
    const doctorName = appt.doctorName || "Dr. Specialist";
    const patientName = appt.patientName || "Patient";
    const phone = appt.patientPhone || "+91 98765 43210";
    const roomId = appt.videoRoomId || `room_${Date.now()}`;
    const joinUrl = `${window.location.origin}/consultation.html?room=${roomId}&role=patient&doctor=${encodeURIComponent(doctorName)}`;

    root.innerHTML = `
      <div class="dispatch-modal-card">
        <div class="dispatch-modal-header">
          <h3><i class="fas fa-paper-plane"></i> Automated Alerts Dispatched</h3>
          <button class="toast-close-btn" style="color:#ffffff; font-size:20px;" onclick="document.getElementById('dispatchModalRoot').remove()">&times;</button>
        </div>
        <div class="dispatch-modal-body">
          <div class="dispatch-sms-box">
            <span class="dispatch-pill-badge"><i class="fas fa-comment-sms"></i> Instant SMS Dispatched</span>
            <div style="font-size:12px; color:#64748b; margin-bottom:6px;">Delivered to: <strong>${phone}</strong> via CareConnect Gateway</div>
            <div class="dispatch-sms-bubble">
              "Dear ${patientName}, your virtual consultation with ${doctorName} is confirmed for ${dateStr} at ${timeStr}. Join call securely via encrypted room: ${joinUrl}"
            </div>
          </div>

          <div class="dispatch-email-box">
            <span class="dispatch-pill-badge"><i class="fas fa-envelope"></i> Clinical Email Confirmation</span>
            <div style="font-size:12px; color:#64748b; margin-bottom:6px;">Sent to Patient Mailbox & Medical Records</div>
            <div class="dispatch-email-content">
              <strong>Subject:</strong> Confirmed: Virtual Consultation with ${doctorName}<br><br>
              <strong>Patient Name:</strong> ${patientName}<br>
              <strong>Date & Time:</strong> ${dateStr} | ${timeStr}<br>
              <strong>Consultation Fee:</strong> Rs. ${appt.amount || 500} (Paid via Razorpay &bull; Tax Invoice Attached)<br>
              <strong>Clinical Room Access:</strong> Encrypted WebRTC Session (No App Required)<br>
              <p style="margin-top:10px; font-size:12px; color:#64748b;">
                <i class="fas fa-shield-halved"></i> Note: Please join 5 minutes early with your medical history and previous test reports.
              </p>
            </div>
          </div>
        </div>
        <div class="dispatch-modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('dispatchModalRoot').remove()" style="padding:8px 16px; border-radius:8px;">Dismiss</button>
          <a href="${joinUrl}" class="btn btn-primary" style="padding:8px 18px; border-radius:8px; display:inline-flex; align-items:center; gap:8px;">
            <i class="fas fa-video"></i> Enter Call Room Now
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(root);
  };
})();
