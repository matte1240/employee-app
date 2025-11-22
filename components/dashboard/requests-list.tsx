"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type LeaveRequest = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: "VACATION" | "SICKNESS" | "PERMESSO";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  user: {
    name: string | null;
    email: string;
  };
};

type RequestsListProps = {
  isAdmin: boolean;
  userId?: string;
};

export default function RequestsList({ isAdmin, userId }: RequestsListProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      let url = "/api/requests?";
      if (filterStatus !== "ALL") {
        url += `status=${filterStatus}&`;
      }
      // If not admin, the API automatically filters by current user
      // If admin, we can optionally filter by userId if provided (though for the main list we might want all)
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Sei sicuro di voler impostare lo stato a ${status}?`)) return;
    
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        // Refresh list
        fetchRequests();
      } else {
        const msg = await res.text();
        alert(`Errore: ${msg}`);
      }
    } catch (error) {
      console.error("Error updating request", error);
      alert("Errore di connessione");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Approvata</span>;
      case "REJECTED":
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Rifiutata</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">In Attesa</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "VACATION": return "Ferie";
      case "SICKNESS": return "Malattia";
      case "PERMESSO": return "Permesso";
      default: return type;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Gestione Richieste
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? "Gestisci le richieste di ferie e permessi dei dipendenti."
              : "Visualizza lo stato delle tue richieste di ferie e permessi."}
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">Tutti gli stati</option>
          <option value="PENDING">In Attesa</option>
          <option value="APPROVED">Approvate</option>
          <option value="REJECTED">Rifiutate</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Caricamento...</div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Nessuna richiesta trovata.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Utente
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Periodo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Motivazione
                </th>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Azioni
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {requests.map((req) => (
                <tr key={req.id}>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {req.user.name || req.user.email}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {getTypeLabel(req.type)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {format(new Date(req.startDate), "d MMM", { locale: it })} -{" "}
                    {format(new Date(req.endDate), "d MMM yyyy", { locale: it })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={req.reason}>
                    {req.reason || "-"}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {req.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(req.id, "APPROVED")}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approva
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "REJECTED")}
                            className="text-red-600 hover:text-red-900"
                          >
                            Rifiuta
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
