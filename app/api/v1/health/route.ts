export function GET() {
  return Response.json({ status: "ok", service: "homeplay-web", version: "0.1.0-alpha" });
}
