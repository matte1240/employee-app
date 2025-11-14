import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ExportData from "@/components/dashboard/export-data";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
};

export default async function ReportsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = (await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })) as UserRow[];

  return <ExportData users={users} />;
}
