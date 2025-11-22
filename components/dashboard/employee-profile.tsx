"use client";

import { useState, useTransition, useRef } from "react";
import { format } from "date-fns";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { User } from "@/types/models";

type EmployeeProfileProps = {
  user: User;
};

export default function EmployeeProfile({ user }: EmployeeProfileProps) {
  const { update } = useSession();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, startUpdating] = useTransition();
  
  // Image upload state
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(user.image);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`/api/users/${user.id}/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setAvatarUrl(data.imageUrl);
      setSuccess("Immagine profilo aggiornata!");
      
      // Update session to reflect new image in navbar
      await update();
      
      // Force a router refresh to update server components if needed
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Errore durante il caricamento dell'immagine");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    if (newPassword.length < 8) {
      setError("La password deve essere lunga almeno 8 caratteri");
      return;
    }

    startUpdating(async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Errore nel cambio password");
          return;
        }

        setSuccess("Password cambiata con successo!");
        setIsEditingPassword(false);
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        console.error(err);
        setError("Errore imprevisto");
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex items-end -mt-16 mb-4">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg border-4 border-white overflow-hidden group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user.name || "Profile"}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-blue-600">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              )}
              
              {/* Overlay for upload */}
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || "N/A"}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {user.role === "ADMIN" ? "Amministratore" : "Dipendente"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-800">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Profilo</h2>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Nome completo</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name || "N/A"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ruolo</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.role === "ADMIN" ? "Amministratore" : "Dipendente"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Data registrazione</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {format(new Date(user.createdAt), "dd MMMM yyyy")}
            </dd>
          </div>
        </dl>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sicurezza</h2>
            <p className="text-sm text-gray-600 mt-1">Gestisci la tua password</p>
          </div>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cambia Password
            </button>
          )}
        </div>

        {isEditingPassword && (
          <form onSubmit={handlePasswordChange} className="border-t border-gray-200 pt-4 space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nuova Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Minimo 8 caratteri"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Conferma Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ripeti la password"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? "Salvataggio..." : "Salva Password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        )}

        {!isEditingPassword && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">
              Password configurata. Usa il pulsante sopra per cambiarla.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
