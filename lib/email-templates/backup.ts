export const getBackupEmailTemplate = (
  success: boolean,
  filename?: string,
  errorMessage?: string
) => {
  const html = success
    ? `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="Ivicolors" width="80" height="80" style="display:inline-block;" />
        </div>
        <h2 style="color: #10B981;">Backup Completato con Successo</h2>
        <p>Il backup del database è stato eseguito correttamente.</p>
        <p><strong>File:</strong> ${filename}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
        <p>Il file di backup è allegato a questa email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Presenze Ivicolors &copy; ${new Date().getFullYear()}</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:logo" alt="Ivicolors" width="80" height="80" style="display:inline-block;" />
        </div>
        <h2 style="color: #EF4444;">Errore durante il Backup</h2>
        <p>Si è verificato un errore durante l'esecuzione del backup del database.</p>
        <p><strong>Errore:</strong> ${errorMessage}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">Presenze Ivicolors &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

  return { html };
};
