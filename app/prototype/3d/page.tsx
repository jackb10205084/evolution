import type { Metadata } from "next";
import { GamefeelPrototype } from "./gamefeel-prototype";

export const metadata: Metadata = {
  title: "3D 遊戲感原型",
  description: "居遊所 Play Ground 的四種遊戲化 3D 體驗方向。",
};

type Props = {
  searchParams: Promise<{ variant?: string }>;
};

export default async function GamefeelPrototypePage({ searchParams }: Props) {
  const { variant } = await searchParams;
  const initialVariant = variant === "B" || variant === "C" || variant === "D" ? variant : "A";
  return <GamefeelPrototype initialVariant={initialVariant} />;
}
