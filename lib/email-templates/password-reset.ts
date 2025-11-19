export const getPasswordResetEmailTemplate = (
  username: string,
  newPassword: string,
  loginUrl: string
) => {
  const html = `
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
                <a href="${loginUrl}" class="button">
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
    `;

  const text = `
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

Accedi a: ${loginUrl}

⚠️ Se non hai richiesto questo reset:
Contatta immediatamente l'amministratore - il tuo account potrebbe essere compromesso.
    `;

  return { html, text };
};
