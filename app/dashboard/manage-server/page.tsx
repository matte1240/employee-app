import { ManageServer } from "@/components/dashboard/admin/manage-server";

export const metadata = {
  title: "Gestione Server - Presenze Ivicolors",
  description: "Database backup and restore management",
};

// Auth + admin role enforced by proxy.ts
export default async function ManageServerPage() {
  return <ManageServer />;
}
