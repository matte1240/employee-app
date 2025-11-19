export const getWelcomeEmailTemplate = (
  username: string,
  temporaryPassword: string,
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
                <a href="${loginUrl}" class="button">
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
    `;

  const text = `
Benvenuto ${username}!

Il tuo account è stato creato con successo.

Credenziali di accesso:
Username: ${username}
Password temporanea: ${temporaryPassword}

⚠️ IMPORTANTE:
- Questa è una password temporanea
- Ti consigliamo di cambiarla al primo accesso
- Puoi modificare la password dalla sezione "Profilo"

Accedi a: ${loginUrl}

Se hai domande o problemi, contatta l'amministratore.
    `;

  return { html, text };
};
