import { PageHeader } from "@/components/admin/PageHeader";
import { AdReportManager } from "@/components/admin/AdReportManager";
import { getAdReports } from "@/lib/data/admin";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function AdsPage() {
  const { ok } = await checkSectionAccess("ads");
  if (!ok) return <ForbiddenCard />;

  const reports = await getAdReports();
  return (
    <>
      <PageHeader
        title="広告管理"
        description="Google広告レポートの手入力管理（CPA・入居単価を自動計算）"
      />
      <AdReportManager reports={reports} />
    </>
  );
}
