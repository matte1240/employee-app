"use client";

import { useState, useTransition, useEffect } from "react";
import type { User, TimeEntryDTO } from "@/types/models";

type UserWithHours = User & {
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
  sicknessHours: number;
  vacationHours: number;
};

type ExportDataProps = {
  users: User[];
};

export default function AdminReports({ users }: ExportDataProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [usersWithMonthHours, setUsersWithMonthHours] = useState<UserWithHours[]>([]);
  const [isLoadingMonthHours, setIsLoadingMonthHours] = useState(false);
  const [isExporting, startExporting] = useTransition();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch users with hours for selected month
  useEffect(() => {
    const fetchMonthHours = async () => {
      setIsLoadingMonthHours(true);
      try {
        const [year, month] = selectedMonth.split('-');
        const from = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        const response = await fetch(`/api/hours?userId=all&from=${from}&to=${to}`);
        if (response.ok) {
          const entries = await response.json();

          // Calculate hours per user for the selected month
          const regularHoursMap = new Map<string, number>();
          const overtimeHoursMap = new Map<string, number>();
          const permessoHoursMap = new Map<string, number>();
          const sicknessHoursMap = new Map<string, number>();
          const vacationHoursMap = new Map<string, number>();

          entries.forEach((entry: TimeEntryDTO) => {
            // Skip if userId is missing
            if (!entry.userId) return;

            const regularCurrent = regularHoursMap.get(entry.userId) || 0;
            const overtimeCurrent = overtimeHoursMap.get(entry.userId) || 0;
            const permessoCurrent = permessoHoursMap.get(entry.userId) || 0;
            const sicknessCurrent = sicknessHoursMap.get(entry.userId) || 0;
            const vacationCurrent = vacationHoursMap.get(entry.userId) || 0;

            // hoursWorked already contains only regular hours (max 8 per day)
            const regularHours = entry.hoursWorked || 0;
            const overtimeHours = entry.overtimeHours || 0;
            const permessoHours = entry.permessoHours || 0;
            const sicknessHours = entry.sicknessHours || 0;
            const vacationHours = entry.vacationHours || 0;

            regularHoursMap.set(entry.userId, regularCurrent + regularHours);
            overtimeHoursMap.set(entry.userId, overtimeCurrent + overtimeHours);
            permessoHoursMap.set(entry.userId, permessoCurrent + permessoHours);
            sicknessHoursMap.set(entry.userId, sicknessCurrent + sicknessHours);
            vacationHoursMap.set(entry.userId, vacationCurrent + vacationHours);
          });

          // Update users with month-specific hours
          const updatedUsers = users.map(user => ({
            ...user,
            regularHours: regularHoursMap.get(user.id) || 0,
            overtimeHours: overtimeHoursMap.get(user.id) || 0,
            permessoHours: permessoHoursMap.get(user.id) || 0,
            sicknessHours: sicknessHoursMap.get(user.id) || 0,
            vacationHours: vacationHoursMap.get(user.id) || 0,
          }));

          setUsersWithMonthHours(updatedUsers);
        }
      } catch (err) {
        console.error("Errore durante il caricamento delle ore:", err);
        setError("Errore nel caricamento delle ore per il mese selezionato");
      } finally {
        setIsLoadingMonthHours(false);
      }
    };

    fetchMonthHours();
  }, [selectedMonth, users]);

  const handleExport = async () => {
    startExporting(async () => {
      setError(null);
      try {
        const response = await fetch('/api/export-excel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds: Array.from(selectedUserIds),
            month: selectedMonth,
          }),
        });

        if (!response.ok) {
          throw new Error('Esportazione fallita');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hours_export_${selectedMonth}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Errore durante l\'esportazione:', err);
        setError('Errore durante l\'esportazione. Riprova per favore.');
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedUserIds(new Set(usersWithMonthHours.map(u => u.id)));
  };

  const handleClearAll = () => {
    setSelectedUserIds(new Set());
  };

  const handleToggleUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  // Totali rimossi perché le card riepilogative sono state eliminate

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Esporta dati dipendenti</h2>
        <p className="mt-2 text-sm text-gray-600">
          Seleziona i dipendenti e un mese per esportare le loro ore di lavoro. Verrà esportato in Excel.
        </p>
      </div>

      {/* Top stats cards removed as requested */}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Selettore mese */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seleziona mese
          </label>
          <div className="relative w-full max-w-xs">
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-left text-sm text-gray-900 font-medium outline-none transition hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 flex items-center justify-between"
            >
              <span>
                {selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }) : 'Seleziona un mese'}
              </span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {isMonthPickerOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Anno</label>
                  <select
                    value={selectedMonth.split('-')[0] || new Date().getFullYear()}
                    onChange={(e) => {
                      const year = e.target.value;
                      const month = selectedMonth.split('-')[1] || '01';
                      setSelectedMonth(`${year}-${month}`);
                    }}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    {(() => {
                      const currentYear = new Date().getFullYear();
                      const startYear = currentYear - 3;
                      const endYear = currentYear + 3;
                      return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-800 mb-1">Mese</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'].map((monthName, idx) => {
                      const monthNum = String(idx + 1).padStart(2, '0');
                      const year = selectedMonth.split('-')[0] || new Date().getFullYear();
                      const isSelected = selectedMonth === `${year}-${monthNum}`;
                      return (
                        <button
                          key={monthName}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(`${year}-${monthNum}`);
                            setIsMonthPickerOpen(false);
                          }}
                          className={`px-3 py-2 text-sm font-semibold rounded transition ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {monthName}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMonthPickerOpen(false)}
                  className="w-full mt-2 px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  Chiudi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User selection */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Seleziona dipendenti</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                Seleziona tutti
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm font-medium text-gray-600 hover:text-gray-700 transition cursor-pointer"
              >
                Deseleziona tutti
              </button>
            </div>
          </div>

          {isLoadingMonthHours ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-gray-600">Caricamento ore...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {usersWithMonthHours.map((user) => {
                const permessoVacation = user.permessoHours + user.vacationHours;
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer transition hover:bg-blue-50 hover:border-blue-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => handleToggleUser(user.id)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{user.name || user.email}</div>
                      {user.name && (
                        <div className="text-sm text-gray-500">{user.email}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {(user.regularHours + user.overtimeHours).toFixed(1)}h
                      </div>
                      {user.overtimeHours > 0 && (
                        <div className="text-xs text-orange-600">
                          +{user.overtimeHours.toFixed(1)}h straordinarie
                        </div>
                      )}
                      {permessoVacation > 0 && (
                        <div className="text-xs text-purple-600">
                          {permessoVacation.toFixed(1)}h permesso/ferie
                        </div>
                      )}
                      {user.sicknessHours > 0 && (
                        <div className="text-xs text-red-600">
                          {user.sicknessHours.toFixed(1)}h malattia
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
              {usersWithMonthHours.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nessun dipendente trovato
                </div>
              )}
            </div>
          )}

          {selectedUserIds.size > 0 && (
            <div className="mt-6 flex items-center justify-between rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-900">
                {selectedUserIds.size} dipendente{selectedUserIds.size > 1 ? 'i' : ''} selezionat{selectedUserIds.size > 1 ? 'i' : 'o'}
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400 flex items-center gap-2 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Esportazione...' : 'Esporta in Excel'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
