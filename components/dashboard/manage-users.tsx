"use client";

import { format } from "date-fns";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User, UserRole } from "@/types/models";

type ManageUsersProps = {
  users: User[];
  currentUserId: string;
  devMode?: boolean; // Controls whether to show DEV features (manual password setting)
};

type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

type EditUserForm = {
  name: string;
  email: string;
  role: UserRole;
};

export default function ManageUsers({ users, currentUserId, devMode = false }: ManageUsersProps) {
  const router = useRouter();

  // Modal states
  const [isCreatingUserModalOpen, setIsCreatingUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);
  
  // Manual password toggle states (for production mode with admin control)
  const [manualPasswordCreate, setManualPasswordCreate] = useState(false);
  const [manualPasswordReset, setManualPasswordReset] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
  });
  const [editForm, setEditForm] = useState<EditUserForm>({
    name: "",
    email: "",
    role: "EMPLOYEE",
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Transition states
  const [isCreating, startCreating] = useTransition();
  const [isUpdating, startUpdating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isResettingPassword, startResettingPassword] = useTransition();

  // Message states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Crea Utente Handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate password when manual password is enabled (either devMode or manualPasswordCreate)
    const useManualPassword = devMode || manualPasswordCreate;
    if (useManualPassword) {
      if (createForm.password !== createForm.confirmPassword) {
        setError("Le password non coincidono");
        return;
      }
      if (createForm.password.length < 8) {
        setError("La password deve contenere almeno 8 caratteri");
        return;
      }
    }

    startCreating(async () => {
      try {
        const endpoint = devMode ? "/api/users/create-dev" : "/api/users/create";
        const body = useManualPassword
          ? {
              name: createForm.name,
              email: createForm.email,
              password: createForm.password,
              role: createForm.role,
            }
          : {
              name: createForm.name,
              email: createForm.email,
              role: createForm.role,
            };

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Impossibile creare l'utente");
          return;
        }

        const successMessage = useManualPassword
          ? `Utente ${createForm.email} creato con successo!`
          : `Utente ${createForm.email} creato! Riceverà un'email per impostare la password.`;

        setSuccess(successMessage);
        setCreateForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "EMPLOYEE",
        });
        setManualPasswordCreate(false); // Reset toggle
        setIsCreatingUserModalOpen(false);
        router.refresh();
      } catch (err) {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  // Modifica Utente Handler
  const handleEditClick = (user: User) => {
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
          setError(data.error || "Impossibile aggiornare l'utente");
          return;
        }

        setSuccess("Utente aggiornato con successo!");
        setEditingUser(null);
        router.refresh();
      } catch (err) {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  // Elimina Utente Handler
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
          setError(data.error || "Impossibile eliminare l'utente");
          return;
        }

        setSuccess(`Utente ${deletingUser.email} eliminato con successo!`);
        setDeletingUser(null);
        router.refresh();
      } catch (err) {
        setError("Si è verificato un errore imprevisto");
      }
    });
  };

  // Reimposta Password Handler
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordUser) return;

    setError(null);
    setSuccess(null);

    const useManualPassword = devMode || manualPasswordReset;

    if (useManualPassword) {
      // Manual password reset
      if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
        setError("Le password non coincidono");
        return;
      }
      if (resetPasswordForm.newPassword.length < 8) {
        setError("La password deve contenere almeno 8 caratteri");
        return;
      }

      startResettingPassword(async () => {
        try {
          const endpoint = devMode 
            ? `/api/users/${resettingPasswordUser.id}/reset-password-dev`
            : `/api/users/${resettingPasswordUser.id}/reset-password`;
            
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword: resetPasswordForm.newPassword }),
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.error || "Impossibile reimpostare la password");
            return;
          }

          setSuccess(`Password reimpostata con successo per ${resettingPasswordUser.email}!`);
          setResettingPasswordUser(null);
          setResetPasswordForm({ newPassword: "", confirmPassword: "" });
          setManualPasswordReset(false); // Reset toggle
        } catch (err) {
          setError("Si è verificato un errore imprevisto");
        }
      });
    } else {
      // Production mode: Email-based reset
      startResettingPassword(async () => {
        try {
          const response = await fetch(`/api/users/${resettingPasswordUser.id}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          const data = await response.json();

          if (!response.ok) {
            setError(data.error || "Impossibile inviare l'email di reset");
            return;
          }

          setSuccess(`Email di reset inviata a ${resettingPasswordUser.email}!`);
          setResettingPasswordUser(null);
        } catch (err) {
          setError("Si è verificato un errore imprevisto");
        }
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Create Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestione Utenti{devMode ? " DEV" : ""}
          </h2>
          {devMode && (
            <p className="mt-2 text-sm text-gray-600">
              Modalità sviluppo: imposta le password manualmente (nessuna email verrà inviata)
            </p>
          )}
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
          Crea Utente
        </button>
      </div>

      {/* Success Message */}
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

      {/* Error Message */}
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
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Ruolo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Registrato
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Azioni
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
                        <p className="font-semibold text-gray-900">{user.name ?? "Non assegnato"}</p>
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
                        title="Modifica utente"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifica
                      </button>
                      <button
                        onClick={() => {
                          setResettingPasswordUser(user);
                          setResetPasswordForm({ newPassword: "", confirmPassword: "" });
                          setError(null);
                          setSuccess(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100"
                        title="Reimposta password"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Reimposta
                      </button>
                      <button
                        onClick={() => {
                          setDeletingUser(user);
                          setError(null);
                          setSuccess(null);
                        }}
                        disabled={user.id === currentUserId}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title={user.id === currentUserId ? "Non puoi eliminare il tuo account" : "Elimina utente"}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crea Utente Modal */}
      {isCreatingUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Crea Nuovo Utente</h2>
                <button
                  onClick={() => {
                    setIsCreatingUserModalOpen(false);
                    setCreateForm({
                      name: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      role: "EMPLOYEE",
                    });
                    setManualPasswordCreate(false);
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
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="mario.rossi@esempio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ruolo
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                >
                  <option value="EMPLOYEE">Dipendente</option>
                  <option value="ADMIN">Amministratore</option>
                </select>
              </div>

              {/* Manual Password Toggle (only show in production mode, not in dev mode) */}
              {!devMode && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="manualPasswordCreate"
                    checked={manualPasswordCreate}
                    onChange={(e) => setManualPasswordCreate(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="manualPasswordCreate" className="flex-1 cursor-pointer">
                    <span className="text-sm font-semibold text-blue-900">
                      Imposta password manualmente
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Quando attivo, puoi impostare la password direttamente senza inviare email all'utente
                    </p>
                  </label>
                </div>
              )}

              {(devMode || manualPasswordCreate) && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Almeno 8 caratteri"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Conferma Password
                    </label>
                    <input
                      type="password"
                      value={createForm.confirmPassword}
                      onChange={(e) => setCreateForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Ripeti la password"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm">
                      <p className="font-semibold text-amber-900 mb-1">
                        Modalità DEV Attiva
                      </p>
                      <p className="text-amber-800">
                        Imposti manualmente la password. Nessuna email verrà inviata all'utente.
                        Questa modalità è da usare solo per test e sviluppo.
                      </p>
                    </div>
                  </div>
                </>
              )}

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
                    setCreateForm({
                      name: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      role: "EMPLOYEE",
                    });
                    setManualPasswordCreate(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:from-green-300 disabled:to-green-400"
                >
                  {isCreating ? "Creazione..." : "Crea Utente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modifica Utente Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Modifica Utente</h2>
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
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="mario.rossi@esempio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ruolo
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  disabled={editingUser?.id === currentUserId}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="EMPLOYEE">Dipendente</option>
                  <option value="ADMIN">Amministratore</option>
                </select>
                {editingUser?.id === currentUserId && (
                  <p className="mt-2 text-xs text-amber-600">
                    Non puoi modificare il tuo ruolo per evitare di perdere l'accesso amministratore
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
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-400"
                >
                  {isUpdating ? "Aggiornamento..." : "Aggiorna Utente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Elimina Utente Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Elimina Utente</h2>
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
                  <h3 className="text-lg font-semibold text-gray-900">Sei sicuro?</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Questo eliminerà permanentemente l'utente <span className="font-semibold">{deletingUser.email}</span> e tutte le sue registrazioni orarie. Questa azione non può essere annullata.
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
                  Annulla
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:from-red-300 disabled:to-red-400"
                >
                  {isDeleting ? "Eliminazione..." : "Elimina Utente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reimposta Password Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Reimposta Password</h2>
                <button
                  onClick={() => {
                    setResettingPasswordUser(null);
                    setResetPasswordForm({ newPassword: "", confirmPassword: "" });
                    setManualPasswordReset(false);
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
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 mb-1">
                      Reimpostazione password per:
                    </p>
                    <p className="text-amber-800 font-medium">{resettingPasswordUser.email}</p>
                    <p className="text-amber-700 mt-2">
                      {devMode
                        ? "Modalità DEV: imposta manualmente la nuova password. Nessuna email verrà inviata."
                        : manualPasswordReset
                          ? "Imposta manualmente la nuova password. Nessuna email verrà inviata."
                          : "Verrà inviata un'email con il link per reimpostare la password."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Password Toggle (only show in production mode, not in dev mode) */}
              {!devMode && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="manualPasswordReset"
                    checked={manualPasswordReset}
                    onChange={(e) => setManualPasswordReset(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="manualPasswordReset" className="flex-1 cursor-pointer">
                    <span className="text-sm font-semibold text-blue-900">
                      Imposta password manualmente
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Quando attivo, puoi impostare la password direttamente senza inviare email all'utente
                    </p>
                  </label>
                </div>
              )}

              {(devMode || manualPasswordReset) && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nuova Password
                    </label>
                    <input
                      type="password"
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Almeno 8 caratteri"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Conferma Nuova Password
                    </label>
                    <input
                      type="password"
                      value={resetPasswordForm.confirmPassword}
                      onChange={(e) => setResetPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      required
                      minLength={8}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Ripeti la password"
                    />
                  </div>
                </>
              )}

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
                    setResetPasswordForm({ newPassword: "", confirmPassword: "" });
                    setManualPasswordReset(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-700 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-yellow-700 hover:to-yellow-800 disabled:cursor-not-allowed disabled:from-yellow-300 disabled:to-yellow-400"
                >
                  {isResettingPassword 
                    ? "Reimpostazione..." 
                    : (devMode || manualPasswordReset) 
                      ? "Reimposta Password" 
                      : "Invia Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
