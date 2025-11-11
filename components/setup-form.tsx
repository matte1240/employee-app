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
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800" role="alert">
            {error}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isPending ? "Creating account..." : "Create Administrator Account"}
      </button>
    </form>
  );
}
