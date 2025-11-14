import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import Navbar from "@/components/navbar";
import ActivityTracker from "@/components/activity-tracker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <ActivityTracker />
      <Navbar
        userRole={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <main>{children}</main>
    </div>
  );
}
