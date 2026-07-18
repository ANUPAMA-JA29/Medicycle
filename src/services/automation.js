// MediCycle AI - Automation Workflow Service Layer
// Bridges Database Operations with Trigger Actions & Messaging Engines
import emailjs from '@emailjs/browser';

const KEY_WORKFLOWS = "medicycle_workflows";
const KEY_LOGS = "medicycle_automation_logs";
const KEY_SENT_MAILS = "medicycle_sent_emails";
const KEY_NOTIFICATIONS = "medicycle_notifications";

// Helper: Calculate days remaining until expiry
const getDaysRemaining = (expiryDateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Default Workflows Seed
const DEFAULT_WORKFLOWS = [
  {
    id: "wj-expiry",
    name: "Expiry Monitor Warning",
    description: "Triggers when a medication has <= 7 days left on shelf. Sends email alert to user and registers dashboard alert.",
    trigger: "Daily Schedule Sync",
    condition: "Days to Expiry <= 7 days",
    actionType: "both", // email + notification
    isActive: true
  },
  {
    id: "wj-donation",
    name: "Donation Listing Confirmation",
    description: "Triggers automatically when a medicine is flagged 'Available for Donation'. Emails receipt back to donor.",
    trigger: "Medicine Donation Flag Added",
    condition: "availableForDonation === true",
    actionType: "both",
    isActive: true
  },
  {
    id: "wj-add",
    name: "New Medicine Inventory Tracker",
    description: "Triggers on medicine record creation. Populates feed and logs validation verification statistics.",
    trigger: "Medicine Registered",
    condition: "Always run",
    actionType: "system", // notification only
    isActive: true
  }
];

// Initialize database storage collections
export const initAutomationDB = () => {
  if (!localStorage.getItem(KEY_WORKFLOWS)) {
    localStorage.setItem(KEY_WORKFLOWS, JSON.stringify(DEFAULT_WORKFLOWS));
  }
  if (!localStorage.getItem(KEY_LOGS)) {
    localStorage.setItem(KEY_LOGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEY_SENT_MAILS)) {
    localStorage.setItem(KEY_SENT_MAILS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEY_NOTIFICATIONS)) {
    localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify([]));
  }
};

// Ensure database setup is ready
initAutomationDB();

// ==========================================
// API GETTERS / CRUD
// ==========================================

export const getWorkflows = () => {
  initAutomationDB();
  return JSON.parse(localStorage.getItem(KEY_WORKFLOWS));
};

export const updateWorkflowStatus = (id, isActive) => {
  initAutomationDB();
  const workflows = getWorkflows();
  const index = workflows.findIndex(w => w.id === id);
  if (index !== -1) {
    workflows[index].isActive = isActive;
    localStorage.setItem(KEY_WORKFLOWS, JSON.stringify(workflows));
    addLog(
      id,
      `Workflow '${workflows[index].name}' status changed to ${isActive ? "ACTIVE" : "INACTIVE"}.`,
      "success"
    );
    return workflows[index];
  }
  return null;
};

export const getLogs = () => {
  initAutomationDB();
  return JSON.parse(localStorage.getItem(KEY_LOGS));
};

export const clearLogs = () => {
  initAutomationDB();
  localStorage.setItem(KEY_LOGS, JSON.stringify([]));
  return [];
};

export const getSentEmails = () => {
  initAutomationDB();
  return JSON.parse(localStorage.getItem(KEY_SENT_MAILS));
};

export const clearSentEmails = () => {
  initAutomationDB();
  localStorage.setItem(KEY_SENT_MAILS, JSON.stringify([]));
  return [];
};

export const getNotifications = () => {
  initAutomationDB();
  return JSON.parse(localStorage.getItem(KEY_NOTIFICATIONS));
};

export const markNotificationsAsRead = () => {
  initAutomationDB();
  const list = getNotifications().map(n => ({ ...n, isRead: true }));
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(list));
  return list;
};

export const deleteNotification = (id) => {
  initAutomationDB();
  const list = getNotifications().filter(n => n.id !== id);
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(list));
  return list;
};

export const clearNotifications = () => {
  initAutomationDB();
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify([]));
  return [];
};

// ==========================================
// CORE WORKFLOW RUNNER UTILITIES
// ==========================================

const addLog = (workflowId, details, status = "success") => {
  const logs = getLogs();
  const newLog = {
    id: "log_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    workflowId,
    details,
    status
  };
  logs.unshift(newLog); // Put latest logs first
  localStorage.setItem(KEY_LOGS, JSON.stringify(logs));
  return newLog;
};

const sendSimulatedEmail = async (recipient, subject, bodyContentHtml, type) => {
  const EMAILJS_SERVICE_ID = "service_0xouo38";
  const EMAILJS_TEMPLATE_ID = "template_tuc7seu";
  const EMAILJS_PUBLIC_KEY = "8FS2r7vdqWYfxyXBf";

  const emails = getSentEmails();
  const newMail = {
    id: "mail_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    recipient,
    subject,
    body: bodyContentHtml,
    type,
    deliveryStatus: "pending"
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: recipient,
        subject: subject,
        message_html: bodyContentHtml,
      },
      EMAILJS_PUBLIC_KEY
    );
    newMail.deliveryStatus = "sent";
  } catch (err) {
    newMail.deliveryStatus = "failed";
    newMail.error = err?.text || String(err);
    console.error("EmailJS send failed:", err);
  }

  emails.unshift(newMail);
  localStorage.setItem(KEY_SENT_MAILS, JSON.stringify(emails));
  return newMail;
};

const addDashboardNotification = (title, message, type) => {
  const notifications = getNotifications();
  const newNotification = {
    id: "notif_" + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    title,
    message,
    type, // 'expiry' | 'donation' | 'added' | 'info'
    isRead: false
  };
  notifications.unshift(newNotification);
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(notifications));
  
  // Dispatch a custom event to notify App.jsx if mounted
  window.dispatchEvent(new CustomEvent("medicycle_notif_refresh"));
  return newNotification;
};

// ==========================================
// WORKFLOW TRIGGER HANDLERS
// ==========================================

/**
 * Workflow 1: Expiry Monitor Check (Run against inventory)
 * Can be run automatically on loading or manually via the "Sync" button
 */
export const triggerExpiryCheck = async (medicines = [], userEmail = "jane@example.com") => {
  const workflows = getWorkflows();
  const wConfig = workflows.find(w => w.id === "wj-expiry");
  
  if (!wConfig || !wConfig.isActive) {
    addLog("wj-expiry", "Expiry Monitor Scan skipped: Workflow is inactive.", "skipped");
    return { status: "skipped", message: "Workflow inactive" };
  }

  let triggeredCount = 0;
  
  // To avoid duplicate notifications/emails on the same day, we track already processed alerts in localStorage
  const alertRegistryKey = `medicycle_expiry_alerts_run_${userEmail}`;
  let sentAlerts = JSON.parse(localStorage.getItem(alertRegistryKey) || "[]");

  // Changed from forEach to for...of so await works correctly
  for (const med of medicines) {
    // Check if medicine belongs to user
    if (med.userId !== userEmail) continue;

    const days = getDaysRemaining(med.expiryDate);
    
    // Only alert if expiry <= 7 days but not expired yet (or expired we can handle too, but within 7 days is requested)
    if (days >= 0 && days <= 7) {
      const alertUniqueId = `${med.medicineId}_${med.expiryDate}_7day`;
      
      // If alert was already successfully dispatched today, skip
      if (sentAlerts.includes(alertUniqueId)) {
        continue;
      }

      triggeredCount++;
      sentAlerts.push(alertUniqueId);
      
      // 1. Log Execution
      addLog(
        "wj-expiry",
        `Critical Expiry trigger matched for '${med.medicineName}'. Expiry in ${days} days (Batch: ${med.batchNumber}).`,
        "success"
      );

      // 2. Generate Email Template
      const subject = `[URGENT] Medicine Expiry Warning: ${med.medicineName}`;
      const emailBody = `
        <div style="font-family: Outfit, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e8f5e9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(46,125,50,0.05); background-color: #ffffff;">
          <div style="background-color: #2e7d32; padding: 24px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; tracking: tight;">MediCycle AI Alert System</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #e8f5e9; opacity: 0.9;">Automatic Expiry Notification Rule activated</p>
          </div>
          <div style="padding: 24px; color: #1f2937; line-height: 1.6; font-size: 15px;">
            <p style="margin-top: 0; font-weight: 600; font-size: 16px;">Dear User,</p>
            <p>Our automation workflow detected that a registered medicine in your shelf is nearing its chemical expiry threshold of <strong>7 days</strong>:</p>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="color: #6b7280; font-weight: 600; padding: 4px 0;width: 120px;">Medicine:</td>
                  <td style="color: #1f2937; font-weight: 700; padding: 4px 0;">${med.medicineName}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-weight: 600; padding: 4px 0;">Manufacturer:</td>
                  <td style="color: #4b5563; padding: 4px 0;">${med.manufacturer}</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-weight: 600; padding: 4px 0;">Expiry Date:</td>
                  <td style="color: #dc2626; font-weight: 700; padding: 4px 0;">${med.expiryDate} (${days} Days Left)</td>
                </tr>
                <tr>
                  <td style="color: #6b7280; font-weight: 600; padding: 4px 0;">Batch Code:</td>
                  <td style="color: #4b5563; font-weight: 600; padding: 4px 0;">${med.batchNumber}</td>
                </tr>
              </table>
            </div>
            
            <p><strong>Action Required:</strong> Please dispose of this medicine safely if expired, or double-check its integrity. If you cannot consume it in time, you can list it on the donation marketplace immediately, provided it has at least 15 days left and remains sealed.</p>
            
            <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
              <a href="#" style="background-color: #2e7d32; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Manage Inventory</a>
            </div>
          </div>
          <div style="background-color: #f4f7f5; padding: 16px; border-top: 1px solid #e8f5e9; text-align: center; font-size: 11px; color: #6b7280;">
            This email is auto-generated by the MediCycle AI Expiry Daemon engine. Do not reply directly.
          </div>
        </div>
      `;
      
      // 3. Dispatch Actions
      if (wConfig.actionType === "both" || wConfig.actionType === "email") {
        await sendSimulatedEmail(userEmail, subject, emailBody, "expiry");
      }
      
      if (wConfig.actionType === "both" || wConfig.actionType === "system") {
        addDashboardNotification(
          "Medicine Expiring Soon",
          `Medicine '${med.medicineName}' is expiring in ${days} days (Batch: ${med.batchNumber}).`,
          "expiry"
        );
      }
    }
  }

  // Save registry to prevent spamming
  localStorage.setItem(alertRegistryKey, JSON.stringify(sentAlerts));

  if (triggeredCount > 0) {
    return { status: "run", message: `Alerted ${triggeredCount} critical items.` };
  } else {
    addLog("wj-expiry", "Expiry Monitor Scan: Checked all batches. No new critical expiries detected.", "success");
    return { status: "secure", message: "All stocks secure" };
  }
};

/**
 * Workflow 2: Donation Confirmed Email Trigger
 * Triggers when marked search state flag availableForDonation becomes true
 */
export const handleMedicineDonated = async (med, userEmail = "jane@example.com") => {
  const workflows = getWorkflows();
  const wConfig = workflows.find(w => w.id === "wj-donation");
  
  if (!wConfig || !wConfig.isActive) {
    addLog("wj-donation", "Donation Listing Confirmation skipped: Workflow is inactive.", "skipped");
    return;
  }

  // 1. Log Execution
  addLog(
    "wj-donation",
    `Donation workflow matched: '${med.medicineName}' flagged for public NGO distribution (Batch: ${med.batchNumber}).`,
    "success"
  );

  // 2. Generate Email
  const subject = `Donation Marketplace Confirmation - ${med.medicineName}`;
  const emailBody = `
    <div style="font-family: Outfit, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e8f5e9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(46,125,50,0.05); background-color: #ffffff;">
      <div style="background-color: #2e7d32; padding: 24px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; tracking: tight;">MediCycle AI Donation</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #e8f5e9; opacity: 0.9;">Thank you for listting your unused medicine</p>
      </div>
      <div style="padding: 24px; color: #1f2937; line-height: 1.6; font-size: 15px;">
        <p style="margin-top: 0; font-weight: 600; font-size: 16px;">Hello Donor,</p>
        <p>This email confirms that you successfully marked medication in your cabinet as available for redirection. NGOs on our regional network will now be notified and can request this package:</p>
        
        <div style="background-color: #e8f5e9; border: 1px solid #a5d6a7; border-collapse: collapse; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="color: #2e7d32; font-weight: 600; padding: 4px 0; width: 120px;">Medicine:</td>
              <td style="color: #1f2937; font-weight: 700; padding: 4px 0;">${med.medicineName}</td>
            </tr>
            <tr>
              <td style="color: #2e7d32; font-weight: 600; padding: 4px 0;">Package Qty:</td>
              <td style="color: #1f2937; font-weight: 700; padding: 4px 0;">${med.quantity} units</td>
            </tr>
            <tr>
              <td style="color: #2e7d32; font-weight: 600; padding: 4px 0;">Batch Identifier:</td>
              <td style="color: #4b5563; font-weight: 600; padding: 4px 0;">${med.batchNumber}</td>
            </tr>
            <tr>
              <td style="color: #2e7d32; font-weight: 600; padding: 4px 0;">Expiry Date:</td>
              <td style="color: #4b5563; padding: 4px 0;">${med.expiryDate}</td>
            </tr>
            <tr>
              <td style="color: #2e7d32; font-weight: 600; padding: 4px 0;">Storage Check:</td>
              <td style="color: #4b5563; padding: 4px 0;">${med.storageCondition || "Room Temperature"}</td>
            </tr>
          </table>
        </div>
        
        <p><strong>Next Steps:</strong> When an NGO submits a request for this medication, you will receive a dashboard notification. We will coordinate courier pickup directly from your registered residential address.</p>
        
        <p style="font-size: 13px; color: #6b7280; font-style: italic;">"Saving medicine is saving lives." Thank you for choice to redistribute sustainably.</p>
      </div>
      <div style="background-color: #f4f7f5; padding: 16px; border-top: 1px solid #e8f5e9; text-align: center; font-size: 11px; color: #6b7280;">
        MediCycle Donation verification framework.
      </div>
    </div>
  `;

  // 3. Actions
  if (wConfig.actionType === "both" || wConfig.actionType === "email") {
    await sendSimulatedEmail(userEmail, subject, emailBody, "donation");
  }

  if (wConfig.actionType === "both" || wConfig.actionType === "system") {
    addDashboardNotification(
      "Donation confirmation email sent",
      `Sent email receipt to ${userEmail} for listing '${med.medicineName}' (Batch: ${med.batchNumber}).`,
      "donation"
    );
  }
};

/**
 * Workflow 3: Medicine Added Notification Trigger
 * Triggers when new medicine is added in database
 */
export const handleMedicineAdded = async (med, userEmail = "jane@example.com") => {
  const workflows = getWorkflows();
  const wConfig = workflows.find(w => w.id === "wj-add");
  
  if (!wConfig || !wConfig.isActive) {
    addLog("wj-add", "New Inventory Tracker skipped: Workflow is inactive.", "skipped");
    return;
  }

  // 1. Log Execution
  addLog(
    "wj-add",
    `Inventory workflow triggered: New medicine '${med.medicineName}' added (Batch: ${med.batchNumber}).`,
    "success"
  );

  // 2. Add System alert
  if (wConfig.actionType === "system" || wConfig.actionType === "both") {
    addDashboardNotification(
      "Medicine Added Successfully",
      `Medicine record '${med.medicineName}' (Batch: ${med.batchNumber}, Qty: ${med.quantity}) has been registered in the database.`,
      "added"
    );
  }

  // Note: if category is immediately listed as availableForDonation during creation, we should also trigger handleMedicineDonated
  if (med.availableForDonation) {
    await handleMedicineDonated(med, userEmail);
  }
};

/**
 * Additional Flow: Donation Successful
 * Triggered on mark donation as completed
 */
export const handleDonationCompleted = async (med) => {
  // A log is created for audit trails
  addLog(
    "wj-donation",
    `Donation completed: '${med.medicineName}' (Batch: ${med.batchNumber}) collected by NGO agent.`,
    "success"
  );

  addDashboardNotification(
    "Donation Successful",
    `Redirection complete! NGO picked up medicine '${med.medicineName}' (Qty: ${med.quantity}) from your inventory shelf.`,
    "donation"
  );
};
