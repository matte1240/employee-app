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
  startTime?: string;
  endTime?: string;
  user: {
    name: string | null;
    email: string;
  };
};

export default function PendingRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LeaveRequest>>({});

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests?status=PENDING");
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
  }, []);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== id));
      } else {
        alert("Failed to update request status");
      }
    } catch (error) {
      console.error("Error updating request", error);
    }
  };

  const startEdit = (req: LeaveRequest) => {
    setEditingId(req.id);
    setEditForm({
      startDate: req.startDate.split('T')[0],
      endDate: req.endDate.split('T')[0],
      type: req.type,
      reason: req.reason,
      startTime: req.startTime,
      endTime: req.endTime,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        await fetchRequests();
        setEditingId(null);
        setEditForm({});
      } else {
        const error = await res.text();
        alert(`Failed to update request: ${error}`);
      }
    } catch (error) {
      console.error("Error updating request", error);
      alert("Error updating request");
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa richiesta?")) return;
    
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== id));
      } else {
        alert("Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request", error);
    }
  };

  if (isLoading) return <div>Loading requests...</div>;
  if (requests.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Richieste in Attesa
      </h2>
      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="rounded-lg border border-gray-100 bg-gray-50 p-4"
          >
            {editingId === req.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Data Inizio
                    </label>
                    <input
                      type="date"
                      className="w-full rounded border border-gray-300 p-2 text-sm"
                      value={editForm.startDate || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Data Fine
                    </label>
                    <input
                      type="date"
                      className="w-full rounded border border-gray-300 p-2 text-sm"
                      value={editForm.endDate || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endDate: e.target.value })
                      }
                      disabled={editForm.type === "PERMESSO"}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    className="w-full rounded border border-gray-300 p-2 text-sm"
                    value={editForm.type || ""}
                    onChange={(e) =>
                      setEditForm({ 
                        ...editForm, 
                        type: e.target.value as any,
                        endDate: e.target.value === "PERMESSO" ? editForm.startDate : editForm.endDate 
                      })
                    }
                  >
                    <option value="VACATION">Ferie</option>
                    <option value="PERMESSO">Permesso</option>
                    <option value="SICKNESS">Malattia</option>
                  </select>
                </div>
                {editForm.type === "PERMESSO" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Ora Inizio
                      </label>
                      <input
                        type="time"
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        value={editForm.startTime || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, startTime: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Ora Fine
                      </label>
                      <input
                        type="time"
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        value={editForm.endTime || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Motivazione
                  </label>
                  <textarea
                    className="w-full rounded border border-gray-300 p-2 text-sm"
                    rows={2}
                    value={editForm.reason || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, reason: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(req.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Salva
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    {req.user.name || req.user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {req.type} • {format(new Date(req.startDate), "d MMM", { locale: it })} -{" "}
                    {format(new Date(req.endDate), "d MMM yyyy", { locale: it })}
                    {req.type === "PERMESSO" && req.startTime && req.endTime && (
                      <span className="ml-2 text-xs">
                        ({req.startTime} - {req.endTime})
                      </span>
                    )}
                  </p>
                  {req.reason && (
                    <p className="mt-1 text-xs text-gray-500">
                      "{req.reason}"
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(req)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "APPROVED")}
                    className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
                  >
                    Approva
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "REJECTED")}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Rifiuta
                  </button>
                  <button
                    onClick={() => deleteRequest(req.id)}
                    className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
