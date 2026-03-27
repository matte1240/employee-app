export const getMissingTimesheetReminderEmailTemplate = (
  username: string,
  missingDatesFormatted: string,
  dashboardUrl: string
) => {
  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
            .warning-box {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border: 2px solid #fcd34d;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .warning-box-title {
              color: #92400e;
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 10px;
            }
            .warning-box-dates {
              color: #78350f;
              font-size: 14px;
              margin: 8px 0;
            }
            .cta-box {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 28px;
              text-align: center;
              margin: 28px 0;
            }
            .cta-text {
              color: #334155;
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white !important;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 10px;
              font-weight: 600;
              font-size: 15px;
            }
            .info-box {
              background: #eff6ff;
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .info-list {
              margin: 0;
              padding-left: 20px;
              color: #1e3a8a;
              font-size: 14px;
            }
            .info-list li {
              margin: 6px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 24px 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
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
              <h1>Ore mancanti ⚠️</h1>
            </div>

            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>

              <p class="message">
                Ti scriviamo perché ci sono alcuni giorni senza ore registrate. 
                Niente di grave, basta un attimo per sistemarli!
              </p>

              <div class="warning-box">
                <div class="warning-box-title">📅 Giorni da completare:</div>
                <div class="warning-box-dates">
                  ${missingDatesFormatted}
                </div>
              </div>

              <div class="cta-box">
                <div class="cta-text">Vai al calendario e compila le ore mancanti:</div>
                <a href="${dashboardUrl}" class="button">
                  Apri il calendario
                </a>
              </div>

              <div class="info-box">
                <div class="info-box-title">📋 Promemoria veloce</div>
                <ul class="info-list">
                  <li>Puoi modificare le ore del <strong>mese corrente</strong></li>
                  <li>Ricordati di segnare anche straordinari e assenze</li>
                  <li>Se eri in ferie o malattia, registra anche quelle</li>
                  <li>Per qualsiasi problema, chiedi all'amministratore</li>
                </ul>
              </div>

              <p class="message">
                Se hai già inserito tutto o quei giorni erano festivi, ignora pure questa email. 😊
              </p>
            </div>

            <div class="footer">
              <div class="footer-text">Email automatica — non rispondere a questo messaggio</div>
              <div class="footer-brand">Presenze Ivicolors &copy; ${new Date().getFullYear()}</div>
            </div>
          </div>
        </body>
      </html>
    `;

  const text = `Ore mancanti ⚠️

Ciao ${username}! 👋

Ti scriviamo perché ci sono alcuni giorni senza ore registrate. Niente di grave, basta un attimo per sistemarli!

📅 GIORNI DA COMPLETARE:
${missingDatesFormatted}

Vai al calendario e compila le ore mancanti:
${dashboardUrl}

📋 PROMEMORIA VELOCE:
- Puoi modificare le ore del mese corrente
- Ricordati di segnare anche straordinari e assenze
- Se eri in ferie o malattia, registra anche quelle
- Per qualsiasi problema, chiedi all'amministratore

Se hai già inserito tutto o quei giorni erano festivi, ignora pure questa email.

---
Email automatica — non rispondere a questo messaggio
Presenze Ivicolors © ${new Date().getFullYear()}`;

  return { html, text };
};
