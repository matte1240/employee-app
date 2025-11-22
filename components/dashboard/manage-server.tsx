"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Backup {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
}

export function ManageServer() {
  const router = useRouter();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/db/list");

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch backups");
      }

      setBackups(data.backups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load backups");
      console.error("Error fetching backups:", err);
    }
  }, [router]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/db/backup", {
        method: "POST",
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create backup");
      }

      setSuccess(`Backup creato con successo: ${data.filename}`);
      await fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create backup");
      console.error("Error creating backup:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/db/backup?filename=${encodeURIComponent(filename)}`
      );

      if (response.status === 401) {
        router.push("/");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to download backup");
      }

      // Create a blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Backup scaricato: ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download backup");
      console.error("Error downloading backup:", err);
    }
  };

  const handleRestoreBackup = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".sql")) {
      setError("Solo file .sql sono permessi");
      return;
    }

    const confirmed = window.confirm(
      `⚠️ ATTENZIONE: Il ripristino del database sovrascriverà tutti i dati attuali!\n\n` +
        `Vuoi davvero ripristinare il backup "${file.name}"?\n\n` +
        `Questa operazione non può essere annullata.`
    );

    if (!confirmed) {
      event.target.value = ""; // Reset file input
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/db/restore", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to restore backup");
      }

      setSuccess(`Database ripristinato con successo da: ${file.name}`);
      await fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore backup");
      console.error("Error restoring backup:", err);
    } finally {
      setLoading(false);
      event.target.value = ""; // Reset file input
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("it-IT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Gestione Server
          </h1>

          {/* Alerts */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">
                  <strong>Errore:</strong> {error}
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-800">
                  <strong>Successo:</strong> {success}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Azioni Database
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Backup */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Crea Backup
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Crea un dump completo del database PostgreSQL
                </p>
                <button
                  onClick={handleCreateBackup}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Creazione in corso..." : "Crea Backup"}
                </button>
              </div>

              {/* Restore Backup */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Ripristina Database
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Carica un file .sql per ripristinare il database
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".sql"
                    onChange={handleRestoreBackup}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Attenzione: questa operazione sovrascriverà tutti i dati!
                </p>
              </div>
            </div>
          </div>

          {/* Backups List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Backup Disponibili ({backups.length})
              </h2>
              <button
                onClick={fetchBackups}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Aggiorna Lista
              </button>
            </div>

            {backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nessun backup disponibile</p>
                <p className="text-sm mt-2">
                  Crea il primo backup usando il pulsante sopra
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dimensione
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Creazione
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backups.map((backup) => (
                      <tr key={backup.filename} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {backup.filename}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {backup.sizeFormatted}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(backup.created)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDownloadBackup(backup.filename)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Scarica
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
