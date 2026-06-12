import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { ToastProvider } from "@/components/ui/toast";
import { getCurrentUser } from "@/lib/auth";
import { getCampaignData } from "@/lib/data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Nombre de la campaña para la barra superior (puede no existir aún).
  let campaignName = "Dashboard de Pauta";
  try {
    const data = await getCampaignData();
    if (data) campaignName = data.campaign.name;
  } catch {
    // Sin Supabase configurado: la página interna mostrará el aviso.
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar role={user.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={campaignName} username={user.name ?? user.username} role={user.role} />
          <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
