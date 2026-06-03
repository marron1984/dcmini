import Script from "next/script";

// Google Analytics / GTM / Google広告 タグ設置エリア（24. MVP: タグ設置用エリア）
// 環境変数が設定されている場合のみ出力する。
export function Analytics() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  const ads = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  return (
    <>
      {gtm && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
      {(ga || ads) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga || ads}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${ga ? `gtag('config', '${ga}');` : ""}
${ads ? `gtag('config', '${ads}');` : ""}`}
          </Script>
        </>
      )}
    </>
  );
}
