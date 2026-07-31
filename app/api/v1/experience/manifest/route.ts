import { catalog, floorplans, themes } from "../../../../lib/catalog";

export function GET() {
  return Response.json({
    data: {
      schemaVersion: "1.0",
      tenant: { id: "tenant-homeplay", name: "居遊所 Play Ground" },
      project: { id: "project-riverside-green", name: "河岸青", builder: "森沐建設", publishedVersion: 1 },
      floorplans,
      themes,
      catalog,
      capabilities: {
        explore: true,
        decorate: true,
        photorealRender: "adapter",
        socialLogin: ["google", "apple", "line"],
        commerce: "ecpay-adapter",
      },
    },
  });
}
