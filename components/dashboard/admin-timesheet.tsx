"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth } from "date-fns";
import { useRouter } from "next/navigation";
import TimesheetCalendar, { type TimeEntryDTO } from "./timesheet-calendar";
import type { User } from "@/types/models";
import { calculateTotalsFromEntries } from "@/lib/utils/calculations";
import StatsCard from "./stats-card";

// Minimal user type for admin calendar (only needs id, name, email)
type UserMinimal = Pick<User, "id" | "name" | "email">;

type AdminCalendarProps = {
  users: UserMinimal[];
  selectedUserId: string;
  selectedUser: UserMinimal;
  initialEntries: TimeEntryDTO[];
  totalHours: number;
  totalOvertimeHours: number;
  totalPermFerieHours: number;
  totalSicknessHours: number;
};

export default function AdminTimesheet({
  users,
  selectedUserId,
  selectedUser,
  initialEntries,
  totalHours,
  totalOvertimeHours,
  totalPermFerieHours,
  totalSicknessHours,
}: AdminCalendarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTotals, setCurrentTotals] = useState({
    totalHours,
    totalOvertimeHours,
    totalPermFerieHours,
    totalSicknessHours,
  });

  // Update totals when props change (e.g., when switching users)
  useEffect(() => {
    setCurrentTotals({
      totalHours,
      totalOvertimeHours,
      totalPermFerieHours,
      totalSicknessHours,
    });
  }, [totalHours, totalOvertimeHours, totalPermFerieHours, totalSicknessHours]);

  // Polling for real-time updates from other users
  useEffect(() => {
    const fetchLatestEntries = async () => {
      try {
        const fromDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
        const response = await fetch(`/api/hours?userId=${selectedUserId}&from=${fromDate}`);
        if (response.ok) {
          const data: TimeEntryDTO[] = await response.json();
          const newTotals = calculateTotalsFromEntries(data);
          setCurrentTotals(newTotals);
        }
      } catch (error) {
        console.error('Error fetching latest entries:', error);
      }
    };

    const interval = setInterval(fetchLatestEntries, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [selectedUserId]);

  const handleUserChange = (userId: string) => {
    setIsDropdownOpen(false);
    router.push(`/dashboard/calendar?userId=${userId}`);
  };

  const handleEntrySaved = useCallback((updatedEntries: TimeEntryDTO[]) => {
    // Recalculate totals from updated entries
    const newTotals = calculateTotalsFromEntries(updatedEntries);
    setCurrentTotals(newTotals);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User Selector */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label
            htmlFor="user-select"
            className="block text-sm font-medium text-gray-700 mb-3"
          >
            Visualizza calendario di:
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-10 text-left shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <span className="flex items-center">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  {(selectedUser.name || selectedUser.email).charAt(0).toUpperCase()}
                </span>
                <span className="ml-3 block truncate">
                  <span className="font-medium text-gray-900">
                    {selectedUser.name || "N/A"}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({selectedUser.email})
                  </span>
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
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

            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown */}
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserChange(user.id)}
                      className={`relative w-full cursor-pointer select-none py-3 pl-4 pr-10 text-left transition hover:bg-gray-50 ${
                        user.id === selectedUserId
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                        <span className="ml-3 block truncate">
                          <span className="font-medium text-gray-900">
                            {user.name || "N/A"}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({user.email})
                          </span>
                        </span>
                      </div>
                      {user.id === selectedUserId && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <StatsCard
          title="Totale Ore"
          value={`${currentTotals.totalHours.toFixed(1)}h`}
          color="green"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Straordinari"
          value={`${currentTotals.totalOvertimeHours.toFixed(1)}h`}
          color="orange"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatsCard
          title="Permessi/Ferie"
          value={`${currentTotals.totalPermFerieHours.toFixed(1)}h`}
          color="purple"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatsCard
          title="Malattia"
          value={`${currentTotals.totalSicknessHours.toFixed(1)}h`}
          color="red"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Calendar Component */}
      <TimesheetCalendar
        initialEntries={initialEntries}
        userName={selectedUser.name || selectedUser.email}
        hideHeader={true}
        hideStats={true}
        targetUserId={selectedUserId}
        onEntrySaved={handleEntrySaved}
        isAdmin={true}
      />
    </div>
  );
}
