import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ManageUsersDev from "@/components/dashboard/manage-users-dev";

export default async function UsersDevPage() {
  const session = await getAuthSession();

  // Solo gli admin possono accedere
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Recupera tutti gli utenti dal database
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return <ManageUsersDev users={users} currentUserId={session.user.id} />;
}
