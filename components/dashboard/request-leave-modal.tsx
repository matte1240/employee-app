"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

const VALID_TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
];

type RequestLeaveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editRequest?: {
    id: string;
    startDate: string;
    endDate: string;
    type: "VACATION" | "SICKNESS" | "PERMESSO";
    reason?: string;
    startTime?: string;
    endTime?: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
};

export default function RequestLeaveModal({ isOpen, onClose, editRequest }: RequestLeaveModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "VACATION" as "VACATION" | "SICKNESS" | "PERMESSO",
    reason: "",
    startTime: "",
    endTime: "",
    status: "PENDING" as "PENDING" | "APPROVED" | "REJECTED",
  });

  // Update form when editRequest changes
  useEffect(() => {
    if (editRequest) {
      setFormData({
        startDate: editRequest.startDate.split('T')[0],
        endDate: editRequest.endDate.split('T')[0],
        type: editRequest.type,
        reason: editRequest.reason || "",
        startTime: editRequest.startTime || "",
        endTime: editRequest.endTime || "",
        status: editRequest.status,
      });
    } else {
      setFormData({
        startDate: "",
        endDate: "",
        type: "VACATION",
        reason: "",
        startTime: "",
        endTime: "",
        status: "PENDING",
      });
    }
  }, [editRequest, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const url = editRequest ? `/api/requests/${editRequest.id}` : "/api/requests";
        const method = editRequest ? "PUT" : "POST";
        
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }

        setSuccess(editRequest ? "Richiesta aggiornata con successo!" : "Richiesta inviata con successo!");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          {editRequest ? "Modifica Richiesta" : "Richiedi Ferie/Permesso"}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-100 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Data Inizio
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    startDate: newStartDate,
                    // If type is PERMESSO, force endDate to match startDate
                    endDate: prev.type === "PERMESSO" ? newStartDate : prev.endDate,
                  }));
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Data Fine
              </label>
              <input
                type="date"
                required
                disabled={formData.type === "PERMESSO"}
                className={`w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  formData.type === "PERMESSO" ? "bg-gray-100 text-gray-500" : ""
                }`}
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Tipo Richiesta
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as "VACATION" | "PERMESSO";
                setFormData((prev) => ({
                  ...prev,
                  type: newType,
                  // If switching to PERMESSO, sync endDate with startDate
                  endDate: newType === "PERMESSO" ? prev.startDate : prev.endDate,
                }));
              }}
            >
              <option value="VACATION">Ferie</option>
              <option value="PERMESSO">Permesso</option>
            </select>
          </div>

          {formData.type === "PERMESSO" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Ora Inizio
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                >
                  <option value="">Seleziona orario</option>
                  {VALID_TIME_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Ora Fine
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                >
                  <option value="">Seleziona orario</option>
                  {VALID_TIME_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {editRequest && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Stato
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
              >
                <option value="PENDING">In Attesa</option>
                <option value="APPROVED">Approvata</option>
                <option value="REJECTED">Rifiutata</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-900">
              Motivazione (opzionale)
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Inserisci note aggiuntive..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              disabled={isPending}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Salvataggio..." : editRequest ? "Salva Modifiche" : "Invia Richiesta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
