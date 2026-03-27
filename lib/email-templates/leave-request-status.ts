const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: "Ferie",
  SICKNESS: "Malattia",
  PERMESSO: "Permesso",
};

type StatusAction = "APPROVED" | "REJECTED" | "MODIFIED";

const STATUS_CONFIG: Record<StatusAction, {
  gradient: string;
  title: string;
  emoji: string;
  messageColor: string;
  badgeColor: string;
}> = {
  APPROVED: {
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    title: "Richiesta approvata",
    emoji: "✅",
    messageColor: "#166534",
    badgeColor: "#10b981",
  },
  REJECTED: {
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    title: "Richiesta rifiutata",
    emoji: "❌",
    messageColor: "#991b1b",
    badgeColor: "#ef4444",
  },
  MODIFIED: {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    title: "Richiesta modificata",
    emoji: "✏️",
    messageColor: "#92400e",
    badgeColor: "#f59e0b",
  },
};

export function getLeaveRequestStatusEmailTemplate(params: {
  employeeName: string;
  action: StatusAction;
  leaveType: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  adminNotes?: string;
  dashboardUrl: string;
}) {
  const {
    employeeName,
    action,
    leaveType,
    startDate,
    endDate,
    startTime,
    endTime,
    adminNotes,
    dashboardUrl,
  } = params;

  const typeLabel = LEAVE_TYPE_LABELS[leaveType] ?? leaveType;
  const config = STATUS_CONFIG[action];

  const isSingleDay = startDate === endDate;
  const dateRange = isSingleDay ? startDate : `${startDate} → ${endDate}`;
  const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : null;

  const messageByAction: Record<StatusAction, string> = {
    APPROVED: `La tua richiesta di <strong>${typeLabel}</strong> è stata approvata! 🎉`,
    REJECTED: `Purtroppo la tua richiesta di <strong>${typeLabel}</strong> è stata rifiutata.`,
    MODIFIED: `La tua richiesta di <strong>${typeLabel}</strong> è stata modificata dall'amministratore.`,
  };

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
        background: #f1f5f9;
        padding: 20px;
      }
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      }
      .header {
        background: ${config.gradient};
        padding: 32px 30px;
        text-align: center;
      }
      .header h1 {
        color: white;
        font-size: 24px;
        font-weight: 700;
        margin: 0;
      }
      .content {
        padding: 36px 30px;
      }
      .greeting {
        font-size: 18px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 12px;
      }
      .message {
        color: #475569;
        margin-bottom: 20px;
        font-size: 15px;
      }
      .detail-card {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
      }
      .status-badge {
        display: inline-block;
        background: ${config.badgeColor};
        color: white;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 14px;
      }
      .detail-row {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .detail-label {
        color: #64748b;
        font-weight: 600;
      }
      .detail-value {
        color: #1e293b;
        font-weight: 500;
      }
      .admin-notes {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
        border-radius: 0 8px 8px 0;
        padding: 12px 16px;
        margin-top: 14px;
        font-size: 14px;
        color: #475569;
        font-style: italic;
      }
      .cta-box {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 28px;
        text-align: center;
        margin: 24px 0;
      }
      .cta-text {
        color: #334155;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .button {
        display: inline-block;
        background: ${config.gradient};
        color: white !important;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 15px;
      }
      .footer {
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        padding: 24px 30px;
        text-align: center;
      }
      .footer-text {
        color: #94a3b8;
        font-size: 12px;
        margin: 4px 0;
      }
      .footer-brand {
        color: #334155;
        font-weight: 600;
        font-size: 13px;
        margin-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="header">
        <img src="cid:logo-white" alt="Ivicolors" style="max-width:140px;height:auto;margin-bottom:12px;" />
        <h1>${config.title} ${config.emoji}</h1>
      </div>

      <div class="content">
        <div class="greeting">Ciao ${employeeName}! 👋</div>
        <p class="message">${messageByAction[action]}</p>

        <div class="detail-card">
          <span class="status-badge">${typeLabel}</span>

          <div class="detail-row">
            <span class="detail-label">Tipo: </span>
            <span class="detail-value">${typeLabel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${isSingleDay ? "Data" : "Periodo"}: </span>
            <span class="detail-value">${dateRange}</span>
          </div>
          ${timeRange ? `
          <div class="detail-row">
            <span class="detail-label">Orario: </span>
            <span class="detail-value">${timeRange}</span>
          </div>` : ""}
          ${adminNotes ? `
          <div class="admin-notes">
            💬 <strong>Nota dell'admin:</strong> ${adminNotes}
          </div>` : ""}
        </div>

        <div class="cta-box">
          <p class="cta-text">Puoi controllare le tue richieste dalla dashboard:</p>
          <a href="${dashboardUrl}" class="button">Vai alle mie richieste</a>
        </div>
      </div>

      <div class="footer">
        <div class="footer-text">Email automatica — non rispondere a questo messaggio</div>
        <div class="footer-brand">Presenze Ivicolors &copy; ${new Date().getFullYear()}</div>
      </div>
    </div>
  </body>
</html>`;

  const statusTextMap: Record<StatusAction, string> = {
    APPROVED: "APPROVATA ✅",
    REJECTED: "RIFIUTATA ❌",
    MODIFIED: "MODIFICATA ✏️",
  };

  const text = `${config.title} ${config.emoji}

Ciao ${employeeName}! 👋

La tua richiesta di ${typeLabel} è stata ${statusTextMap[action]}.

Dettagli:
- Tipo: ${typeLabel}
- ${isSingleDay ? "Data" : "Periodo"}: ${dateRange}${timeRange ? `\n- Orario: ${timeRange}` : ""}${adminNotes ? `\n- Nota admin: ${adminNotes}` : ""}

Controlla le tue richieste:
${dashboardUrl}

---
Email automatica — non rispondere a questo messaggio
Presenze Ivicolors © ${new Date().getFullYear()}`;

  return { html, text };
}
