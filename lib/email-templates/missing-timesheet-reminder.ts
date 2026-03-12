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
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef9c3 100%);
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header-icon {
              width: 64px;
              height: 64px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 16px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
              backdrop-filter: blur(10px);
            }
            .header h1 {
              color: white;
              font-size: 26px;
              font-weight: 700;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 16px;
            }
            .message {
              color: #475569;
              margin-bottom: 24px;
              font-size: 15px;
            }
            .warning-box {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border: 2px solid #fcd34d;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .warning-box-title {
              color: #92400e;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .warning-box-dates {
              color: #78350f;
              font-size: 14px;
              margin: 8px 0;
            }
            .date-tag {
              display: inline-block;
              background: #fde68a;
              border: 1px solid #fcd34d;
              border-radius: 6px;
              padding: 4px 10px;
              margin: 4px;
              font-weight: 600;
              color: #92400e;
              font-size: 13px;
            }
            .cta-box {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 32px;
              text-align: center;
              margin: 32px 0;
            }
            .cta-text {
              color: #334155;
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.2);
            }
            .info-box {
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .info-list {
              margin: 0;
              padding-left: 20px;
              color: #1e3a8a;
              font-size: 14px;
            }
            .info-list li {
              margin: 8px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              color: #64748b;
              font-size: 13px;
              margin: 8px 0;
            }
            .footer-brand {
              color: #334155;
              font-weight: 600;
              font-size: 14px;
              margin-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
              <div class="header-icon">
                <img src="cid:logo-white" alt="Ivicolors" width="48" height="48" style="display:block;" />
              </div>
              <h1>⚠️ Ore Mancanti nel Calendario</h1>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>

              <p class="message">
                Abbiamo notato che non hai ancora inserito le tue ore lavorative per alcuni giorni.
                È importante mantenere il registro aggiornato per una corretta gestione delle presenze.
              </p>

              <!-- Warning Box -->
              <div class="warning-box">
                <div class="warning-box-title">📅 Giorni con ore mancanti:</div>
                <div class="warning-box-dates">
                  ${missingDatesFormatted}
                </div>
              </div>

              <!-- CTA Box -->
              <div class="cta-box">
                <div class="cta-text">Accedi alla piattaforma e inserisci le ore mancanti:</div>
                <a href="${dashboardUrl}" class="button">
                  Compila il Calendario
                </a>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <div class="info-box-title">📋 Promemoria</div>
                <ul class="info-list">
                  <li>Puoi modificare le ore del <strong>mese corrente</strong></li>
                  <li>Inserisci le ore lavorate, gli straordinari e le eventuali assenze</li>
                  <li>Se eri in ferie o malattia quei giorni, ricorda di registrare anche quelle</li>
                  <li>Per qualsiasi problema, contatta il tuo amministratore</li>
                </ul>
              </div>

              <p class="message">
                Se hai già provveduto ad inserire le ore o se quei giorni erano festivi / di riposo,
                puoi ignorare questa email.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-text">
                Questa è un'email automatica, ti preghiamo di non rispondere.
              </div>
              <div class="footer-brand">
                Presenze Ivicolors © ${new Date().getFullYear()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

  const text = `
⚠️ Promemoria: Ore Mancanti nel Calendario

Ciao ${username}!

Abbiamo notato che non hai ancora inserito le tue ore lavorative per i seguenti giorni:

${missingDatesFormatted}

📅 COSA FARE
Accedi alla piattaforma e inserisci le ore mancanti il prima possibile usando questo link:
${dashboardUrl}

📋 PROMEMORIA:
- Puoi modificare le ore del mese corrente
- Inserisci le ore lavorate, gli straordinari e le eventuali assenze
- Se eri in ferie o malattia quei giorni, ricorda di registrare anche quelle
- Per qualsiasi problema, contatta il tuo amministratore

Se hai già provveduto ad inserire le ore o se quei giorni erano festivi / di riposo, puoi ignorare questa email.

---
Questa è un'email automatica, ti preghiamo di non rispondere.
Presenze Ivicolors © ${new Date().getFullYear()}
    `;

  return { html, text };
};
