"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export type TimeEntryDTO = {
  id: string;
  workDate: string;
  hoursWorked: number;
  overtimeHours?: number;
  morningStart?: string | null;
  morningEnd?: string | null;
  afternoonStart?: string | null;
  afternoonEnd?: string | null;
  notes?: string | null;
};

type EmployeeDashboardProps = {
  initialEntries: TimeEntryDTO[];
  userName: string;
  hideHeader?: boolean; // If true, hide the header (for embedded views)
  targetUserId?: string; // If set, admin is editing this user's calendar
  onEntrySaved?: () => void; // Callback when entry is saved/deleted (for admin refetch)
};

type ModalFormState = {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  notes: string;
};

// Helper function to calculate hours between two times
function calculateHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

// Generate time options from 06:00 to 21:00 with 30-minute intervals
function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    options.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 21) {
      options.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export default function EmployeeDashboard({
  initialEntries,
  userName,
  hideHeader = false,
  targetUserId,
  onEntrySaved,
}: EmployeeDashboardProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [entries, setEntries] = useState<TimeEntryDTO[]>(initialEntries);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const hasFetched = useRef(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState<ModalFormState>({
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:30",
    notes: "",
  });

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      return;
    }

    const controller = new AbortController();
    const fetchEntries = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
        const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
        const url = targetUserId
          ? `/api/hours?userId=${targetUserId}&from=${from}&to=${to}`
          : `/api/hours?from=${from}&to=${to}`;
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (response.status === 401) {
          router.push("/");
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error ?? "Failed to load entries.");
          return;
        }

        setEntries(payload as TimeEntryDTO[]);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unexpected error while loading entries.");
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchEntries();

    return () => controller.abort();
  }, [currentMonth, router, targetUserId]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDTO[]>();
    for (const entry of entries) {
      const key = entry.workDate; // Already in YYYY-MM-DD format
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }

    for (const [, bucket] of map) {
      bucket.sort((a, b) => a.workDate.localeCompare(b.workDate));
    }

    return map;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const totalHours = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.hoursWorked, 0),
    [entries]
  );

  const totalOvertime = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.overtimeHours ?? 0), 0),
    [entries]
  );

  // Calculate hours from modal form
  const calculatedHours = useMemo(() => {
    const morning = calculateHours(modalForm.morningStart, modalForm.morningEnd);
    const afternoon = calculateHours(modalForm.afternoonStart, modalForm.afternoonEnd);
    const total = morning + afternoon;
    const regular = Math.min(total, 8);
    const overtime = Math.max(0, total - 8);
    return { morning, afternoon, total, regular, overtime };
  }, [modalForm]);

  // Check if date is editable
  const isDateEditable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return checkDate >= currentMonthStart && checkDate <= today;
  };

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    if (!isDateEditable(day)) {
      setError("Can only enter hours for the current month up to today.");
      return;
    }

    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate(dateStr);

    // Check if entry exists for this day and pre-fill
    const existingEntry = entries.find(e => e.workDate === dateStr);
    if (existingEntry) {
      setModalForm({
        morningStart: existingEntry.morningStart || "08:00",
        morningEnd: existingEntry.morningEnd || "12:00",
        afternoonStart: existingEntry.afternoonStart || "14:00",
        afternoonEnd: existingEntry.afternoonEnd || "18:30",
        notes: existingEntry.notes || "",
      });
    } else {
      setModalForm({
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:30",
        notes: "",
      });
    }
    
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError(null);

    if (calculatedHours.total === 0) {
      setModalError("Please enter valid work hours.");
      return;
    }

    if (!selectedDate) return;

    const payload = {
      workDate: selectedDate,
      hoursWorked: calculatedHours.regular,
      overtimeHours: calculatedHours.overtime,
      morningStart: modalForm.morningStart || undefined,
      morningEnd: modalForm.morningEnd || undefined,
      afternoonStart: modalForm.afternoonStart || undefined,
      afternoonEnd: modalForm.afternoonEnd || undefined,
      notes: modalForm.notes.trim() || undefined,
      ...(targetUserId && { userId: targetUserId }), // Add userId if admin is editing another user
    };

    startSaving(async () => {
      try {
        const response = await fetch("/api/hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setModalError(data?.error ?? "Unable to save entry.");
          return;
        }

        setEntries((current) => {
          // Remove existing entry for this date if any
          const filtered = current.filter(e => e.workDate !== selectedDate);
          return [...filtered, data as TimeEntryDTO];
        });

        setIsModalOpen(false);
        router.refresh();
        onEntrySaved?.(); // Trigger refetch in admin dashboard
      } catch {
        setModalError("Unexpected error while saving entry.");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedDate) return;

    const entry = entries.find(e => e.workDate === selectedDate);
    if (!entry) return;

    if (!confirm("Are you sure you want to delete this entry?")) return;

    setModalError(null);

    startSaving(async () => {
      try {
        const response = await fetch(`/api/hours?id=${entry.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          setModalError(data?.error ?? "Unable to delete entry.");
          return;
        }

        setEntries((current) => current.filter(e => e.id !== entry.id));
        setIsModalOpen(false);
        router.refresh();
        onEntrySaved?.(); // Trigger refetch in admin dashboard
      } catch {
        setModalError("Unexpected error while deleting entry.");
      }
    });
  };

  return (
    <div>
      {/* Header with logo - hide in embedded views */}
      {!hideHeader && (
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-8">
              <img
                src="/logo.svg"
                alt="Ivicolors"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Welcome, {userName.split(" ")[0] ?? userName}
                </h1>
                <p className="text-sm text-gray-500">
                  Track your work hours
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Month Total</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-gray-500">hours worked</p>
              </div>
              <div className="rounded-full bg-blue-50 p-3">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {totalOvertime > 0 && (
            <div className="rounded-xl border border-orange-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overtime</p>
                  <p className="mt-2 text-3xl font-bold text-orange-600">{totalOvertime.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">extra hours</p>
                </div>
                <div className="rounded-full bg-orange-50 p-3">
                  <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Days Logged</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{entries.length}</p>
                <p className="text-xs text-gray-500">this month</p>
              </div>
              <div className="rounded-full bg-green-50 p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Calendar section */}
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                {isFetching && <p className="text-xs text-gray-500">Refreshing calendar...</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                >
                  &#8592;
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                >
                  &#8594;
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const bucket = entriesByDay.get(key);
                const dayEntry = bucket?.[0];
                const regularHours = dayEntry?.hoursWorked ?? 0;
                const overtimeHours = dayEntry?.overtimeHours ?? 0;
                const totalHours = regularHours + overtimeHours;
                const hasEntries = Boolean(dayEntry);
                const highlight = isSameDay(day, new Date());
                const editable = isDateEditable(day) && isSameMonth(day, currentMonth);

                return (
                  <button
                    key={key}
                    onClick={() => handleDayClick(day)}
                    disabled={!editable}
                    className={`flex min-h-[80px] sm:min-h-[100px] flex-col rounded-lg sm:rounded-xl border p-2 sm:p-3 text-left transition ${
                      isSameMonth(day, currentMonth)
                        ? editable
                          ? "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer hover:scale-105"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "border-dashed border-gray-200 bg-gray-50/50 text-gray-300"
                    } ${highlight ? "ring-2 ring-blue-400 shadow-md" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs sm:text-sm font-semibold ${highlight ? "text-blue-600" : "text-gray-700"}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                    {hasEntries ? (
                      <div className="flex-1 flex flex-col justify-center items-center gap-1.5">
                        <div className="flex flex-col items-center">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-tight">
                            {totalHours.toFixed(1)}
                          </div>
                          <div className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">
                            hours
                          </div>
                        </div>
                        {dayEntry?.notes && (
                          <div className="text-[10px] sm:text-xs text-gray-500 italic line-clamp-2 break-words px-1 text-center">
                            {dayEntry.notes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs text-gray-300">
                          {editable ? "+" : ""}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleModalSubmit} className="flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                <h2 className="text-lg font-semibold text-white">
                  {selectedDate && format(new Date(`${selectedDate}T12:00:00`), "EEEE, MMM d, yyyy")}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-5 p-6">
                {/* Morning shift */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h3 className="text-sm font-bold text-blue-900">Morning Shift</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-blue-800">Start time</span>
                      <select
                        value={modalForm.morningStart}
                        onChange={(e) => setModalForm(f => ({ ...f, morningStart: e.target.value }))}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={`morning-start-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-blue-800">End time</span>
                      <select
                        value={modalForm.morningEnd}
                        onChange={(e) => setModalForm(f => ({ ...f, morningEnd: e.target.value }))}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={`morning-end-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-blue-700">Duration:</span>
                    <span className="font-bold text-blue-900">{calculatedHours.morning.toFixed(2)} hours</span>
                  </p>
                </div>

                {/* Afternoon shift */}
                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <h3 className="text-sm font-bold text-orange-900">Afternoon Shift</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-orange-800">Start time</span>
                      <select
                        value={modalForm.afternoonStart}
                        onChange={(e) => setModalForm(f => ({ ...f, afternoonStart: e.target.value }))}
                        className="rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 cursor-pointer"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={`afternoon-start-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-orange-800">End time</span>
                      <select
                        value={modalForm.afternoonEnd}
                        onChange={(e) => setModalForm(f => ({ ...f, afternoonEnd: e.target.value }))}
                        className="rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 cursor-pointer"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={`afternoon-end-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-orange-700">Duration:</span>
                    <span className="font-bold text-orange-900">{calculatedHours.afternoon.toFixed(2)} hours</span>
                  </p>
                </div>

                {/* Summary */}
                <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total hours:</span>
                      <span className="text-2xl font-bold text-blue-600">{calculatedHours.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-blue-100 pt-2">
                      <span className="font-medium text-gray-600">Regular hours:</span>
                      <span className="font-bold text-gray-900">{calculatedHours.regular.toFixed(2)}</span>
                    </div>
                    {calculatedHours.overtime > 0 && (
                      <div className="flex justify-between items-center border-t border-orange-100 pt-2">
                        <span className="font-medium text-orange-700">Overtime:</span>
                        <span className="font-bold text-orange-600">{calculatedHours.overtime.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Notes (optional)</span>
                  <textarea
                    value={modalForm.notes}
                    onChange={(e) => setModalForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Add any notes about your work..."
                    rows={3}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  />
                </label>

                {modalError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">{modalError}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
                {/* Show delete button only if entry exists */}
                {selectedDate && entries.find(e => e.workDate === selectedDate) && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="rounded-lg border-2 border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Deleting..." : "Delete"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || calculatedHours.total === 0}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400"
                >
                  {isSaving ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
