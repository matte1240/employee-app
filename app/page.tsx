import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to check database at runtime
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { setup?: string };
}) {
  // Check if setup is needed (no users in database)
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    redirect("/setup");
  }

  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  const showSetupSuccess = searchParams.setup === "complete";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-12">
      <div className="flex w-full max-w-5xl flex-col items-center justify-between gap-10 md:flex-row">
        <div className="max-w-xl text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Work Hours Tracker
          </p>
          <h1 className="mt-2 text-4xl font-bold text-zinc-900 sm:text-5xl">
            Track your work hours effortlessly.
          </h1>
          <p className="mt-4 text-base text-zinc-600">
            Log daily activity, review your progress on a calendar, and keep
            managers informed. Admins can review every submission in real-time.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {showSetupSuccess && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 border border-green-200">
              ✓ Setup completed successfully! You can now sign in with your admin account.
            </div>
          )}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
