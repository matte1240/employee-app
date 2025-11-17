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
  permessoHours?: number;
  sicknessHours?: number;
  vacationHours?: number;
  morningStart?: string | null;
  morningEnd?: string | null;
  afternoonStart?: string | null;
  afternoonEnd?: string | null;
  medicalCertificate?: string | null;
  notes?: string | null;
};

type EmployeeDashboardProps = {
  initialEntries: TimeEntryDTO[];
  userName: string;
  hideHeader?: boolean; // If true, hide the header (for embedded views)
  hideStats?: boolean; // If true, hide the stats cards (for admin views with separate totals)
  targetUserId?: string; // If set, admin is editing this user's calendar
  onEntrySaved?: (updatedEntries: TimeEntryDTO[]) => void; // Callback when entry is saved/deleted (for admin refetch)
  isAdmin?: boolean; // If true, bypass Sunday restriction
};

type ModalFormState = {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  notes: string;
  dayType: "normal" | "ferie" | "malattia";
  medicalCertificate: string;
  isMorningPermesso: boolean;
  isAfternoonPermesso: boolean;
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
  hideStats = false,
  targetUserId,
  onEntrySaved,
  isAdmin = false,
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
  const [isRefetching, setIsRefetching] = useState(false);
  const [modalForm, setModalForm] = useState<ModalFormState>({
    morningStart: "08:00",
    morningEnd: "12:00",
    afternoonStart: "14:00",
    afternoonEnd: "18:30",
    notes: "",
    dayType: "normal",
    medicalCertificate: "",
    isMorningPermesso: false,
    isAfternoonPermesso: false,
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, date: string, visible: boolean} | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu?.visible]);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);

  // Reset times and notes when switching to normal, ferie, or malattia
  useEffect(() => {
    if (modalForm.dayType === "normal") {
      setModalForm(f => ({
        ...f,
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:30",
        notes: "",
        isMorningPermesso: false,
        isAfternoonPermesso: false,
      }));
    } else if (modalForm.dayType === "ferie" || modalForm.dayType === "malattia") {
      setModalForm(f => ({
        ...f,
        notes: "",
      }));
    }
  }, [modalForm.dayType]);

  // Refetch entries when needed
  useEffect(() => {
    if (!isRefetching) return;

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
        onEntrySaved?.(payload as TimeEntryDTO[]);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Unexpected error while loading entries.");
        }
      } finally {
        setIsFetching(false);
        setIsRefetching(false);
      }
    };

    fetchEntries();

    return () => controller.abort();
  }, [isRefetching, currentMonth, router, targetUserId]);

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
        onEntrySaved?.(payload as TimeEntryDTO[]);
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
    () => entries.reduce((sum, entry) => sum + entry.hoursWorked + (entry.overtimeHours ?? 0), 0),
    [entries]
  );

  const totalOvertime = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.overtimeHours ?? 0), 0),
    [entries]
  );

  const totalPermesso = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.permessoHours ?? 0), 0),
    [entries]
  );

  const totalSickness = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.sicknessHours ?? 0), 0),
    [entries]
  );

  const totalVacation = useMemo(
    () => entries.reduce((sum, entry) => sum + (entry.vacationHours ?? 0), 0),
    [entries]
  );

  // Calculate hours from modal form
  const calculatedHours = useMemo(() => {
    const morningWorked = modalForm.isMorningPermesso ? 0 : calculateHours(modalForm.morningStart, modalForm.morningEnd);
    const afternoonWorked = modalForm.isAfternoonPermesso ? 0 : calculateHours(modalForm.afternoonStart, modalForm.afternoonEnd);
    
    const totalWorked = morningWorked + afternoonWorked;
    
    const permesso = (modalForm.isMorningPermesso ? 4 : 0) + (modalForm.isAfternoonPermesso ? 4 : 0);
    
    const regular = Math.min(totalWorked, 8);
    const overtime = Math.max(0, totalWorked - 8);

    return { morning: modalForm.isMorningPermesso ? 4 : morningWorked, afternoon: modalForm.isAfternoonPermesso ? 4 : afternoonWorked, totalWorked, regular, overtime, permesso };
  }, [modalForm.morningStart, modalForm.morningEnd, modalForm.afternoonStart, modalForm.afternoonEnd, modalForm.isMorningPermesso, modalForm.isAfternoonPermesso]);

  // Check if date is editable
  const isDateEditable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Block Sundays (0 = Sunday) only for employees
    if (!isAdmin) {
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0) {
        return false;
      }
    }
    
    return checkDate >= currentMonthStart && checkDate <= today;
  };

  const handleDayClick = (day: Date) => {
    if (!isSameMonth(day, currentMonth)) return;
    
    // Check if it's Sunday (only for employees)
    if (!isAdmin) {
      const dayOfWeek = day.getDay();
      if (dayOfWeek === 0) {
        setError("Non è possibile inserire ore la domenica.");
        return;
      }
    }
    
    if (!isDateEditable(day)) {
      setError("È possibile inserire ore solo per il mese corrente fino ad oggi.");
      return;
    }

    const dateStr = format(day, "yyyy-MM-dd");
    setSelectedDate(dateStr);

    // Check if entry exists for this day and pre-fill
    const existingEntry = entries.find(e => e.workDate === dateStr);
    if (existingEntry) {
      let dayType: "normal" | "ferie" | "malattia" = "normal";
      let medicalCertificate = "";
      if ((existingEntry.vacationHours ?? 0) > 0) {
        dayType = "ferie";
      } else if ((existingEntry.sicknessHours ?? 0) > 0) {
        dayType = "malattia";
        medicalCertificate = existingEntry.medicalCertificate || "";
      }
      
      const isMorningPermesso = existingEntry.morningStart === "PERM";
      const isAfternoonPermesso = existingEntry.afternoonStart === "PERM";
      
      setModalForm({
        morningStart: isMorningPermesso ? "08:00" : (existingEntry.morningStart || "08:00"),
        morningEnd: isMorningPermesso ? "12:00" : (existingEntry.morningEnd || "12:00"),
        afternoonStart: isAfternoonPermesso ? "14:00" : (existingEntry.afternoonStart || "14:00"),
        afternoonEnd: isAfternoonPermesso ? "18:30" : (existingEntry.afternoonEnd || "18:30"),
        notes: existingEntry.notes || "",
        dayType,
        medicalCertificate,
        isMorningPermesso,
        isAfternoonPermesso,
      });
    } else {
      setModalForm({
        morningStart: "08:00",
        morningEnd: "12:00",
        afternoonStart: "14:00",
        afternoonEnd: "18:30",
        notes: "",
        dayType: "normal",
        medicalCertificate: "",
        isMorningPermesso: false,
        isAfternoonPermesso: false,
      });
    }
    
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError(null);

    if (modalForm.dayType === "normal" && calculatedHours.totalWorked === 0) {
      setModalError("Inserisci ore di lavoro valide.");
      return;
    }

    if (!selectedDate) return;

    let payload: Record<string, unknown>;
    if (modalForm.dayType === "ferie") {
      payload = {
        workDate: selectedDate,
        hoursWorked: 0,
        overtimeHours: 0,
        permessoHours: 0,
        sicknessHours: 0,
        vacationHours: 8,
        notes: modalForm.notes.trim() || null,
        ...(targetUserId && { userId: targetUserId }),
      };
    } else if (modalForm.dayType === "malattia") {
      payload = {
        workDate: selectedDate,
        hoursWorked: 0,
        overtimeHours: 0,
        permessoHours: 0,
        sicknessHours: 8,
        vacationHours: 0,
        medicalCertificate: modalForm.medicalCertificate || null,
        notes: modalForm.notes.trim() || null,
        ...(targetUserId && { userId: targetUserId }),
      };
    } else {
      payload = {
        workDate: selectedDate,
        hoursWorked: calculatedHours.regular,
        overtimeHours: calculatedHours.overtime,
        permessoHours: calculatedHours.permesso,
        morningStart: modalForm.isMorningPermesso ? "PERM" : modalForm.morningStart || undefined,
        morningEnd: modalForm.isMorningPermesso ? "PERM" : modalForm.morningEnd || undefined,
        afternoonStart: modalForm.isAfternoonPermesso ? "PERM" : modalForm.afternoonStart || undefined,
        afternoonEnd: modalForm.isAfternoonPermesso ? "PERM" : modalForm.afternoonEnd || undefined,
        notes: modalForm.notes.trim() || null,
        ...(targetUserId && { userId: targetUserId }),
      };
    }

    startSaving(async () => {
      try {
        const response = await fetch("/api/hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setModalError(data?.error ?? "Impossibile salvare l'inserimento.");
          return;
        }

        // Calculate new entries
        const newEntries = (() => {
          const filtered = entries.filter(e => e.workDate !== selectedDate);
          return [...filtered, data as TimeEntryDTO];
        })();

        onEntrySaved?.(newEntries); // Trigger refetch in admin dashboard
        setEntries(newEntries);

        setIsModalOpen(false);
        setIsRefetching(true);
      } catch {
        setModalError("Errore imprevisto durante il salvataggio.");
      }
    });
  };

  const handleDelete = () => {
    if (!selectedDate) return;

    const entry = entries.find(e => e.workDate === selectedDate);
    if (!entry) return;

    if (!confirm("Sei sicuro di voler eliminare questo inserimento?")) return;

    setModalError(null);

    startSaving(async () => {
      try {
        const response = await fetch(`/api/hours?id=${entry.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          setModalError(data?.error ?? "Impossibile eliminare l'inserimento.");
          return;
        }

        // Use functional updater to ensure we operate on latest state
        setEntries((prev) => {
          const newEntries = prev.filter((e) => e.id !== entry.id);
          onEntrySaved?.(newEntries); // Trigger refetch in admin dashboard with latest entries
          return newEntries;
        });

        setIsModalOpen(false);
        setIsRefetching(true);
      } catch {
        setModalError("Errore imprevisto durante l'eliminazione.");
      }
    });
  };

  const handleFerie = async (date: string) => {
    setContextMenu(null);
    setError(null);

    const payload = {
      workDate: date,
      hoursWorked: 0,
      overtimeHours: 0,
      permessoHours: 0,
      sicknessHours: 0,
      vacationHours: 8,
      ...(targetUserId && { userId: targetUserId }),
    };

    try {
      const response = await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Errore nel salvare le ferie.");
        return;
      }

      // Calculate new entries
      const newEntries = (() => {
        const filtered = entries.filter(e => e.workDate !== date);
        return [...filtered, data as TimeEntryDTO];
      })();

      onEntrySaved?.(newEntries);
      setEntries(newEntries);

      router.refresh();
    } catch {
      setError("Errore imprevisto durante il salvataggio delle ferie.");
    }
  };

  return (
    <div>
      {/* Header with logo - hide in embedded views */}
      {!hideHeader && (
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-4">
            <div className="flex items-center gap-8">
              <img
                src="/logo.svg"
                alt="Ivicolors"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Benvenuto, {userName.split(" ")[0] ?? userName}
                </h1>
                <p className="text-sm text-gray-500">
                  Gestisci le tue ore di lavoro
                </p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>
      )}

      <div className={hideHeader ? "w-full py-8 flex flex-col" : "mx-auto max-w-7xl px-3 sm:px-6 py-8 flex flex-col"}>
        {/* Stats cards */}
        {!hideStats && (
          <div className="order-2 md:order-1 mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Mese</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-gray-500">ore lavorate</p>
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
                  <p className="text-sm font-medium text-gray-600">Straordinario</p>
                  <p className="mt-2 text-3xl font-bold text-orange-600">{totalOvertime.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">ore extra</p>
                </div>
                <div className="rounded-full bg-orange-50 p-3">
                  <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Permesso</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{totalPermesso.toFixed(1)}</p>
                <p className="text-xs text-gray-500">ore utilizzate</p>
              </div>
              <div className="rounded-full bg-purple-50 p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {totalSickness > 0 && (
            <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Malattia</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{totalSickness.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">ore malattia</p>
                </div>
                <div className="rounded-full bg-red-50 p-3">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {totalVacation > 0 && (
            <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ferie</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">{totalVacation.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">ore ferie</p>
                </div>
                <div className="rounded-full bg-green-50 p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Calendar section */}
        <section className="order-1 md:order-2 mb-8 md:mb-0 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-3 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                {isFetching && <p className="text-xs text-gray-500">Aggiornamento calendario...</p>}
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
                  Oggi
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

          <div className="px-2 py-4 sm:p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-0.5 sm:gap-2">
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
                const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
                const isSaturday = dayOfWeek === 6;
                const isSunday = dayOfWeek === 0;

                // Calculate permesso hours
                let permessoHours = 0;
                if (hasEntries) {
                  // Use permessoHours from database entry
                  permessoHours = dayEntry?.permessoHours ?? 0;
                } else {
                  // Calculate for days without entry
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
                  const isPastOrYesterday = day <= yesterday;
                  const isInCurrentMonth = isSameMonth(day, currentMonth);

                  if (isWeekday && isPastOrYesterday && isInCurrentMonth) {
                    permessoHours = 8; // Full day permesso for empty weekdays in the past
                  }
                }

                // Determine permesso indicator color
                let permessoColor = "";
                if (permessoHours > 0 && permessoHours < 8) {
                  permessoColor = "bg-yellow-400";
                } else if (permessoHours === 8) {
                  permessoColor = "bg-red-500";
                }

                // Determine background color based on day type
                let bgColorClass = "bg-white";
                let bgColorDisabled = "bg-gray-50";
                let bgColorOutside = "bg-gray-50/50";
                
                if (isSaturday) {
                  bgColorClass = "bg-blue-50";
                  bgColorDisabled = "bg-blue-50/70";
                  bgColorOutside = "bg-blue-50/40";
                } else if (isSunday) {
                  bgColorClass = "bg-red-50";
                  bgColorDisabled = "bg-red-50/70";
                  bgColorOutside = "bg-red-50/40";
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleDayClick(day)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (!editable) return;
                      setContextMenu({x: e.clientX, y: e.clientY, date: key, visible: true});
                    }}
                    disabled={!editable}
                    className={`flex min-h-[80px] sm:min-h-[100px] flex-col rounded-md sm:rounded-xl border p-1.5 sm:p-3 text-left transition ${
                      isSameMonth(day, currentMonth)
                        ? editable
                          ? `border-gray-200 ${bgColorClass} hover:border-blue-300 hover:shadow-md cursor-pointer hover:scale-105`
                          : `border-gray-200 ${bgColorDisabled} text-gray-400 cursor-not-allowed`
                        : `border-dashed border-gray-200 ${bgColorOutside} text-gray-300`
                    } ${highlight ? "ring-2 ring-blue-400 shadow-md" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {permessoColor && (
                          <div className={`w-2 h-2 rounded-full ${permessoColor}`} title={`Permesso: ${permessoHours}h`}></div>
                        )}
                        <span className={`text-xs sm:text-sm font-semibold ${highlight ? "text-blue-600" : "text-gray-700"}`}>
                          {format(day, "d")}
                        </span>
                      </div>
                    </div>
                    {hasEntries ? (
                      <div className="flex-1 flex flex-col justify-center items-center gap-1.5">
                        {((dayEntry?.vacationHours ?? 0) > 0 || (dayEntry?.sicknessHours ?? 0) > 0) ? (
                          // Show type and notes for vacation/sickness days
                          <div className="flex flex-col items-center gap-1">
                            <div className={`text-lg sm:text-xl font-bold text-center ${(dayEntry?.vacationHours ?? 0) > 0 ? "text-blue-600" : "text-red-600"}`}>
                              {(dayEntry?.vacationHours ?? 0) > 0 ? "Ferie" : "Malattia"}
                            </div>
                            {dayEntry?.notes && (
                              <div className="text-[10px] sm:text-xs text-gray-500 italic line-clamp-2 break-words px-1 text-center">
                                {dayEntry.notes}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Show hours for normal working days
                          <>
                            <div className="flex flex-col items-center">
                              <div className="text-2xl sm:text-3xl font-bold text-blue-600 tracking-tight">
                                {totalHours.toFixed(1)}
                              </div>
                              <div className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">
                                ore
                              </div>
                            </div>
                            {dayEntry?.notes && (
                              <div className="text-[10px] sm:text-xs text-gray-500 italic line-clamp-2 break-words px-1 text-center">
                                {dayEntry.notes}
                              </div>
                            )}
                          </>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-lg my-8 rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleModalSubmit} className="flex flex-col min-h-0 flex-1">
              {/* Modal Header */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
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
              <div className="space-y-5 p-6 pb-5 overflow-y-auto flex-1">
                {/* Day type selector */}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Tipo di giornata</span>
                  <select
                    value={modalForm.dayType}
                    onChange={(e) => setModalForm(f => ({ ...f, dayType: e.target.value as "normal" | "ferie" | "malattia" }))}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="normal">Normale</option>
                    <option value="ferie">Ferie</option>
                    <option value="malattia">Malattia</option>
                  </select>
                </label>

                {/* Medical certificate input - only show for malattia */}
                {modalForm.dayType === "malattia" && (
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">Numero certificato medico</span>
                    <input
                      type="text"
                      value={modalForm.medicalCertificate}
                      onChange={(e) => setModalForm(f => ({ ...f, medicalCertificate: e.target.value }))}
                      placeholder="Inserisci il numero del certificato..."
                      className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                )}
                {modalForm.dayType === "normal" && (
                  <>
                    {/* Morning shift */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-blue-900">Turno Mattina</h3>
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={modalForm.isMorningPermesso}
                            onChange={(e) => setModalForm(f => ({ ...f, isMorningPermesso: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-blue-800">Permesso (non conteggiato come lavoro)</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-blue-800">Ora inizio</span>
                          <select
                            value={modalForm.morningStart}
                            onChange={(e) => setModalForm(f => ({ ...f, morningStart: e.target.value }))}
                            disabled={modalForm.isMorningPermesso}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={`morning-start-${time}`} value={time}>{time}</option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-blue-800">Ora fine</span>
                          <select
                            value={modalForm.morningEnd}
                            onChange={(e) => setModalForm(f => ({ ...f, morningEnd: e.target.value }))}
                            disabled={modalForm.isMorningPermesso}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={`morning-end-${time}`} value={time}>{time}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {!modalForm.isMorningPermesso && (
                        <p className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-medium text-blue-700">Durata:</span>
                          <span className="font-bold text-blue-900">{calculatedHours.morning.toFixed(2)} ore</span>
                        </p>
                      )}
                      {modalForm.isMorningPermesso && (
                        <p className="mt-2 text-xs text-blue-700">Queste ore saranno conteggiate come permesso.</p>
                      )}
                    </div>

                    {/* Afternoon shift */}
                    <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <h3 className="text-sm font-bold text-orange-900">Turno Pomeriggio</h3>
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={modalForm.isAfternoonPermesso}
                            onChange={(e) => setModalForm(f => ({ ...f, isAfternoonPermesso: e.target.checked }))}
                            className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-xs font-medium text-orange-800">Permesso (non conteggiato come lavoro)</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-orange-800">Ora inizio</span>
                          <select
                            value={modalForm.afternoonStart}
                            onChange={(e) => setModalForm(f => ({ ...f, afternoonStart: e.target.value }))}
                            disabled={modalForm.isAfternoonPermesso}
                            className="rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={`afternoon-start-${time}`} value={time}>{time}</option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-semibold text-orange-800">Ora fine</span>
                          <select
                            value={modalForm.afternoonEnd}
                            onChange={(e) => setModalForm(f => ({ ...f, afternoonEnd: e.target.value }))}
                            disabled={modalForm.isAfternoonPermesso}
                            className="rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={`afternoon-end-${time}`} value={time}>{time}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {!modalForm.isAfternoonPermesso && (
                        <p className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-medium text-orange-700">Durata:</span>
                          <span className="font-bold text-orange-900">{calculatedHours.afternoon.toFixed(2)} ore</span>
                        </p>
                      )}
                      {modalForm.isAfternoonPermesso && (
                        <p className="mt-2 text-xs text-orange-700">Queste ore saranno conteggiate come permesso.</p>
                      )}
                    </div>
                  </>
                )}

                {modalForm.dayType === "ferie" && (
                  <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h3 className="text-sm font-bold text-green-900">Ferie</h3>
                    </div>
                    <p className="text-sm text-green-800">Giornata di ferie completa - 8 ore di ferie.</p>
                  </div>
                )}

                {modalForm.dayType === "malattia" && (
                  <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-sm font-bold text-red-900">Malattia</h3>
                    </div>
                    <p className="text-sm text-red-800">Giornata di malattia - 8 ore di malattia.</p>
                  </div>
                )}

                {modalForm.dayType === "normal" && (
                  <>
                    {/* Summary */}
                    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Ore totali:</span>
                          <span className="text-2xl font-bold text-blue-600">{calculatedHours.totalWorked.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-blue-100 pt-2">
                          <span className="font-medium text-gray-600">Ore regolari:</span>
                          <span className="font-bold text-gray-900">{calculatedHours.regular.toFixed(2)}</span>
                        </div>
                        {calculatedHours.overtime > 0 && (
                          <div className="flex justify-between items-center border-t border-orange-100 pt-2">
                            <span className="font-medium text-orange-700">Straordinario:</span>
                            <span className="font-bold text-orange-600">{calculatedHours.overtime.toFixed(2)}</span>
                          </div>
                        )}
                        {calculatedHours.permesso > 0 && (
                          <div className="flex justify-between items-center border-t border-yellow-100 pt-2">
                            <span className="font-medium text-yellow-700">Permesso:</span>
                            <span className="font-bold text-yellow-600">{calculatedHours.permesso.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-700">Note (opzionali)</span>
                  <textarea
                    value={modalForm.notes}
                    onChange={(e) => setModalForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Aggiungi note sul tuo lavoro..."
                    rows={3}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 resize-none"
                    style={{ backgroundColor: 'white' }}
                  />
                </label>

                {modalError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">{modalError}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 pt-6 rounded-b-2xl flex-shrink-0">
                {/* Show delete button only if entry exists */}
                {selectedDate && entries.find(e => e.workDate === selectedDate) && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="rounded-lg border-2 border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Eliminazione..." : "Elimina"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-400"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSaving || (modalForm.dayType === "normal" && calculatedHours.totalWorked === 0)}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400"
                >
                  {isSaving ? "Salvataggio..." : modalForm.dayType === "ferie" ? "Salva Ferie" : modalForm.dayType === "malattia" ? "Salva Malattia" : "Salva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              // Set selectedDate for delete
              setSelectedDate(contextMenu.date);
              handleFerie(contextMenu.date);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Ferie
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu(null);
              const date = contextMenu.date;
              const entry = entries.find(e => e.workDate === date);
              if (!entry) return;
              if (!confirm("Sei sicuro di voler eliminare questo inserimento?")) return;
              fetch(`/api/hours?id=${entry.id}`, { method: "DELETE" })
                .then(response => {
                  if (response.ok) {
                    setEntries(current => current.filter(e => e.id !== entry.id));
                    setTimeout(() => setIsRefetching(true), 200);
                  } else {
                    alert("Errore nell'eliminazione");
                  }
                })
                .catch(() => alert("Errore nell'eliminazione"));
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100"
          >
            Elimina
          </button>
        </div>
      )}
    </div>
  );
}
