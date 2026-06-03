import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 lg:flex-row">
      <Sidebar user={user} />
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
