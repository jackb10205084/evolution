import type { Metadata } from "next";
import { HomePlayApp } from "./home-play-app";

export const metadata: Metadata = {
  title: "居遊所 Play Ground × 遠雄樂元｜概念提案",
  description: "以遠雄樂元公開建案資訊製作的遊戲化賞屋與家具配置概念提案。",
};

export default function Home() {
  return <HomePlayApp />;
}
