import { and, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { idempotencyKeys } from "../../db/schema";

type StoredResponse = { status: number; body: unknown };

export async function readIdempotentResponse(scope: string, key: string) {
  const [row] = await getDb().select().from(idempotencyKeys)
    .where(and(eq(idempotencyKeys.scope, scope), eq(idempotencyKeys.key, key)))
    .limit(1);
  if (!row) return null;
  return JSON.parse(row.responseJson) as StoredResponse;
}

export function idempotencyRow(scope: string, key: string, status: number, body: unknown) {
  return {
    scope,
    key,
    responseJson: JSON.stringify({ status, body } satisfies StoredResponse),
    createdAt: new Date().toISOString(),
  };
}

export function replayIdempotentResponse(stored: StoredResponse) {
  return Response.json(stored.body, {
    status: stored.status,
    headers: { "x-idempotent-replay": "true" },
  });
}
