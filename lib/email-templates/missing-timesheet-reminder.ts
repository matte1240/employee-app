export const getMissingTimesheetReminderEmailTemplate = (
  username: string,
  missingDatesFormatted: string,
  dashboardUrl: string
) => {
  const html = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Ore mancanti</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  </head>
  <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:Arial,Helvetica,sans-serif; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;" bgcolor="#f1f5f9">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;" bgcolor="#f1f5f9">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff;" bgcolor="#ffffff">
            <!-- Header -->
            <tr>
              <td align="center" style="background-color:#d97706; padding:32px 30px;" bgcolor="#d97706">
                <img src="cid:logo-white" alt="Ivicolors" width="180" style="display:block; max-width:180px; height:auto; margin:0 auto 12px auto;" />
                <h1 style="color:#ffffff; font-size:24px; font-weight:700; margin:0; font-family:Arial,Helvetica,sans-serif; line-height:1.3;">Ore mancanti &#9888;&#65039;</h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:36px 30px; font-family:Arial,Helvetica,sans-serif;">
                <p style="font-size:18px; font-weight:600; color:#0f172a; margin:0 0 12px 0; line-height:1.4;">Ciao ${username}! &#128075;</p>
                <p style="color:#475569; margin:0 0 20px 0; font-size:15px; line-height:1.6;">
                  Ti scriviamo perch&eacute; ci sono alcuni giorni senza ore registrate.
                  Niente di grave, basta un attimo per sistemarli!
                </p>

                <!-- Warning box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
                  <tr>
                    <td style="background-color:#fef3c7; border:2px solid #fcd34d; border-radius:12px; padding:20px;" bgcolor="#fef3c7">
                      <p style="color:#92400e; font-size:15px; font-weight:600; margin:0 0 10px 0; font-family:Arial,Helvetica,sans-serif;">&#128197; Giorni da completare:</p>
                      <p style="color:#78350f; font-size:14px; margin:0; line-height:1.6; font-family:Arial,Helvetica,sans-serif;">
                        ${missingDatesFormatted}
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CTA box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
                  <tr>
                    <td style="background-color:#f8fafc; border:2px solid #e2e8f0; border-radius:12px; padding:28px; text-align:center;" bgcolor="#f8fafc">
                      <p style="color:#334155; font-size:15px; font-weight:600; margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif;">Vai al calendario e compila le ore mancanti:</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td align="center" style="background-color:#d97706; border-radius:10px;" bgcolor="#d97706">
                            <a href="${dashboardUrl}" style="display:inline-block; padding:14px 28px; color:#ffffff; text-decoration:none; font-weight:600; font-size:15px; font-family:Arial,Helvetica,sans-serif;">Apri il calendario</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Info box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
                  <tr>
                    <td style="background-color:#eff6ff; border-left:4px solid #3b82f6; border-radius:8px; padding:16px;" bgcolor="#eff6ff">
                      <p style="font-weight:600; color:#1e40af; margin:0 0 8px 0; font-size:14px; font-family:Arial,Helvetica,sans-serif;">&#128203; Promemoria veloce</p>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="color:#1e3a8a; font-size:14px; font-family:Arial,Helvetica,sans-serif;">
                        <tr><td style="padding:3px 0; line-height:1.5;">&bull; Puoi modificare le ore del <strong>mese corrente</strong></td></tr>
                        <tr><td style="padding:3px 0; line-height:1.5;">&bull; Ricordati di segnare anche straordinari e assenze</td></tr>
                        <tr><td style="padding:3px 0; line-height:1.5;">&bull; Se eri in ferie o malattia, registra anche quelle</td></tr>
                        <tr><td style="padding:3px 0; line-height:1.5;">&bull; Per qualsiasi problema, chiedi all'amministratore</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="color:#475569; margin:0; font-size:15px; line-height:1.6;">
                  Se hai gi&agrave; inserito tutto o quei giorni erano festivi, ignora pure questa email. &#128522;
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f8fafc; padding:24px 30px; text-align:center; border-top:1px solid #e2e8f0;" bgcolor="#f8fafc">
                <p style="color:#94a3b8; font-size:12px; margin:0 0 4px 0; font-family:Arial,Helvetica,sans-serif;">Email automatica &mdash; non rispondere a questo messaggio</p>
                <p style="color:#334155; font-weight:600; font-size:13px; margin:8px 0 0 0; font-family:Arial,Helvetica,sans-serif;">Presenze Ivicolors &copy; ${new Date().getFullYear()}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
