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

export default function PendingRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            className="flex flex-col justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
          >
            <div>
              <p className="font-medium text-gray-900">
                {req.user.name || req.user.email}
              </p>
              <p className="text-sm text-gray-500">
                {req.type} • {format(new Date(req.startDate), "d MMM", { locale: it })} -{" "}
                {format(new Date(req.endDate), "d MMM yyyy", { locale: it })}
              </p>
              {req.reason && (
                <p className="mt-1 text-xs text-gray-500">
                  "{req.reason}"
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(req.id, "APPROVED")}
                className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(req.id, "REJECTED")}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
