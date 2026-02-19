const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: "Ferie",
  SICKNESS: "Malattia",
  PERMESSO: "Permesso",
};

const LEAVE_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  VACATION: {
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "#93c5fd",
    text: "#1e40af",
    badge: "#2563eb",
  },
  SICKNESS: {
    bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    border: "#fdba74",
    text: "#c2410c",
    badge: "#ea580c",
  },
  PERMESSO: {
    bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    border: "#c4b5fd",
    text: "#6d28d9",
    badge: "#7c3aed",
  },
};

export function getLeaveRequestAdminEmailTemplate(params: {
  adminName: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  dashboardUrl: string;
}) {
  const {
    adminName,
    employeeName,
    employeeEmail,
    leaveType,
    startDate,
    endDate,
    startTime,
    endTime,
    reason,
    dashboardUrl,
  } = params;

  const typeLabel = LEAVE_TYPE_LABELS[leaveType] ?? leaveType;
  const colors = LEAVE_TYPE_COLORS[leaveType] ?? LEAVE_TYPE_COLORS.PERMESSO;

  const isSingleDay = startDate === endDate;
  const dateRange = isSingleDay ? startDate : `${startDate} → ${endDate}`;
  const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : null;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #1e293b;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
        padding: 20px;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      }
      .header {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        padding: 36px 30px;
        text-align: center;
      }
      .header-icon {
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.2);
        border-radius: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
        font-size: 28px;
        line-height: 60px;
      }
      .header h1 {
        color: white;
        font-size: 24px;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header p {
        color: rgba(255,255,255,0.85);
        margin-top: 6px;
        font-size: 14px;
      }
      .content {
        padding: 36px 30px;
      }
      .greeting {
        font-size: 17px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 12px;
      }
      .intro {
        color: #475569;
        font-size: 15px;
        margin-bottom: 28px;
      }
      .request-card {
        background: ${colors.bg};
        border: 2px solid ${colors.border};
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 24px;
      }
      .request-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .type-badge {
        display: inline-block;
        background: ${colors.badge};
        color: white;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .detail-row {
        display: flex;
        margin-bottom: 10px;
        font-size: 14px;
      }
      .detail-label {
        color: #64748b;
        font-weight: 600;
        width: 130px;
        flex-shrink: 0;
      }
      .detail-value {
        color: ${colors.text};
        font-weight: 500;
      }
      .reason-box {
        background: #f8fafc;
        border-left: 3px solid #cbd5e1;
        border-radius: 0 8px 8px 0;
        padding: 12px 16px;
        margin-top: 14px;
        font-size: 14px;
        color: #475569;
        font-style: italic;
      }
      .cta-box {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 28px;
        text-align: center;
        margin: 24px 0;
      }
      .cta-text {
        color: #334155;
        font-size: 14px;
        margin-bottom: 18px;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 15px;
        letter-spacing: 0.3px;
      }
      .footer {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 24px 30px;
        text-align: center;
      }
      .footer p {
        color: #94a3b8;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <div class="header-icon">📋</div>
        <h1>Nuova Richiesta di Assenza</h1>
        <p>Richiede la tua approvazione</p>
      </div>

      <div class="content">
        <p class="greeting">Ciao ${adminName},</p>
        <p class="intro">
          <strong>${employeeName}</strong> ha inviato una nuova richiesta di assenza che richiede la tua revisione.
        </p>

        <div class="request-card">
          <div class="request-card-header">
            <span class="type-badge">${typeLabel}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Dipendente</span>
            <span class="detail-value">${employeeName} &lt;${employeeEmail}&gt;</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tipo</span>
            <span class="detail-value">${typeLabel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${isSingleDay ? "Data" : "Periodo"}</span>
            <span class="detail-value">${dateRange}</span>
          </div>
          ${timeRange ? `
          <div class="detail-row">
            <span class="detail-label">Orario</span>
            <span class="detail-value">${timeRange}</span>
          </div>` : ""}
          ${reason ? `
          <div class="reason-box">
            💬 <strong>Nota:</strong> ${reason}
          </div>` : ""}
        </div>

        <div class="cta-box">
          <p class="cta-text">Accedi alla dashboard per approvare o rifiutare la richiesta.</p>
          <a href="${dashboardUrl}" class="button">Gestisci Richiesta →</a>
        </div>
      </div>

      <div class="footer">
        <p>Time Tracker · Notifica automatica</p>
        <p style="margin-top:4px;">Non rispondere a questa email.</p>
      </div>
    </div>
  </body>
</html>`;

  const text = `Nuova richiesta di assenza - Time Tracker

Ciao ${adminName},

${employeeName} (${employeeEmail}) ha inviato una nuova richiesta di assenza.

Dettagli:
- Tipo: ${typeLabel}
- ${isSingleDay ? "Data" : "Periodo"}: ${dateRange}${timeRange ? `\n- Orario: ${timeRange}` : ""}${reason ? `\n- Nota: ${reason}` : ""}

Accedi alla dashboard per gestire la richiesta:
${dashboardUrl}

---
Time Tracker · Notifica automatica
`;

  return { html, text };
}
