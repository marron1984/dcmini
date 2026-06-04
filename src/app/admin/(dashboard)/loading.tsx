import { Skeleton } from "@/components/ui/spinner";

// 管理画面の遷移中スケルトン
export default function Loading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="mt-6 h-64" />
    </div>
  );
}
