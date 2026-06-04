import { PageHeader } from "@/components/admin/PageHeader";
import { ToursManager } from "@/components/admin/ToursManager";
import { getTours, getLeads, getFacilities, getStaffUsers } from "@/lib/data/admin";
import { checkSectionAccess } from "@/lib/guard";
import { ForbiddenCard } from "@/components/admin/ForbiddenCard";

export default async function ToursPage() {
  const { ok } = await checkSectionAccess("tours");
  if (!ok) return <ForbiddenCard />;

  const [tours, leads, facilities, staff] = await Promise.all([
    getTours(),
    getLeads(),
    getFacilities(),
    getStaffUsers(),
  ]);

  const leadOptions = leads.map((l) => ({
    id: l.id,
    consultant_name: l.consultant_name,
    resident_name: l.resident_name,
  }));
  const facilityOptions = facilities.map((f) => ({ id: f.id, name: f.name }));

  return (
    <>
      <PageHeader title="見学管理" description={`${tours.length}件の見学`} />
      <ToursManager
        tours={tours}
        leads={leadOptions}
        facilities={facilityOptions}
        staff={staff}
      />
    </>
  );
}
