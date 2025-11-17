"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

type EmployeeReportsProps = {
  userId: string;
  userName: string;
  userEmail: string;
};

type MonthStats = {
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
  sicknessHours: number;
  vacationHours: number;
  totalHours: number;
  workingDays: number;
};

export default function EmployeeReports({
  userId,
  userName,
  userEmail,
}: EmployeeReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [monthStats, setMonthStats] = useState<MonthStats>({
    regularHours: 0,
    overtimeHours: 0,
    permessoHours: 0,
    sicknessHours: 0,
    vacationHours: 0,
    totalHours: 0,
    workingDays: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch stats for selected month
  useEffect(() => {
    const fetchMonthStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [year, month] = selectedMonth.split("-");
        const from = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

        const response = await fetch(`/api/hours?userId=${userId}&from=${from}&to=${to}`);
        if (response.ok) {
          const entries = await response.json();

          let regularHours = 0;
          let overtimeHours = 0;
          let permessoHours = 0;
          let sicknessHours = 0;
          let vacationHours = 0;
          const workingDays = new Set<string>();

          entries.forEach((entry: any) => {
            regularHours += entry.hoursWorked || 0;
            overtimeHours += entry.overtimeHours || 0;
            permessoHours += entry.permessoHours || 0;
            sicknessHours += entry.sicknessHours || 0;
            vacationHours += entry.vacationHours || 0;
            workingDays.add(entry.workDate);
          });

          setMonthStats({
            regularHours,
            overtimeHours,
            permessoHours,
            sicknessHours,
            vacationHours,
            totalHours: regularHours + overtimeHours,
            workingDays: workingDays.size,
          });
        } else {
          setError("Errore nel caricamento dei dati");
        }
      } catch (err) {
        console.error("Error fetching month stats:", err);
        setError("Errore nel caricamento dei dati");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthStats();
  }, [selectedMonth, userId]);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const response = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          userIds: [userId],
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ore_lavoro_${userName.replace(/\s+/g, "_")}_${selectedMonth}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || "Errore nell'esportazione");
      }
    } catch (err) {
      console.error("Error exporting:", err);
      setError("Errore nell'esportazione");
    } finally {
      setIsExporting(false);
    }
  };

  // Generate year/month options for picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
  ];

  const [pickerYear, pickerMonth] = selectedMonth.split("-").map(Number);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Month Selector */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Seleziona mese:
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="relative w-full sm:w-64 cursor-pointer rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-10 text-left shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <span className="block truncate font-medium text-gray-900">
                {format(new Date(selectedMonth + "-15"), "MMMM yyyy")}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isMonthPickerOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            {isMonthPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMonthPickerOpen(false)}
                />
                <div className="absolute z-20 mt-1 w-80 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                  {/* Year selector */}
                  <select
                    value={pickerYear}
                    onChange={(e) => {
                      const newMonth = `${e.target.value}-${String(pickerMonth).padStart(2, "0")}`;
                      setSelectedMonth(newMonth);
                      setIsMonthPickerOpen(false);
                    }}
                    className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, idx) => {
                      const monthNum = idx + 1;
                      const monthValue = `${pickerYear}-${String(monthNum).padStart(2, "0")}`;
                      const isSelected = monthValue === selectedMonth;

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedMonth(monthValue);
                            setIsMonthPickerOpen(false);
                          }}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-3 text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Giorni Lavorati</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : monthStats.workingDays}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore Totali</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `${monthStats.totalHours.toFixed(1)}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore Straordinarie</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `${monthStats.overtimeHours.toFixed(1)}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore di Permesso</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `${monthStats.permessoHours.toFixed(1)}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore di Malattia</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `${monthStats.sicknessHours.toFixed(1)}h`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-green-100 bg-green-50 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore di Ferie</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? "..." : `${monthStats.vacationHours.toFixed(1)}h`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Esporta Report</h2>
            <p className="text-sm text-gray-600 mt-1">
              Scarica il report delle tue ore lavorate per {format(new Date(selectedMonth + "-15"), "MMMM yyyy")}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Esportazione...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Scarica Excel
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-gray-200 pt-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm text-gray-900">{userName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{userEmail}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
