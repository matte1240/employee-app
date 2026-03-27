export const getBackupEmailTemplate = (
  success: boolean,
  filename?: string,
  errorMessage?: string
) => {
  const statusGradient = success
    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";

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
              background: ${statusGradient};
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
            .message {
              color: #475569;
              margin-bottom: 20px;
              font-size: 15px;
            }
            .detail-box {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .detail-label {
              color: #64748b;
              font-weight: 600;
              min-width: 80px;
            }
            .detail-value {
              color: #1e293b;
              font-weight: 500;
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
              <h1>${success ? "Backup completato ✅" : "Errore backup ❌"}</h1>
            </div>

            <div class="content">
              <p class="message">
                ${success
                  ? "Il backup del database è andato a buon fine! Trovi il file in allegato."
                  : "Purtroppo qualcosa è andato storto durante il backup del database."
                }
              </p>

              <div class="detail-box">
                ${success
                  ? `<div class="detail-row">
                      <span class="detail-label">File:</span>
                      <span class="detail-value">${filename}</span>
                    </div>`
                  : `<div class="detail-row">
                      <span class="detail-label">Errore:</span>
                      <span class="detail-value">${errorMessage}</span>
                    </div>`
                }
                <div class="detail-row">
                  <span class="detail-label">Data:</span>
                  <span class="detail-value">${new Date().toLocaleString("it-IT")}</span>
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

  return { html };
};
