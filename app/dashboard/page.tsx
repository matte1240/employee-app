import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  // Redirect based on user role
  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  } else {
    redirect("/dashboard/employee-calendar");
  }
}
