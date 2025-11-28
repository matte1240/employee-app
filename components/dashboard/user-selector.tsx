"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string | null;
  email: string;
};

type UserSelectorProps = {
  users: User[];
  selectedUserId: string;
};

export default function UserSelector({ users, selectedUserId }: UserSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUserChange = (userId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) {
      params.set("userId", userId);
    } else {
      params.delete("userId");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <label htmlFor="user-select" className="text-sm font-medium text-foreground flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        Visualizza calendario di:
      </label>
      <select
        id="user-select"
        value={selectedUserId}
        onChange={(e) => handleUserChange(e.target.value)}
        className="block w-64 rounded-lg border border-input bg-background px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-base font-medium text-foreground"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.email}
          </option>
        ))}
      </select>
    </div>
  );
}