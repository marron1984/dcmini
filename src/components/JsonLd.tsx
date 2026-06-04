// 構造化データ(JSON-LD)を出力する共通コンポーネント。
// 検索エンジンのリッチリザルト（FAQ・記事・運営者情報）に対応。
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
