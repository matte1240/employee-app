export const getWelcomeSetupEmailTemplate = (
  username: string,
  setupUrl: string,
  email: string
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            .highlight-box {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #86efac;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .highlight-box-title {
              color: #166534;
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .highlight-box-text {
              color: #15803d;
              font-size: 14px;
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 10px;
              font-weight: 600;
              font-size: 15px;
            }
            .link-fallback {
              margin-top: 16px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
            }
            .link-fallback a {
              color: #10b981;
              word-break: break-all;
              text-decoration: none;
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
              <h1>Benvenuto nel team! 🎉</h1>
            </div>

            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>
              
              <p class="message">
                Che bello averti a bordo! Il tuo account su <strong>Presenze Ivicolors</strong> 
                è pronto — manca solo un ultimo passaggio.
              </p>

              <div class="highlight-box">
                <div class="highlight-box-title">🎯 Quasi fatto!</div>
                <div class="highlight-box-text">
                  Devi solo scegliere una password per il tuo account. 
                  Ci vogliono due minuti, promesso!
                </div>
              </div>

              <div class="cta-box">
                <div class="cta-text">Clicca qui sotto per impostare la password:</div>
                <a href="${setupUrl}" class="button">
                  Imposta la mia password
                </a>
                <div class="link-fallback">
                  Il pulsante non funziona? Copia questo link nel browser:<br>
                  <a href="${setupUrl}">${setupUrl}</a>
                </div>
              </div>

              <div class="info-box">
                <div class="info-box-title">📋 Cose da sapere</div>
                <ul class="info-list">
                  <li>Il link è <strong>valido per 24 ore</strong></li>
                  <li>Scegli una password di almeno 8 caratteri</li>
                  <li>Dopo aver impostato la password potrai accedere subito</li>
                  <li>Il tuo username è: <strong>${email}</strong></li>
                </ul>
              </div>

              <p class="message">
                Se hai dubbi o qualcosa non va, scrivi pure all'amministratore — siamo qui per aiutarti!
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

  const text = `Benvenuto su Presenze Ivicolors! 🎉

Ciao ${username}! 👋

Che bello averti a bordo! Il tuo account è pronto, manca solo la password.

🎯 QUASI FATTO
Clicca il link qui sotto per scegliere la tua password (ci vogliono 2 minuti):
${setupUrl}

📋 COSE DA SAPERE:
- Il link è valido per 24 ore
- Scegli una password di almeno 8 caratteri
- Dopo potrai accedere subito
- Il tuo username è: ${email}

Se hai dubbi, scrivi pure all'amministratore!

---
Email automatica — non rispondere a questo messaggio
Presenze Ivicolors © ${new Date().getFullYear()}`;

  return { html, text };
};
