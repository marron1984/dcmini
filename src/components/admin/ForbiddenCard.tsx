import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export function ForbiddenCard({
  title = "アクセス権限がありません",
  message = "この機能を利用する権限がありません。管理者にお問い合わせください。",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center text-ink-muted">
          <ShieldAlert className="mb-3 h-8 w-8 text-slate-300" />
          {message}
        </CardContent>
      </Card>
    </>
  );
}
