import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ManageUsers from "@/components/dashboard/manage-users";
import type { User } from "@/types/models";

export default async function UsersDevPage() {
  // Guard: DEV route only accessible in development
  if (process.env.NODE_ENV === "production") {
    redirect("/dashboard");
  }

  const session = await getAuthSession();

  // Solo gli admin possono accedere
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Recupera tutti gli utenti dal database
  const users = (await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  })) as User[];

  return <ManageUsers users={users} currentUserId={session.user.id} devMode={true} />;
}
