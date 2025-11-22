"use client";

import { useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SetupForm() {
  const router = useRouter();
  const [formState, setFormState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showRestore, setShowRestore] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleRestore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!restoreFile) {
      setError("Please select a backup file");
      return;
    }

    setIsRestoring(true);

    try {
      const formData = new FormData();
      formData.append("file", restoreFile);

      const response = await fetch("/api/db/restore", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Restore failed");
        setIsRestoring(false);
        return;
      }

      // Restore successful
      setRestoreSuccess(true);
      setIsRestoring(false);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/?restored=true");
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred during restore");
      console.error(err);
      setIsRestoring(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Validate password match
    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formState.name,
            email: formState.email,
            password: formState.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Setup failed");
          return;
        }

        // Setup successful, redirect to login
        router.push("/?setup=complete");
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      }
    });
  };

  if (showRestore) {
    return (
      <div className="mt-8 space-y-6">
        <form
          onSubmit={handleRestore}
          className="rounded-xl border border-zinc-200 bg-white/80 p-8 shadow-lg backdrop-blur-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-zinc-900">
            Restore from Backup
          </h3>
          <p className="mb-6 text-sm text-zinc-600">
            Upload a backup file (.sql) to restore your database. This will replace all current data.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="backup-file" className="block text-sm font-medium text-zinc-700">
                Backup File
              </label>
              <input
                id="backup-file"
                name="backup-file"
                type="file"
                accept=".sql"
                required
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {restoreSuccess && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800">
                  Database restored successfully! Redirecting...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800" role="alert">
                  {error}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowRestore(false);
                setError(null);
                setRestoreFile(null);
              }}
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              disabled={isRestoring}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRestoring || !restoreFile}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isRestoring ? "Restoring..." : "Restore Database"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setShowRestore(false);
              setError(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-xl border border-zinc-200 bg-white/80 p-8 shadow-lg backdrop-blur-sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formState.name}
            onChange={(event) =>
              setFormState((state) => ({ ...state, name: event.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formState.email}
            onChange={(event) =>
              setFormState((state) => ({ ...state, email: event.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="admin@company.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={formState.password}
            onChange={(event) =>
              setFormState((state) => ({ ...state, password: event.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-zinc-500">Minimum 8 characters</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={formState.confirmPassword}
            onChange={(event) =>
              setFormState((state) => ({ ...state, confirmPassword: event.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isPending ? "Creating account..." : "Create Administrator Account"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-zinc-500">Or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowRestore(true)}
        className="flex w-full justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
      >
        Restore from Backup
      </button>
    </form>
  );
}
