import { getChatGPTUser } from "../chatgpt-auth";
import { proposalProject } from "../lib/project";

export const alphaTenantId = "tenant-homeplay";
export const alphaProjectId = proposalProject.id;

export async function currentUser() {
  const authenticated = await getChatGPTUser();
  if (authenticated) return authenticated;
  if (process.env.NODE_ENV === "development") {
    return {
      userId: "alpha-local-user",
      displayName: "Alpha 體驗者",
      email: "alpha@local.invalid",
      fullName: "Alpha 體驗者",
    };
  }
  return null;
}

export function apiError(message: string, status = 400, details?: unknown) {
  return Response.json({ error: { message, details } }, { status });
}

export function idempotencyKey(request: Request) {
  const key = request.headers.get("idempotency-key")?.trim();
  return key && key.length <= 128 ? key : null;
}
