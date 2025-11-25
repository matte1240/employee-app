"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { User } from "@/types/models";
import StatsCard from "./stats-card";

type UserAggregate = User & {
  regularHours: number;
  overtimeHours: number;
  permessoHours: number;
  sicknessHours: number;
  vacationHours: number;
};

type AdminOverviewProps = {
  users: UserAggregate[];
};

export default function AdminOverview({ users }: AdminOverviewProps) {
  const now = new Date();
  const currentMonth = format(now, "MMMM yyyy", { locale: it });

  // Calculate leaderboard using useMemo to avoid setState in effect
  const leaderboardData = useMemo(() => {
    let maxHours = -1; let maxHoursId: string | null = null;
    let maxOver = -1; let maxOverId: string | null = null;
    let maxPerm = -1; let maxPermId: string | null = null;
    let maxSick = -1; let maxSickId: string | null = null;

    for (const user of users) {
      const total = user.regularHours + user.overtimeHours;
      if (total > maxHours) { 
        maxHours = total; 
        maxHoursId = user.id; 
      }
      if (user.overtimeHours > maxOver) { 
        maxOver = user.overtimeHours; 
        maxOverId = user.id; 
      }
      const permsum = user.permessoHours + user.vacationHours;
      if (permsum > maxPerm) { 
        maxPerm = permsum; 
        maxPermId = user.id; 
      }
      if (user.sicknessHours > maxSick) { 
        maxSick = user.sicknessHours; 
        maxSickId = user.id; 
      }
    }

    const findName = (id: string | null) => {
      if (!id) return '—';
      const u = users.find((x) => x.id === id);
      return u ? (u.name || u.email) : id;
    };

    return {
      topHoursUser: maxHoursId ? { id: maxHoursId, name: findName(maxHoursId), value: Math.max(0, maxHours) } : null,
      topOvertimeUser: maxOverId ? { id: maxOverId, name: findName(maxOverId), value: Math.max(0, maxOver) } : null,
      topPermessoUser: maxPermId ? { id: maxPermId, name: findName(maxPermId), value: Math.max(0, maxPerm) } : null,
      topSicknessUser: maxSickId ? { id: maxSickId, name: findName(maxSickId), value: Math.max(0, maxSick) } : null,
    };
  }, [users]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
      {/* Leaderboard Cards (mese corrente) */}
      <div className="grid gap-6 md:grid-cols-4 mb-8 order-2 md:order-1">
        <StatsCard
          title={`Più Ore (${currentMonth})`}
          value={leaderboardData.topHoursUser ? leaderboardData.topHoursUser.name : '—'}
          color="green"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Più Straordinarie"
          value={leaderboardData.topOvertimeUser ? leaderboardData.topOvertimeUser.name : '—'}
          color="orange"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatsCard
          title="Più Perm/Ferie"
          value={leaderboardData.topPermessoUser ? leaderboardData.topPermessoUser.name : '—'}
          color="purple"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatsCard
          title="Più Malattia (ore)"
          value={leaderboardData.topSicknessUser ? leaderboardData.topSicknessUser.name : '—'}
          color="red"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden order-1 md:order-2 mb-8 md:mb-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Utenti e Ore Lavorate</h2>
            <Link
              href="/dashboard/users"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Gestisci Utenti
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Ruolo
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ore Totali
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ore Straordinarie
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ore Perm/Ferie
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ore Malattia
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const totalUserHours = user.regularHours + user.overtimeHours;
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                          ) : (
                            <span className="text-blue-600 font-semibold text-sm">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role === "ADMIN" ? "Amministratore" : "Dipendente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {totalUserHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-orange-600 font-medium">
                        {user.overtimeHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-purple-600 font-medium">
                        {(user.permessoHours + user.vacationHours).toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-red-600 font-medium">
                        {user.sicknessHours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href={`/dashboard/calendar?userId=${user.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Vedi Calendario
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
