import { catalog, floorplans, themes } from "../../../../lib/catalog";
import { commercialPilot, commercialPilotProgress } from "../../../../lib/commercial-pilot";
import { getFloorplanRuntime } from "../../../../lib/floorplan-runtime";
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
      floorplanShells: ["bh7-a6", "bh7-a11"].flatMap((floorplanId) => {
        const runtime = getFloorplanRuntime(floorplanId);
        return runtime ? [{
          id: runtime.shell.source.drawingSet,
          version: runtime.shell.schemaVersion,
          status: runtime.shell.status,
          sourcePages: runtime.shell.source.pages,
          dimensions: runtime.shell.dimensions,
        }] : [];
      }),
      themes,
      catalog,
      commercialPilot: {
        pilotId: commercialPilot.pilotId,
        releaseStatus: commercialPilot.releaseStatus,
        floorplan: commercialPilot.floorplan,
        progress: commercialPilotProgress,
        releaseGates: commercialPilot.releaseGates,
      },
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
