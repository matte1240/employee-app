import { redirect } from "next/navigation";
import LoginForm from "@/components/login-form";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering to check database at runtime
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  // Check if setup is needed (no users in database)
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    redirect("/setup");
  }

  const session = await getAuthSession();

  if (session) {
    // All users go to /dashboard, which handles role-based display
    redirect("/dashboard");
  }

  const params = await searchParams;
  const showSetupSuccess = params.setup === "complete";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ivicolors" className="h-12 brightness-0 invert" />
          </div>
          <h1 className="mt-16 text-4xl font-bold text-white leading-tight">
            Employee Work Hours Tracker
          </h1>
          <p className="mt-6 text-lg text-blue-100 leading-relaxed">
            Track your daily activities, manage your time efficiently, and keep your team informed with our intuitive time tracking system.
          </p>
        </div>
        <div className="space-y-4 text-blue-100">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-white">Easy Time Logging</p>
              <p className="text-sm">Click any day to log your work hours with morning and afternoon shifts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-white">Overtime Tracking</p>
              <p className="text-sm">Automatic calculation of regular and overtime hours</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-white">Admin Dashboard</p>
              <p className="text-sm">Real-time overview of team activity and hours worked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/logo.svg" alt="Ivicolors" className="h-10 mx-auto" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="mt-2 text-sm text-gray-600">
                Sign in to your account to continue
              </p>
            </div>

            {showSetupSuccess && (
              <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-green-800 font-medium">
                    Setup completed successfully! You can now sign in with your admin account.
                  </p>
                </div>
              </div>
            )}

            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            © 2025 Ivicolors. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
