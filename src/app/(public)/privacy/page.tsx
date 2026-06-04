import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "プライバシーポリシー",
  description: `${SITE_NAME}のプライバシーポリシー（個人情報保護方針）です。`,
};

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "1. 個人情報の取得について",
    body: [
      "当サービスは、入居相談フォーム・お電話・LINE等を通じて、お名前・ご連絡先・ご相談内容など、サービス提供に必要な範囲で個人情報を取得します。",
    ],
  },
  {
    h: "2. 利用目的",
    body: [
      "取得した個人情報は、以下の目的で利用します。",
      "・入居相談への対応、施設のご提案、見学・入居の調整のため",
      "・ご連絡、ご案内、アフターフォローのため",
      "・サービス品質の向上および統計的分析のため",
    ],
  },
  {
    h: "3. 第三者提供について",
    body: [
      "ご相談対応のため、ご紹介する施設等へ必要な範囲で情報を提供する場合があります。法令に基づく場合を除き、ご本人の同意なく目的外の第三者提供は行いません。",
    ],
  },
  {
    h: "4. 安全管理措置",
    body: [
      "個人情報の漏えい・滅失・毀損の防止のため、SSLによる通信の暗号化、アクセス権限の管理、操作ログの記録等、適切な安全管理措置を講じます。",
    ],
  },
  {
    h: "5. アクセス解析・広告",
    body: [
      "当サイトでは、Google Analytics 等のアクセス解析ツールおよび広告配信のため、Cookie等を利用する場合があります。これらにより個人を特定する情報は取得しません。ブラウザ設定によりCookieを無効化できます。",
    ],
  },
  {
    h: "6. 開示・訂正・利用停止",
    body: [
      "ご本人からの個人情報の開示・訂正・削除・利用停止のお申し出には、本人確認のうえ、法令に従い適切に対応します。",
    ],
  },
  {
    h: "7. お問い合わせ・改定",
    body: [
      "本ポリシーに関するお問い合わせは、当サイト記載の連絡先までご連絡ください。なお、本ポリシーは必要に応じて改定する場合があります。",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <p className="section-eyebrow justify-center">個人情報保護方針</p>
        <h1 className="heading-underline text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          プライバシーポリシー
        </h1>
      </div>

      <div className="mt-10 space-y-7 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8">
        <p className="text-ink-soft">
          {SITE_NAME}（以下「当サービス」）は、ご相談者さまの個人情報を適切に保護することを重要な責務と考え、以下の方針に基づき個人情報を取り扱います。
        </p>
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-base font-bold text-ink">{s.h}</h2>
            <div className="mt-2 space-y-1.5 leading-relaxed text-ink-soft">
              {s.body.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>
        ))}
        <p className="border-t border-slate-100 pt-5 text-sm text-ink-muted">
          制定日：2026年6月1日
        </p>
      </div>
    </div>
  );
}
