"use client";

import { format } from "date-fns";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import EmployeeDashboard, { type TimeEntryDTO } from "./employee-dashboard";

type UserAggregate = {
  id: string;
  name: string | null;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  createdAt: Date;
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
  sicknessHours: number;
  vacationHours: number;
  lastEntry?: string | null;
};

type CurrentUser = {
  id: string;
  name: string | null | undefined;
  email: string;
  role: string;
};

type AdminDashboardProps = {
  users: UserAggregate[];
  currentUser: CurrentUser;
};

type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "EMPLOYEE" | "ADMIN";
};

export default function AdminDashboard({ users, currentUser }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "manage-users" | "export-data" | "user-calendar" | "server-management">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Manage Users states
  const [isCreatingUserModalOpen, setIsCreatingUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAggregate | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserAggregate | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<UserAggregate | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "EMPLOYEE" as "EMPLOYEE" | "ADMIN" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdating, startUpdating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isResettingPassword, startResettingPassword] = useTransition();

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

          const response = await fetch(`/api/hours?userId=all&from=${from}&to=${to}`);
          if (response.ok) {
            const entries = await response.json();

            // Calculate hours per user for the selected month
            const regularHoursMap = new Map<string, number>();
            const overtimeHoursMap = new Map<string, number>();
            const permessoHoursMap = new Map<string, number>();

            entries.forEach((entry: any) => {
              const regularCurrent = regularHoursMap.get(entry.userId) || 0;
              const overtimeCurrent = overtimeHoursMap.get(entry.userId) || 0;
              const permessoCurrent = permessoHoursMap.get(entry.userId) || 0;

              // hoursWorked already contains only regular hours (max 8 per day)
              const regularHours = entry.hoursWorked || 0;
              const overtimeHours = entry.overtimeHours || 0;
              const permessoHours = entry.permessoHours || 0;

              regularHoursMap.set(entry.userId, regularCurrent + regularHours);
              overtimeHoursMap.set(entry.userId, overtimeCurrent + overtimeHours);
              permessoHoursMap.set(entry.userId, permessoCurrent + permessoHours);
            });

            // Update users with month-specific hours
            const updatedUsers = users.map(user => ({
              ...user,
              regularHours: regularHoursMap.get(user.id) || 0,
              overtimeHours: overtimeHoursMap.get(user.id) || 0,
              permessoHours: permessoHoursMap.get(user.id) || 0,
            }));

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

  // Fetch user entries when viewing calendar (either current user's or specific user's)
  useEffect(() => {
    const shouldFetchCalendar = activeTab === "user-calendar" || (activeTab === "overview" && selectedUser);

    if (shouldFetchCalendar) {
      const fetchUserEntries = async () => {
        setIsLoadingEntries(true);
        try {
          const now = new Date();
          const year = now.getFullYear();
          const month = now.getMonth() + 1;
          const from = `${year}-${month.toString().padStart(2, '0')}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          const to = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

          // Use selectedUser if viewing from overview, otherwise use currentUser
          const targetUserId = (activeTab === "overview" && selectedUser) ? selectedUser.id : currentUser.id;
          const response = await fetch(`/api/hours?userId=${targetUserId}&from=${from}&to=${to}`);
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
  }, [selectedUser, activeTab, refreshTrigger, currentUser.id]);

  // Close mobile menu when clicking Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Callback to trigger refetch after admin saves
  const handleEntrySaved = () => {
    setRefreshTrigger(prev => prev + 1);
    router.refresh(); // Also refresh server component for overview
  };

  const handleUserClick = (user: UserAggregate) => {
    setSelectedUser(user);
    // Don't change activeTab - keep it on "overview" so User Calendar tab is not highlighted
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
        setIsCreatingUserModalOpen(false);

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

  // Manage Users handlers
  const handleEditClick = (user: UserAggregate) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email,
      role: user.role,
    });
    setError(null);
    setSuccess(null);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError(null);
    setSuccess(null);

    startUpdating(async () => {
      try {
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to update user");
          return;
        }

        setSuccess("User updated successfully!");
        setEditingUser(null);
        router.refresh();
      } catch (err) {
        setError("Unexpected error occurred");
      }
    });
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    setError(null);
    setSuccess(null);

    startDeleting(async () => {
      try {
        const response = await fetch(`/api/users/${deletingUser.id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to delete user");
          return;
        }

        setSuccess(`User ${deletingUser.email} deleted successfully!`);
        setDeletingUser(null);
        router.refresh();
      } catch (err) {
        setError("Unexpected error occurred");
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordUser) return;

    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    startResettingPassword(async () => {
      try {
        const response = await fetch(`/api/users/${resettingPasswordUser.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to reset password");
          return;
        }

        setSuccess(`Password for ${resettingPasswordUser.email} reset successfully!`);
        setResettingPasswordUser(null);
        setNewPassword("");
        setConfirmNewPassword("");
      } catch (err) {
        setError("Unexpected error occurred");
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation tabs */}
      <div className="border-b border-gray-200 bg-white rounded-lg mb-6">
        <div className="px-6">
          {/* Mobile hamburger button */}
          <div className="flex items-center justify-between py-4 md:hidden">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === "overview" && "Overview"}
              {activeTab === "manage-users" && "Manage Users"}
              {activeTab === "export-data" && "Export Data"}
              {activeTab === "user-calendar" && "User Calendar"}
              {activeTab === "server-management" && "Server Management"}
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop horizontal tabs */}
          <nav className="hidden md:flex gap-8">
            <button
              onClick={() => {
                setActiveTab("overview");
                setSelectedUser(null);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition cursor-pointer ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600 hover:text-blue-700"
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
              onClick={() => {
                setActiveTab("manage-users");
                setSelectedUser(null);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition cursor-pointer ${
                activeTab === "manage-users"
                  ? "border-blue-600 text-blue-600 hover:text-blue-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Users
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("export-data");
                setSelectedUser(null);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition cursor-pointer ${
                activeTab === "export-data"
                  ? "border-blue-600 text-blue-600 hover:text-blue-700"
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
            <button
              onClick={() => {
                setActiveTab("user-calendar");
                setSelectedUser(null); // Reset to show current user's calendar
              }}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition cursor-pointer ${
                activeTab === "user-calendar"
                  ? "border-blue-600 text-blue-600 hover:text-blue-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                User Calendar
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("server-management");
                setSelectedUser(null);
              }}
              className={`border-b-2 px-1 py-4 text-sm font-semibold transition cursor-pointer ${
                activeTab === "server-management"
                  ? "border-blue-600 text-blue-600 hover:text-blue-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                Server Management
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile slide-out menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out menu */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex h-full flex-col">
          {/* Mobile menu header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile menu items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setSelectedUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Overview</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("manage-users");
                  setSelectedUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition cursor-pointer ${
                  activeTab === "manage-users"
                    ? "bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Manage Users</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("export-data");
                  setSelectedUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition cursor-pointer ${
                  activeTab === "export-data"
                    ? "bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("user-calendar");
                  setSelectedUser(null); // Reset to show current user's calendar
                  setIsMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition cursor-pointer ${
                  activeTab === "user-calendar"
                    ? "bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>User Calendar</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("server-management");
                  setSelectedUser(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition cursor-pointer ${
                  activeTab === "server-management"
                    ? "bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
                <span>Server Management</span>
              </button>
            </div>
          </nav>

          {/* Mobile menu footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab or Specific User Calendar */}
        {activeTab === "overview" && !selectedUser && (
          <div className="flex flex-col gap-8">
            {/* Stats cards */}
            <div className="order-2 md:order-1 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    <p className="text-sm font-medium text-gray-600">Total Hours This Month</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {users.reduce((sum, r) => sum + r.regularHours + r.overtimeHours, 0).toFixed(0)}
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
            <section className="order-1 md:order-2 rounded-xl border border-gray-200 bg-white shadow-sm">
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
                        Totale Ore
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Ore Straordinarie
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Ore Perm/Ferie
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Ore Malattia
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
                            {row.role === "ADMIN" ? "Amministratore" : "Dipendente"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-gray-900">{(row.regularHours + row.overtimeHours).toFixed(1)}</span>
                            <span className="ml-1 text-sm text-gray-500">hrs</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-orange-600">{row.overtimeHours.toFixed(1)}</span>
                            <span className="ml-1 text-sm text-gray-500">hrs</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-purple-600">{(row.permessoHours + row.vacationHours).toFixed(1)}</span>
                            <span className="ml-1 text-sm text-gray-500">hrs</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-red-600">{row.sicknessHours.toFixed(1)}</span>
                            <span className="ml-1 text-sm text-gray-500">hrs</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Manage Users Tab */}
        {activeTab === "manage-users" && (
          <div>
            {/* Header with Create Button */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
                <p className="mt-2 text-sm text-gray-600">
                  View, edit, delete users and reset their passwords
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreatingUserModalOpen(true);
                  setError(null);
                  setSuccess(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create User
              </button>
            </div>

            {success && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
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
                        Joined
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {users.map((user) => (
                      <tr key={user.id} className="transition hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white">
                              {(user.name ?? "U")[0].toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <p className="font-semibold text-gray-900">{user.name ?? "Unassigned"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {user.role === "ADMIN" ? "Amministratore" : "Dipendente"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {format(user.createdAt, "MMM d, yyyy")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                              title="Edit user"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setResettingPasswordUser(user);
                                setNewPassword("");
                                setConfirmNewPassword("");
                                setError(null);
                                setSuccess(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100"
                              title="Reset password"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                              Reset
                            </button>
                            <button
                              onClick={() => {
                                setDeletingUser(user);
                                setError(null);
                                setSuccess(null);
                              }}
                              disabled={user.id === currentUser.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title={user.id === currentUser.id ? "Cannot delete your own account" : "Delete user"}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                        {(user.regularHours + user.overtimeHours + user.permessoHours) > 0 && (
                          <div className="text-sm font-medium text-gray-600">
                            {(user.regularHours + user.overtimeHours + user.permessoHours).toFixed(1)}h
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
                          const response = await fetch('/api/export-excel', {
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
                          a.download = `hours_export_${exportMonth}.xlsx`;
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
                      {isExporting ? 'Exporting...' : 'Export to Excel'}
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

        {/* Specific User Calendar (from Overview click) */}
        {activeTab === "overview" && selectedUser && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedUser(null)}
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
                    {selectedUser.email} • {selectedUser.role === "ADMIN" ? "Amministratore" : "Dipendente"}
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
              <EmployeeDashboard
                initialEntries={userEntries}
                userName={selectedUser.name ?? selectedUser.email}
                hideHeader={true}
                targetUserId={selectedUser.id}
                onEntrySaved={handleEntrySaved}
              />
            )}
          </div>
        )}

        {/* User Calendar Tab (Current User's Calendar) */}
        {activeTab === "user-calendar" && (
          <div>
            <div className="mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentUser.name ?? currentUser.email}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentUser.email} • {currentUser.role === "ADMIN" ? "Amministratore" : "Dipendente"} (Il Tuo Calendario)
                </p>
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
              <EmployeeDashboard
                initialEntries={userEntries}
                userName={currentUser.name ?? currentUser.email}
                hideHeader={true}
                targetUserId={currentUser.id}
                onEntrySaved={handleEntrySaved}
              />
            )}
          </div>
        )}

        {/* Server Management Tab */}
        {activeTab === "server-management" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Server Management</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Database backup, restore operations, and PM2 process management
                </p>
              </div>

              {/* Database Backup Section */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Database Backup & Restore
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage PostgreSQL database backups with automatic compression and retention policy
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Backup Commands */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Create Backup
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-green-400">npm run backup:db</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Creates an immediate database backup with timestamp in <span className="font-mono">backups/database/</span>
                      </p>
                    </div>
                  </div>

                  {/* Restore Commands */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restore Backup
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-orange-400">npm run restore:db backup_YYYYMMDD_HHMMSS.sql.gz</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        ⚠️ Restores database from backup file. Requires confirmation.
                      </p>
                    </div>
                  </div>

                  {/* Cleanup Commands */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Cleanup Old Backups
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-purple-400">npm run backup:cleanup</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Removes backups older than 30 days, keeps minimum 7 backups
                      </p>
                    </div>
                  </div>

                  {/* Backup Documentation */}
                  <div className="rounded-lg border border-gray-200 bg-blue-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Documentation
                    </h4>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        Complete backup strategy documentation including:
                      </p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li>• Automatic daily backups (2:00 AM)</li>
                        <li>• Weekly cleanup (Sunday 3:00 AM)</li>
                        <li>• Recovery scenarios</li>
                        <li>• Troubleshooting guide</li>
                      </ul>
                      <p className="text-xs font-medium text-blue-600">
                        See <span className="font-mono">BACKUP_STRATEGY.md</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* PM2 Process Management Section */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    PM2 Process Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor and control application processes and background tasks
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* PM2 Status */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Status & List
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-blue-400">pm2 list</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Shows all processes, status, CPU and memory usage
                      </p>
                    </div>
                  </div>

                  {/* PM2 Logs */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Logs
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-yellow-400">npm run pm2:logs</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Real-time application logs stream
                      </p>
                    </div>
                  </div>

                  {/* PM2 Monitor */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Monitor
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-green-400">npm run pm2:monit</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Interactive resource monitoring dashboard
                      </p>
                    </div>
                  </div>

                  {/* PM2 Restart */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restart
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-indigo-400">npm run pm2:restart</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Restart the application process
                      </p>
                    </div>
                  </div>

                  {/* PM2 Stop */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Stop
                    </h4>
                    <div className="space-y-2">
                      <div className="rounded bg-gray-900 p-3">
                        <code className="text-sm text-red-400">npm run pm2:stop</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Stop the application process
                      </p>
                    </div>
                  </div>

                  {/* Cron Jobs Info */}
                  <div className="rounded-lg border border-gray-200 bg-green-50 p-4">
                    <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cron Jobs
                    </h4>
                    <div className="space-y-2">
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                          Backup: Daily at 2:00 AM
                        </li>
                        <li className="flex items-center gap-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-purple-500"></span>
                          Cleanup: Sunday at 3:00 AM
                        </li>
                      </ul>
                      <p className="mt-2 text-xs text-gray-600">
                        Check logs: <span className="font-mono">logs/backup-*.log</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="mt-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
                      <div className="mt-2 text-xs text-yellow-700">
                        <ul className="list-disc space-y-1 pl-5">
                          <li>All commands should be run from the terminal/SSH with proper permissions</li>
                          <li>Database restore operations require explicit confirmation</li>
                          <li>Backups are stored locally in <span className="font-mono">backups/database/</span></li>
                          <li>For production, implement offsite backup strategy (see BACKUP_STRATEGY.md)</li>
                          <li>PM2 commands require server SSH access</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreatingUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Create New User</h2>
                <button
                  onClick={() => {
                    setIsCreatingUserModalOpen(false);
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
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingUserModalOpen(false);
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:from-green-300 disabled:to-green-400"
                >
                  {isCreating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Edit User</h2>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
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
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
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
                  value={editForm.role}
                  onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value as "EMPLOYEE" | "ADMIN" }))}
                  disabled={editingUser?.id === currentUser.id}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                {editingUser?.id === currentUser.id && (
                  <p className="mt-2 text-xs text-amber-600">
                    You cannot change your own role to prevent losing admin access
                  </p>
                )}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400"
                >
                  {isUpdating ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Delete User</h2>
                <button
                  onClick={() => {
                    setDeletingUser(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    This will permanently delete the user <span className="font-semibold">{deletingUser.email}</span> and all their time entries. This action cannot be undone.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingUser(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:from-red-300 disabled:to-red-400"
                >
                  {isDeleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Reset Password</h2>
                <button
                  onClick={() => {
                    setResettingPasswordUser(null);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Resetting password for: <span className="font-semibold text-gray-900">{resettingPasswordUser.email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResettingPasswordUser(null);
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-yellow-700 hover:to-yellow-800 disabled:cursor-not-allowed disabled:from-yellow-300 disabled:to-yellow-400"
                >
                  {isResettingPassword ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
