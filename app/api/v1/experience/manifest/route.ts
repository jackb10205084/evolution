import { catalog, floorplans, themes } from "../../../../lib/catalog";
import { proposalProject } from "../../../../lib/project";

export function GET() {
  return Response.json({
    data: {
      schemaVersion: "1.0",
      tenant: { id: "tenant-homeplay", name: "居遊所 Play Ground" },
      project: {
        id: proposalProject.id,
        name: proposalProject.name,
        builder: proposalProject.builder,
        status: proposalProject.statusLabel,
        officialUrl: proposalProject.officialUrl,
        publishedVersion: 1,
      },
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
