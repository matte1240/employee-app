"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmployeeDashboard, { type TimeEntryDTO } from "./employee-dashboard";

type User = {
  id: string;
  name: string | null;
  email: string;
};

type AdminCalendarProps = {
  users: User[];
  selectedUserId: string;
  selectedUser: User;
  initialEntries: TimeEntryDTO[];
};

export default function AdminCalendar({
  users,
  selectedUserId,
  selectedUser,
  initialEntries,
}: AdminCalendarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleUserChange = (userId: string) => {
    setIsDropdownOpen(false);
    router.push(`/dashboard/calendar?userId=${userId}`);
  };

  const handleEntrySaved = () => {
    router.refresh();
  };

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

      {/* Employee Dashboard (Calendar) */}
      <EmployeeDashboard
        initialEntries={initialEntries}
        userName={selectedUser.name || selectedUser.email}
        hideHeader={true}
        targetUserId={selectedUserId}
        onEntrySaved={handleEntrySaved}
      />
    </div>
  );
}
