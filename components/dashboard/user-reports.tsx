"use client";

import { useState } from "react";
import { format } from "date-fns";

type EmployeeReportsProps = {
  userId: string;
  userName: string;
  userEmail: string;
};

export default function UserReports({
  userId,
  userName,
  userEmail,
}: EmployeeReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {/* Top stats cards removed as requested */}

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
            disabled={isExporting}
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
