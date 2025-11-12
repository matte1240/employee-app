"use client";

import { format } from "date-fns";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import EmployeeDashboard, { type TimeEntryDTO } from "./employee-dashboard";

type UserAggregate = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
  totalHours: number;
  lastEntry?: string | null;
};

type AdminDashboardProps = {
  users: UserAggregate[];
};

type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "EMPLOYEE" | "ADMIN";
};

export default function AdminDashboard({ users }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "create-user" | "export-data" | "user-calendar">("overview");
  const [selectedUser, setSelectedUser] = useState<UserAggregate | null>(null);
  const [userEntries, setUserEntries] = useState<TimeEntryDTO[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreating, startCreating] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [usersWithMonthHours, setUsersWithMonthHours] = useState<UserAggregate[]>(users);
  const [isLoadingMonthHours, setIsLoadingMonthHours] = useState(false);
  
  const [form, setForm] = useState<CreateUserForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
  });

  // Fetch users with hours for selected export month
  useEffect(() => {
    if (activeTab === "export-data") {
      const fetchMonthHours = async () => {
        setIsLoadingMonthHours(true);
        try {
          const [year, month] = exportMonth.split('-');
          const from = `${year}-${month}-01`;
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
          const to = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
          
          console.log('Fetching hours for:', { from, to, exportMonth });
          
          const response = await fetch(`/api/hours?userId=all&from=${from}&to=${to}`);
          if (response.ok) {
            const entries = await response.json();
            
            console.log('Received entries:', entries.length);
            
            // Calculate hours per user for the selected month
            const hoursMap = new Map<string, number>();
            entries.forEach((entry: any) => {
              const current = hoursMap.get(entry.userId) || 0;
              const totalHours = entry.hoursWorked + (entry.overtimeHours || 0);
              hoursMap.set(entry.userId, current + totalHours);
            });
            
            console.log('Hours map:', Object.fromEntries(hoursMap));
            
            // Update users with month-specific hours
            const updatedUsers = users.map(user => ({
              ...user,
              totalHours: hoursMap.get(user.id) || 0,
            }));
            
            console.log('Updated users:', updatedUsers);
            
            setUsersWithMonthHours(updatedUsers);
          }
        } catch (err) {
          console.error("Error fetching month hours:", err);
        } finally {
          setIsLoadingMonthHours(false);
        }
      };
      
      fetchMonthHours();
    }
  }, [exportMonth, activeTab, users]);

  // Fetch user entries when a user is selected
  useEffect(() => {
    if (selectedUser && activeTab === "user-calendar") {
      const fetchUserEntries = async () => {
        setIsLoadingEntries(true);
        try {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const from = `${year}-${month.toString().padStart(2, '0')}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          const to = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

          const response = await fetch(`/api/hours?userId=${selectedUser.id}&from=${from}&to=${to}`);
          if (response.ok) {
            const data = await response.json();
            setUserEntries(data);
          }
        } catch (err) {
          console.error("Error fetching user entries:", err);
        } finally {
          setIsLoadingEntries(false);
        }
      };

      fetchUserEntries();
    }
  }, [selectedUser, activeTab, refreshTrigger]);

  // Callback to trigger refetch after admin saves
  const handleEntrySaved = () => {
    setRefreshTrigger(prev => prev + 1);
    router.refresh(); // Also refresh server component for overview
  };

  const handleUserClick = (user: UserAggregate) => {
    setSelectedUser(user);
    setActiveTab("user-calendar");
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    startCreating(async () => {
      try {
        const response = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to create user");
          return;
        }

        setSuccess(`User ${form.email} created successfully!`);
        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "EMPLOYEE",
        });
        
        // Refresh the page to show the new user
        router.refresh();
      } catch (err) {
        setError("Unexpected error occurred");
      }
    });
  };

  const activeEmployees = users.filter(u => {
    if (!u.lastEntry) return false;
    const lastEntry = new Date(u.lastEntry);
    const now = new Date();
    return lastEntry.getMonth() === now.getMonth() && lastEntry.getFullYear() === now.getFullYear();
  }).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header with logo and navigation */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <img
              src="/logo.svg"
              alt="Ivicolors"
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("create-user")}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition ${
                activeTab === "create-user"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create User
              </div>
            </button>
            <button
              onClick={() => setActiveTab("export-data")}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition ${
                activeTab === "export-data"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Data
              </div>
            </button>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {/* Stats cards */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="mt-2 text-3xl font-bold text-blue-600">{users.filter(r => r.role === "EMPLOYEE").length}</p>
                  </div>
                  <div className="rounded-full bg-blue-50 p-3">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-green-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours Logged</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {users.reduce((sum, r) => sum + r.totalHours, 0).toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-full bg-green-50 p-3">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-purple-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active This Month</p>
                    <p className="mt-2 text-3xl font-bold text-purple-600">{activeEmployees}</p>
                  </div>
                  <div className="rounded-full bg-purple-50 p-3">
                    <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Team overview table */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Team Overview</h2>
                <p className="mt-1 text-sm text-gray-500">Monitor employee activity and work hours</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Total Hours
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Last Activity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {users.map((row) => (
                      <tr 
                        key={row.id} 
                        onClick={() => handleUserClick(row)}
                        className="cursor-pointer transition hover:bg-blue-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white">
                              {(row.name ?? "U")[0].toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="font-semibold text-gray-900">{row.name ?? "Unassigned"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {row.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            row.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {row.role}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-900">{row.totalHours.toFixed(1)}</span>
                            <span className="ml-1 text-sm text-gray-500">hrs</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {row.lastEntry ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-400"></div>
                              {format(new Date(row.lastEntry), "MMM d, yyyy")}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                              <span className="text-gray-400">No activity</span>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {format(row.createdAt, "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Create User Tab */}
        {activeTab === "create-user" && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
                <h2 className="text-lg font-semibold text-white">Create New User</h2>
                <p className="mt-1 text-sm text-blue-100">Add a new employee or administrator to the system</p>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value as "EMPLOYEE" | "ADMIN" }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    {form.role === "ADMIN" 
                      ? "Administrators can manage users and view all data" 
                      : "Employees can only log and view their own work hours"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Re-enter password"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-green-800">{success}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        name: "",
                        email: "",
                        password: "",
                        confirmPassword: "",
                        role: "EMPLOYEE",
                      });
                      setError(null);
                      setSuccess(null);
                    }}
                    className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400"
                  >
                    {isCreating ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Export Data Tab */}
        {activeTab === "export-data" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Export Employee Data</h2>
              <p className="mt-2 text-sm text-gray-600">
                Select employees and a month to export their work hours data. Multiple employees will be downloaded as a ZIP file.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Month selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Month
                </label>
                <div className="relative w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-left text-sm text-gray-900 font-medium outline-none transition hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 flex items-center justify-between"
                  >
                    <span>
                      {exportMonth ? new Date(exportMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Select a month'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {isMonthPickerOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-800 mb-1">Year</label>
                        <select
                          value={exportMonth.split('-')[0] || new Date().getFullYear()}
                          onChange={(e) => {
                            const year = e.target.value;
                            const month = exportMonth.split('-')[1] || '01';
                            setExportMonth(`${year}-${month}`);
                          }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        >
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-800 mb-1">Month</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monthName, idx) => {
                            const monthNum = String(idx + 1).padStart(2, '0');
                            const year = exportMonth.split('-')[0] || new Date().getFullYear();
                            const isSelected = exportMonth === `${year}-${monthNum}`;
                            return (
                              <button
                                key={monthName}
                                type="button"
                                onClick={() => {
                                  setExportMonth(`${year}-${monthNum}`);
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
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User selection */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Select Employees</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(new Set(usersWithMonthHours.filter(u => u.role === "EMPLOYEE").map(u => u.id)))}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds(new Set())}
                      className="text-sm font-medium text-gray-600 hover:text-gray-700 transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {isLoadingMonthHours ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                      <p className="mt-4 text-sm text-gray-600">Loading hours...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {usersWithMonthHours.filter(u => u.role === "EMPLOYEE").map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer transition hover:bg-blue-50 hover:border-blue-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedUserIds);
                            if (e.target.checked) {
                              newSet.add(user.id);
                            } else {
                              newSet.delete(user.id);
                            }
                            setSelectedUserIds(newSet);
                          }}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{user.name || user.email}</div>
                          {user.name && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
                        </div>
                        {user.totalHours !== null && user.totalHours > 0 && (
                          <div className="text-sm font-medium text-gray-600">
                            {user.totalHours.toFixed(1)}h
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {selectedUserIds.size > 0 && (
                  <div className="mt-6 flex items-center justify-between rounded-lg bg-blue-50 p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-900">
                      {selectedUserIds.size} employee{selectedUserIds.size > 1 ? 's' : ''} selected
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsExporting(true);
                        setError(null);
                        try {
                          const response = await fetch('/api/export-csv', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userIds: Array.from(selectedUserIds),
                              month: exportMonth,
                            }),
                          });

                          if (!response.ok) {
                            throw new Error('Export failed');
                          }

                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = selectedUserIds.size === 1 
                            ? `hours_${users.find(u => selectedUserIds.has(u.id))?.name || 'employee'}_${exportMonth}.csv`
                            : `hours_export_${exportMonth}.zip`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          setError('Failed to export data. Please try again.');
                        } finally {
                          setIsExporting(false);
                        }
                      }}
                      disabled={isExporting}
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400 flex items-center gap-2"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {isExporting ? 'Exporting...' : 'Export to CSV'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Calendar Tab */}
        {activeTab === "user-calendar" && selectedUser && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("overview")}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Overview
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedUser.name ?? selectedUser.email}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedUser.email} • {selectedUser.role}
                  </p>
                </div>
              </div>
            </div>

            {isLoadingEntries ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <EmployeeDashboard
                  initialEntries={userEntries}
                  userName={selectedUser.name ?? selectedUser.email}
                  hideHeader={true}
                  targetUserId={selectedUser.id}
                  onEntrySaved={handleEntrySaved}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
