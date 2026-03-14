import nodemailer from "nodemailer";
import path from "path";
import { getWelcomeSetupEmailTemplate } from "./email-templates/welcome-setup";
import { getPasswordResetLinkEmailTemplate } from "./email-templates/password-reset-link";
import { getBackupEmailTemplate } from "./email-templates/backup";
import { getLeaveRequestAdminEmailTemplate } from "./email-templates/leave-request-admin";
import { getMissingTimesheetReminderEmailTemplate } from "./email-templates/missing-timesheet-reminder";

// Logo CID attachments for branded emails
const logoDir = path.join(process.cwd(), "public");

export const emailLogoAttachments = [
  {
    filename: "logo.png",
    path: path.join(logoDir, "email-logo.png"),
    cid: "logo",
  },
  {
    filename: "logo-white.png",
    path: path.join(logoDir, "email-logo-white.png"),
    cid: "logo-white",
  },
];

// Configurazione transporter Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: 587,
  secure: false, // true per port 465, false per altri
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // App Password di Gmail
  },
});

const senderEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const senderName = process.env.EMAIL_FROM_NAME || "Time Tracker";
const fromAddress = senderEmail ? `"${senderName}" <${senderEmail}>` : senderName;

// Verifica connessione (opzionale, utile per debug)
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Server email pronto per l'invio");
    return true;
  } catch (error) {
    console.error("❌ Errore connessione email:", error);
    return false;
  }
}

// Funzione generica per inviare notifiche
export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent: string
) {
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email notifica inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email notifica:", error);
    throw error;
  }
}

// Template email per nuovo account - Link setup password
export async function sendWelcomeSetupEmail(
  to: string,
  username: string,
  setupUrl: string
) {
  const { html, text } = getWelcomeSetupEmailTemplate(username, setupUrl, to);

  const mailOptions = {
    from: fromAddress,
    to,
    subject: "🎉 Benvenuto su Presenze Ivicolors - Configura il tuo account",
    html,
    text,
    attachments: [...emailLogoAttachments],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email benvenuto con setup link inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email benvenuto:", error);
    throw error;
  }
}

// Template email per reset password con link
export async function sendPasswordResetLinkEmail(
  to: string,
  username: string,
  resetUrl: string,
  validityDuration: string = "1 ora"
) {
  const { html, text } = getPasswordResetLinkEmailTemplate(
    username,
    resetUrl,
    validityDuration
  );

  const mailOptions = {
    from: fromAddress,
    to,
    subject: "🔐 Reimposta la tua password - Presenze Ivicolors",
    html,
    text,
    attachments: [...emailLogoAttachments],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email reset password link inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email reset link:", error);
    throw error;
  }
}

// Invia email di backup
export async function sendBackupEmail(
  to: string,
  success: boolean,
  filename?: string,
  filePath?: string,
  errorMessage?: string
) {
  const subject = success
    ? `✅ Backup Database Completato: ${filename}`
    : `❌ Errore Backup Database`;

  const { html } = getBackupEmailTemplate(success, filename, errorMessage);

  const mailOptions: nodemailer.SendMailOptions = {
    from: fromAddress,
    to,
    subject,
    html,
    attachments: [...emailLogoAttachments],
  };

  if (success && filePath && filename) {
    mailOptions.attachments!.push({
      filename: filename,
      path: filePath,
    });
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email backup inviata a ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Errore invio email backup:", error);
    return false;
  }
}

// Notifica agli admin per una nuova richiesta di ferie/permesso
export async function sendLeaveRequestAdminNotification(params: {
  adminEmail: string;
  adminName: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? ""}/dashboard/requests`;

  const { html, text } = getLeaveRequestAdminEmailTemplate({
    ...params,
    dashboardUrl,
  });

  const LEAVE_TYPE_LABELS: Record<string, string> = {
    VACATION: "Ferie",
    SICKNESS: "Malattia",
    PERMESSO: "Permesso",
  };
  const typeLabel = LEAVE_TYPE_LABELS[params.leaveType] ?? params.leaveType;

  const mailOptions = {
    from: fromAddress,
    to: params.adminEmail,
    subject: `📋 Nuova richiesta di ${typeLabel} da ${params.employeeName}`,
    html,
    text,
    attachments: [...emailLogoAttachments],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email richiesta ferie inviata ad admin ${params.adminEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Errore invio email richiesta ferie ad admin ${params.adminEmail}:`, error);
    // Non propaghiamo l'errore per non bloccare la creazione della richiesta
    return { success: false };
  }
}

// Template email per promemoria timesheet mancante
export async function sendMissingTimesheetReminderEmail(
  to: string,
  username: string,
  missingDatesFormatted: string
) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL ?? ""}/dashboard`;
  const { html, text } = getMissingTimesheetReminderEmailTemplate(
    username,
    missingDatesFormatted,
    dashboardUrl
  );

  const mailOptions = {
    from: fromAddress,
    to,
    subject: "⚠️ Promemoria: Ore mancanti nel calendario",
    html,
    text,
    attachments: [...emailLogoAttachments],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email promemoria timesheet inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email promemoria timesheet:", error);
    return { success: false };
  }
}