import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "居遊所 Play Ground",
    template: "%s｜居遊所 Play Ground",
  },
  description: "以遠雄樂元公開資訊製作的建案聯名、遊戲化居家配置與家具導購概念提案。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "遠雄樂元概念提案｜居遊所 Play Ground",
    description: "選格局、玩佈置、買家具、預約賞屋。",
    locale: "zh_TW",
    type: "website",
    images: [{ url: "/og-homeplay-mascot.png", width: 1200, height: 633, alt: "居遊所 Play Ground 原創圓糯居民與粉彩模型屋" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "遠雄樂元概念提案｜居遊所 Play Ground",
    description: "選格局、玩佈置、買家具、預約賞屋。",
    images: ["/og-homeplay-mascot.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
