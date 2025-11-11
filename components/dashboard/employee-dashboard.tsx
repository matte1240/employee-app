"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
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
        const response = await fetch(`/api/hours?from=${from}&to=${to}`, {
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
  }, [currentMonth, router]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, TimeEntryDTO[]>();
    for (const entry of entries) {
      const key = format(parseISO(entry.workDate), "yyyy-MM-dd");
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }

    for (const [, bucket] of map) {
      bucket.sort((a, b) => parseISO(a.workDate).getTime() - parseISO(b.workDate).getTime());
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
    const existingEntry = entries.find(e => format(parseISO(e.workDate), "yyyy-MM-dd") === dateStr);
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
          const filtered = current.filter(e => format(parseISO(e.workDate), "yyyy-MM-dd") !== selectedDate);
          return [...filtered, data as TimeEntryDTO];
        });
        
        setIsModalOpen(false);
        router.refresh();
      } catch {
        setModalError("Unexpected error while saving entry.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-zinc-900">
            Welcome, {userName.split(" ")[0] ?? userName}
          </h1>
          <p className="text-sm text-zinc-500">
            Click on any day to log your work hours.
          </p>
          <div className="flex gap-4 text-sm font-medium text-zinc-600">
            <p>
              Month total: <span className="font-semibold text-blue-600">{totalHours.toFixed(1)}</span> hrs
            </p>
            {totalOvertime > 0 && (
              <p>
                Overtime: <span className="font-semibold text-orange-600">{totalOvertime.toFixed(1)}</span> hrs
              </p>
            )}
          </div>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-800">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            {isFetching && <p className="text-xs text-zinc-500">Refreshing calendar...</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentMonth((month) => addMonths(month, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              &gt;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const bucket = entriesByDay.get(key);
            const dayEntry = bucket?.[0];
            const totalForDay = dayEntry?.hoursWorked ?? 0;
            const overtimeForDay = dayEntry?.overtimeHours ?? 0;
            const hasEntries = Boolean(dayEntry);
            const highlight = isSameDay(day, new Date());
            const editable = isDateEditable(day) && isSameMonth(day, currentMonth);

            return (
              <button
                key={key}
                onClick={() => handleDayClick(day)}
                disabled={!editable}
                className={`flex min-h-[86px] flex-col rounded-xl border p-2 text-left text-xs transition ${
                  isSameMonth(day, currentMonth)
                    ? editable
                      ? "border-zinc-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer"
                      : "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                    : "border-dashed border-zinc-200 bg-zinc-50 text-zinc-400"
                } ${highlight ? "ring-2 ring-blue-200" : ""}`}
              >
                <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
                  <span>{format(day, "d")}</span>
                  {hasEntries && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      {totalForDay.toFixed(1)}h
                    </span>
                  )}
                </div>
                {hasEntries ? (
                  <div className="mt-1 space-y-1 text-[11px] text-zinc-600">
                    <div className="truncate">Regular: {totalForDay.toFixed(1)}h</div>
                    {overtimeForDay > 0 && (
                      <div className="truncate text-orange-600">OT: {overtimeForDay.toFixed(1)}h</div>
                    )}
                    {dayEntry?.notes && (
                      <div className="truncate text-zinc-400">{dayEntry.notes}</div>
                    )}
                  </div>
                ) : (
                  <div className="mt-auto text-[10px] text-zinc-300">Click to add</div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">
                  {selectedDate && format(parseISO(selectedDate), "EEEE, MMM d, yyyy")}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="rounded-lg bg-zinc-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Morning</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                    Start
                    <select
                      value={modalForm.morningStart}
                      onChange={(e) => setModalForm(f => ({ ...f, morningStart: e.target.value }))}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`morning-start-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                    End
                    <select
                      value={modalForm.morningEnd}
                      onChange={(e) => setModalForm(f => ({ ...f, morningEnd: e.target.value }))}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`morning-end-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Hours: {calculatedHours.morning.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg bg-zinc-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-zinc-700">Afternoon</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                    Start
                    <select
                      value={modalForm.afternoonStart}
                      onChange={(e) => setModalForm(f => ({ ...f, afternoonStart: e.target.value }))}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`afternoon-start-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                    End
                    <select
                      value={modalForm.afternoonEnd}
                      onChange={(e) => setModalForm(f => ({ ...f, afternoonEnd: e.target.value }))}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                    >
                      {TIME_OPTIONS.map(time => (
                        <option key={`afternoon-end-${time}`} value={time}>{time}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Hours: {calculatedHours.afternoon.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-200 bg-blue-50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-700">Total hours:</span>
                  <span className="font-semibold text-blue-600">{calculatedHours.total.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="font-medium text-zinc-700">Regular:</span>
                  <span className="font-semibold text-zinc-900">{calculatedHours.regular.toFixed(2)}</span>
                </div>
                {calculatedHours.overtime > 0 && (
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="font-medium text-zinc-700">Overtime:</span>
                    <span className="font-semibold text-orange-600">{calculatedHours.overtime.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
                Notes (optional)
                <textarea
                  value={modalForm.notes}
                  onChange={(e) => setModalForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Add any notes about your work..."
                  rows={3}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                />
              </label>

              {modalError && <p className="text-xs text-red-500">{modalError}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || calculatedHours.total === 0}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
