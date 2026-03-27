export const getPasswordResetLinkEmailTemplate = (
  username: string,
  resetUrl: string,
  validityDuration: string = "1 ora"
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
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
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
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
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
              color: #2563eb;
              word-break: break-all;
              text-decoration: none;
            }
            .info-box {
              background: #fffbeb;
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .info-list {
              margin: 0;
              padding-left: 20px;
              color: #78350f;
              font-size: 14px;
            }
            .info-list li {
              margin: 6px 0;
            }
            .security-note {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 16px;
              margin-top: 20px;
              border-left: 4px solid #64748b;
            }
            .security-note-title {
              font-weight: 600;
              color: #334155;
              margin-bottom: 6px;
              font-size: 14px;
            }
            .security-note-text {
              color: #475569;
              font-size: 13px;
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
              <h1>Reset Password 🔐</h1>
            </div>

            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>
              
              <p class="message">
                Hai chiesto di reimpostare la password del tuo account Presenze Ivicolors. 
                Tranquillo, capita a tutti! 😄
              </p>

              <div class="cta-box">
                <div class="cta-text">Clicca qui sotto per scegliere una nuova password:</div>
                <a href="${resetUrl}" class="button">
                  Reimposta la mia password
                </a>
                <div class="link-fallback">
                  Il pulsante non funziona? Copia questo link nel browser:<br>
                  <a href="${resetUrl}">${resetUrl}</a>
                </div>
              </div>

              <div class="info-box">
                <div class="info-box-title">⏰ Info utili</div>
                <ul class="info-list">
                  <li>Il link è <strong>valido per ${validityDuration}</strong></li>
                  <li>Puoi usarlo <strong>una sola volta</strong></li>
                  <li>Dopo il reset dovrai fare il login con la nuova password</li>
                </ul>
              </div>

              <div class="security-note">
                <div class="security-note-title">🛡️ Non sei stato tu?</div>
                <div class="security-note-text">
                  Se non hai chiesto tu il reset, ignora pure questa email e 
                  avvisa l'amministratore. Il tuo account resta al sicuro.
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">Email automatica — non rispondere a questo messaggio</div>
              <div class="footer-brand">Presenze Ivicolors &copy; ${new Date().getFullYear()}</div>
            </div>
          </div>
        </body>
      </html>
    `;

  const text = `Reset Password 🔐

Ciao ${username}! 👋

Hai chiesto di reimpostare la password del tuo account Presenze Ivicolors. Tranquillo, capita a tutti!

Clicca il link qui sotto per scegliere una nuova password:
${resetUrl}

⏰ INFO UTILI:
- Il link è valido per ${validityDuration}
- Puoi usarlo una sola volta
- Dopo il reset dovrai fare il login con la nuova password

🛡️ Non sei stato tu? Ignora questa email e avvisa l'amministratore.

---
Email automatica — non rispondere a questo messaggio
Presenze Ivicolors © ${new Date().getFullYear()}`;

  return { html, text };
};
