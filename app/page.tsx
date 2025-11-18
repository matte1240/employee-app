import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";

// Force dynamic rendering to check database at runtime
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string; expired?: string; passwordReset?: string }>;
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
  const showExpiredMessage = params.expired === "true";
  const showPasswordResetSuccess = params.passwordReset === "true";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <Image src="/logo.svg" alt="Ivicolors" width={56} height={56} className="h-14 w-auto" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
            Gestione Presenze e Orari
          </h1>
          <p className="text-lg text-slate-700 leading-relaxed max-w-md">
            Traccia le tue attività giornaliere, gestisci il tuo tempo in modo efficiente e mantieni il team sincronizzato con il nostro sistema intuitivo.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:shadow-xl transition-shadow shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">Registrazione Semplice</p>
              <p className="text-sm text-slate-600">Clicca su un giorno per registrare le ore, inclusi i turni mattutini e pomeridiani</p>
            </div>
          </div>
          <div className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:shadow-xl transition-shadow shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">Monitoraggio Straordinari</p>
              <p className="text-sm text-slate-600">Calcolo automatico delle ore ordinarie e degli straordinari</p>
            </div>
          </div>
          <div className="flex items-start gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center group-hover:shadow-xl transition-shadow shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 4 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">Pannello Amministratore</p>
              <p className="text-sm text-slate-600">Panoramica in tempo reale delle attività del team e delle ore lavorate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Image src="/logo.svg" alt="Ivicolors" width={48} height={48} className="h-12 mx-auto w-auto" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 pointer-events-none rounded-2xl" />

            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Bentornato</h2>
                <p className="text-sm text-slate-600">
                  Accedi al tuo account per continuare
                </p>
              </div>

              {showSetupSuccess && (
                <div className="mb-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-800 font-medium pt-1">
                      Configurazione completata con successo! Ora puoi accedere con il tuo account amministratore.
                    </p>
                  </div>
                </div>
              )}

              {showPasswordResetSuccess && (
                <div className="mb-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border border-green-200/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-800 font-medium pt-1">
                      Password aggiornata con successo! Ora puoi accedere.
                    </p>
                  </div>
                </div>
              )}

              {showExpiredMessage && (
                <div className="mb-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 border border-orange-200/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-orange-800 font-medium pt-1">
                      La sessione è scaduta per inattività. Effettua nuovamente il login.
                    </p>
                  </div>
                </div>
              )}

              <LoginForm />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © 2025 Ivicolors. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  );
}
