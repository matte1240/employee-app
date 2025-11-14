"use client";

import { useState, useTransition, FormEvent } from "react";
import { signIn } from "next-auth/react";

const initialState = {
  email: "",
  password: "",
};

export default function LoginForm() {
  const [formState, setFormState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        redirect: false,
        email: formState.email,
        password: formState.password,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      // All users go to /dashboard, which handles role-based display
      window.location.href = "/dashboard";
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={formState.email}
          onChange={(event) =>
            setFormState((state) => ({ ...state, email: event.target.value }))
          }
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="your.email@company.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={formState.password}
          onChange={(event) =>
            setFormState((state) => ({ ...state, password: event.target.value }))
          }
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 border border-red-200">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
