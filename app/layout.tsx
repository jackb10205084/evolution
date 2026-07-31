import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "居遊所 Play Ground",
    template: "%s｜居遊所 Play Ground",
  },
  description: "建案聯名、遊戲化居家配置與真實家具購物，一次完成你的未來生活提案。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "先住進你的未來生活｜居遊所 Play Ground",
    description: "選格局、玩佈置、買家具、預約賞屋。",
    locale: "zh_TW",
    type: "website",
    images: [{ url: "/og-homeplay.png", width: 1200, height: 630, alt: "居遊所 Play Ground Q 版模型屋" }],
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
