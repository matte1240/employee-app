"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { signOut } from "next-auth/react";

type NavbarProps = {
  userRole: string;
  userName?: string | null;
  userEmail?: string | null;
};

export default function Navbar({ userRole, userName, userEmail }: NavbarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/" });
    });
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const adminLinks = [
    { href: "/dashboard", label: "Overview", icon: "📊" },
    { href: "/dashboard/users", label: "Utenti", icon: "👥" },
    { href: "/dashboard/calendar", label: "Calendario", icon: "📅" },
    { href: "/dashboard/reports", label: "Report", icon: "📈" },
  ];

  const employeeLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/employee-reports", label: "Report", icon: "📈" },
    { href: "/dashboard/profile", label: "Profilo", icon: "👤" },
  ];

  const links = userRole === "ADMIN" ? adminLinks : employeeLinks;

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo/Brand */}
            <div className="flex items-center h-full">
              <Link href="/dashboard" className="flex items-center h-full py-3">
                <img
                  src="/logo.svg"
                  alt="Ivicolors"
                  className="h-full w-auto"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span className="mr-1">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userName || userEmail}
                </div>
                <div className="text-xs text-gray-500">
                  {userRole === "ADMIN" ? "Amministratore" : "Dipendente"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "..." : "Esci"}
              </button>
            </div>

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="md:hidden inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "..." : "Esci"}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <span className="text-lg font-bold text-white">
                  {(userName || userEmail || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {userName || userEmail}
                </div>
                <div className="text-xs text-blue-100">
                  {userRole === "ADMIN" ? "Amministratore" : "Dipendente"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                  {isActive && (
                    <svg className="ml-auto h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer */}
          <div className="border-t border-gray-200 px-4 py-4">
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isPending ? "Disconnessione..." : "Esci"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
