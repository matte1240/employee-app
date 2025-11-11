"use client";

import { useState, useTransition, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const initialState = {
  email: "",
  password: "",
};

export default function LoginForm() {
  const router = useRouter();
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
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result?.url ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm"
    >
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Welcome back</h2>
        <p className="mt-1 text-sm text-zinc-500">Log in with your company credentials.</p>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
        Email
        <input
          type="email"
          required
          value={formState.email}
          onChange={(event) =>
            setFormState((state) => ({ ...state, email: event.target.value }))
          }
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
        Password
        <input
          type="password"
          required
          value={formState.password}
          onChange={(event) =>
            setFormState((state) => ({ ...state, password: event.target.value }))
          }
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="••••••••"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex h-10 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
  {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
