import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getAdminUser } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
