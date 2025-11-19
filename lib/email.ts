import nodemailer from "nodemailer";

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

// Template email per nuovo utente
export async function sendWelcomeEmail(
  to: string,
  username: string,
  temporaryPassword: string
) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Benvenuto - Credenziali di accesso",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4F46E5; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Benvenuto nel Time Tracker!</h1>
            </div>
            <div class="content">
              <p>Ciao <strong>${username}</strong>,</p>
              <p>Il tuo account è stato creato con successo. Ecco le tue credenziali di accesso:</p>
              
              <div class="credentials">
                <p><strong>Username:</strong> <code>${username}</code></p>
                <p><strong>Password temporanea:</strong> <code>${temporaryPassword}</code></p>
              </div>
              
              <p><strong>⚠️ Importante:</strong></p>
              <ul>
                <li>Questa è una password temporanea</li>
                <li>Ti consigliamo di cambiarla al primo accesso</li>
                <li>Puoi modificare la password dalla sezione "Profilo"</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" class="button">
                  Accedi ora
                </a>
              </div>
              
              <p>Se hai domande o problemi, contatta l'amministratore.</p>
            </div>
            <div class="footer">
              <p>Questo è un messaggio automatico, per favore non rispondere a questa email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Benvenuto ${username}!

Il tuo account è stato creato con successo.

Credenziali di accesso:
Username: ${username}
Password temporanea: ${temporaryPassword}

⚠️ IMPORTANTE:
- Questa è una password temporanea
- Ti consigliamo di cambiarla al primo accesso
- Puoi modificare la password dalla sezione "Profilo"

Accedi a: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}

Se hai domande o problemi, contatta l'amministratore.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email di benvenuto inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email benvenuto:", error);
    throw error;
  }
}

// Template email per reset password
export async function sendPasswordResetEmail(
  to: string,
  username: string,
  newPassword: string
) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset Password - Nuova password temporanea",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials { background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #DC2626; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Reset Password</h1>
            </div>
            <div class="content">
              <p>Ciao <strong>${username}</strong>,</p>
              <p>La tua password è stata reimpostata. Ecco la tua nuova password temporanea:</p>
              
              <div class="credentials">
                <p><strong>Username:</strong> <code>${username}</code></p>
                <p><strong>Nuova password temporanea:</strong> <code>${newPassword}</code></p>
              </div>
              
              <div class="warning">
                <p><strong>⚠️ Importante - Azione immediata richiesta:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Questa è una password temporanea</li>
                  <li>Cambiala immediatamente dopo il login</li>
                  <li>Vai su "Profilo" → "Modifica Password"</li>
                  <li>Scegli una password sicura e univoca</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" class="button">
                  Accedi e cambia password
                </a>
              </div>
              
              <p><strong>⚠️ Se non hai richiesto questo reset:</strong><br>
              Contatta immediatamente l'amministratore - il tuo account potrebbe essere compromesso.</p>
            </div>
            <div class="footer">
              <p>Questo è un messaggio automatico, per favore non rispondere a questa email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Password

Ciao ${username},

La tua password è stata reimpostata.

Credenziali aggiornate:
Username: ${username}
Nuova password temporanea: ${newPassword}

⚠️ IMPORTANTE - AZIONE IMMEDIATA RICHIESTA:
- Questa è una password temporanea
- Cambiala immediatamente dopo il login
- Vai su "Profilo" → "Modifica Password"
- Scegli una password sicura e univoca

Accedi a: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}

⚠️ Se non hai richiesto questo reset:
Contatta immediatamente l'amministratore - il tuo account potrebbe essere compromesso.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email reset password inviata:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Errore invio email reset:", error);
    throw error;
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
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
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
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🎉 Benvenuto su Time Tracker - Configura il tuo account",
    html: `
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
              background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
              font-size: 28px;
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
            .welcome-box {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #86efac;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .welcome-box-title {
              color: #166534;
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .welcome-box-text {
              color: #15803d;
              font-size: 14px;
              margin: 8px 0;
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
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2);
              transition: all 0.3s ease;
            }
            .button:hover {
              box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4), 0 10px 10px -5px rgba(16, 185, 129, 0.3);
              transform: translateY(-2px);
            }
            .link-fallback {
              margin-top: 20px;
              padding-top: 20px;
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h1>Benvenuto nel Team!</h1>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>
              
              <p class="message">
                Siamo entusiasti di darti il benvenuto su <strong>Time Tracker</strong>! 
                Il tuo account è stato creato con successo.
              </p>

              <!-- Welcome Box -->
              <div class="welcome-box">
                <div class="welcome-box-title">🎯 Iniziamo!</div>
                <div class="welcome-box-text">
                  Per completare la configurazione del tuo account, è necessario impostare una password personale.
                  Questo ti garantirà un accesso sicuro alla piattaforma.
                </div>
              </div>

              <!-- CTA Box -->
              <div class="cta-box">
                <div class="cta-text">Clicca sul pulsante qui sotto per impostare la tua password:</div>
                <a href="${setupUrl}" class="button">
                  Imposta la Mia Password
                </a>
                <div class="link-fallback">
                  Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                  <a href="${setupUrl}">${setupUrl}</a>
                </div>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <div class="info-box-title">📋 Informazioni Importanti</div>
                <ul class="info-list">
                  <li>Questo link è <strong>valido per 24 ore</strong></li>
                  <li>Scegli una password sicura (minimo 8 caratteri)</li>
                  <li>Dopo aver impostato la password, potrai accedere immediatamente</li>
                  <li>Usa la tua email (<strong>${to}</strong>) come username</li>
                </ul>
              </div>

              <p class="message">
                Se hai domande o hai bisogno di assistenza, non esitare a contattare l'amministratore.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-text">
                Questa è un'email automatica, ti preghiamo di non rispondere.
              </div>
              <div class="footer-brand">
                Time Tracker © ${new Date().getFullYear()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Benvenuto su Time Tracker!

Ciao ${username}!

Siamo entusiasti di darti il benvenuto! Il tuo account è stato creato con successo.

🎯 INIZIAMO
Per completare la configurazione del tuo account, è necessario impostare una password personale.

Clicca sul link qui sotto per impostare la tua password:
${setupUrl}

📋 INFORMAZIONI IMPORTANTI:
- Questo link è valido per 24 ore
- Scegli una password sicura (minimo 8 caratteri)
- Dopo aver impostato la password, potrai accedere immediatamente
- Usa la tua email (${to}) come username

Se hai domande o hai bisogno di assistenza, non esitare a contattare l'amministratore.

---
Questa è un'email automatica, ti preghiamo di non rispondere.
Time Tracker © ${new Date().getFullYear()}
    `,
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
  resetUrl: string
) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Reimposta la tua password - Time Tracker",
    html: `
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
              background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #f3e8ff 100%);
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
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
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
              font-size: 28px;
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
              background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
              color: white !important;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2);
              transition: all 0.3s ease;
            }
            .button:hover {
              box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4), 0 10px 10px -5px rgba(37, 99, 235, 0.3);
              transform: translateY(-2px);
            }
            .link-fallback {
              margin-top: 20px;
              padding-top: 20px;
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
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
            }
            .info-box-title {
              font-weight: 600;
              color: #92400e;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .info-list {
              margin: 0;
              padding-left: 20px;
              color: #78350f;
              font-size: 14px;
            }
            .info-list li {
              margin: 8px 0;
            }
            .security-note {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 16px;
              margin-top: 24px;
              border-left: 4px solid #64748b;
            }
            .security-note-title {
              font-weight: 600;
              color: #334155;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .security-note-text {
              color: #475569;
              font-size: 13px;
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h1>Reimposta Password</h1>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Ciao ${username}! 👋</div>
              
              <p class="message">
                Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Time Tracker. 
                Nessun problema, succede a tutti!
              </p>

              <!-- CTA Box -->
              <div class="cta-box">
                <div class="cta-text">Clicca sul pulsante qui sotto per creare una nuova password:</div>
                <a href="${resetUrl}" class="button">
                  Reimposta la mia password
                </a>
                <div class="link-fallback">
                  Se il pulsante non funziona, copia e incolla questo link nel tuo browser:<br>
                  <a href="${resetUrl}">${resetUrl}</a>
                </div>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <div class="info-box-title">⏰ Informazioni importanti</div>
                <ul class="info-list">
                  <li>Questo link è <strong>valido per 1 ora</strong></li>
                  <li>Può essere utilizzato <strong>una sola volta</strong></li>
                  <li>Dopo il reset, dovrai effettuare il login con la nuova password</li>
                </ul>
              </div>

              <!-- Security Note -->
              <div class="security-note">
                <div class="security-note-title">🛡️ Non hai richiesto questo reset?</div>
                <div class="security-note-text">
                  Se non sei stato tu a richiedere la reimpostazione della password, ignora questa email 
                  e contatta immediatamente l'amministratore. Il tuo account rimane sicuro.
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-text">
                Questa è un'email automatica, ti preghiamo di non rispondere.
              </div>
              <div class="footer-brand">
                Time Tracker © ${new Date().getFullYear()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Reset Password

Ciao ${username},

Hai richiesto di reimpostare la password del tuo account Time Tracker.

Clicca sul link qui sotto per reimpostare la password:
${resetUrl}

⚠️ IMPORTANTE:
- Questo link è valido per 1 ora
- Dopo aver reimpostato la password, il link non sarà più utilizzabile
- Se non hai richiesto questo reset, ignora questa email

🛡️ Sicurezza:
Se non hai richiesto questo reset, contatta immediatamente l'amministratore.

---
Questo è un messaggio automatico, per favore non rispondere a questa email.
© ${new Date().getFullYear()} Time Tracker. Tutti i diritti riservati.
    `,
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

  const html = success
    ? `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10B981;">Backup Completato con Successo</h2>
        <p>Il backup del database è stato eseguito correttamente.</p>
        <p><strong>File:</strong> ${filename}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
        <p>Il file di backup è allegato a questa email.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #EF4444;">Errore durante il Backup</h2>
        <p>Si è verificato un errore durante l'esecuzione del backup del database.</p>
        <p><strong>Errore:</strong> ${errorMessage}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `;

  const mailOptions: any = {
    from: `"${process.env.EMAIL_FROM_NAME || "Time Tracker"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  if (success && filePath && filename) {
    mailOptions.attachments = [
      {
        filename: filename,
        path: filePath,
      },
    ];
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

