import { ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { UserRow } from "@/components/admin/UserRow";
import { getCurrentUser } from "@/lib/auth";
import { getAllUsers } from "@/lib/data/admin";

export default async function UsersPage() {
  const me = await getCurrentUser();

  // ユーザー管理は管理者のみ
  if (me?.role !== "admin") {
    return (
      <>
        <PageHeader title="ユーザー管理" />
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center text-ink-muted">
            <ShieldAlert className="mb-3 h-8 w-8 text-slate-300" />
            ユーザー管理は管理者のみ利用できます。
          </CardContent>
        </Card>
      </>
    );
  }

  const users = await getAllUsers();

  return (
    <>
      <PageHeader
        title="ユーザー管理"
        description="社内スタッフの権限・有効状態を管理します"
      />

      <Card>
        <CardContent className="px-0 py-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">スタッフ</th>
                  <th className="px-4 py-3 font-semibold">権限</th>
                  <th className="px-4 py-3 font-semibold">状態</th>
                  <th className="px-4 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u.id} user={u} isSelf={u.id === me.id} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-ink-muted">
        新しいスタッフは Supabase Auth でユーザーを作成すると自動的に一覧へ追加されます（初期権限は相談員）。
      </p>
    </>
  );
}
