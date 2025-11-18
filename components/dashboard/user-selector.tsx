"use client";

import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="mb-6 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <label htmlFor="user-select" className="text-sm font-medium text-gray-700">
        Visualizza calendario di:
      </label>
      <select
        id="user-select"
        value={selectedUserId}
        onChange={(e) => handleUserChange(e.target.value)}
        className="block w-64 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-base font-medium text-gray-900"
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
