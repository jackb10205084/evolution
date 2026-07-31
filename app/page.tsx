import type { Metadata } from "next";
import { HomePlayApp } from "./home-play-app";

export const metadata: Metadata = {
  title: "居遊所 Play Ground × 河岸青",
  description: "像玩遊戲一樣打造未來家，配置真實家具、預約賞屋，再把靈感帶進生活。",
};

export default function Home() {
  return <HomePlayApp />;
}
