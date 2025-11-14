import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import EmployeeReports from "@/components/dashboard/employee-reports";

export default async function ReportsPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  if (session.user.role !== "EMPLOYEE") {
    redirect("/dashboard");
  }

  return (
    <EmployeeReports
      userId={session.user.id}
      userName={session.user.name || session.user.email}
      userEmail={session.user.email}
    />
  );
}
