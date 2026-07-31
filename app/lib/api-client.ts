import type { BookingDraft, SceneObjectV1 } from "./domain";

export type SavedDesign = {
  id: string;
  floorplanId: string;
  themeId: string;
  snapshot: {
    schemaVersion: "1.0";
    unit: "meter";
    objects: SceneObjectV1[];
    savedAt: string;
  };
};

export type BookingSession = {
  id: string;
  status: "pending" | "confirmed" | "checked_in" | "cancelled";
  checkInToken: string;
  scheduledAt: string;
};

export type RenderJobRecord = {
  id: string;
  designId: string;
  status: "queued" | "processing" | "completed" | "failed";
  outputKey: string | null;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = { data: T };

export class ApiClientError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => null) as ({ error?: { message?: string } } & ApiEnvelope<T>) | null;
  if (!response.ok) throw new ApiClientError(payload?.error?.message ?? "服務暫時無法使用", response.status);
  return payload!.data;
}

function mutation(body: unknown, key?: string): RequestInit {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key ? { "idempotency-key": key } : {}),
    },
    body: JSON.stringify(body),
  };
}

export function loadDesigns() {
  return requestJson<SavedDesign[]>("/api/designs");
}

export function saveDesign(input: { floorplanId: string; themeId: string; objects: SceneObjectV1[] }) {
  return requestJson<{ id: string; snapshotVersion: number; savedAt: string }>("/api/designs", mutation(input));
}

export function createBooking(input: {
  floorplanId: string;
  designId?: string;
  form: BookingDraft;
  configurationSummary: Record<string, unknown>;
}, key: string) {
  const scheduledAt = new Date(`${input.form.date}T${input.form.slot}:00+08:00`).toISOString();
  return requestJson<BookingSession>("/api/bookings", mutation({
    floorplanId: input.floorplanId,
    designId: input.designId,
    scheduledAt,
    name: input.form.name,
    phone: input.form.phone,
    consent: input.form.consent,
    configurationSummary: input.configurationSummary,
  }, key));
}

export function checkInBooking(booking: BookingSession, key: string) {
  return requestJson<{ bookingId: string; status: "checked_in"; creditsGranted: number; alreadyProcessed: boolean }>(
    `/api/bookings/${encodeURIComponent(booking.id)}/check-in`,
    mutation({ token: booking.checkInToken }, key),
  );
}

export function loadRenderState() {
  return requestJson<{ jobs: RenderJobRecord[]; balance: number }>("/api/renders");
}

export function createRender(input: { designId: string; camera: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number }; fov: number } }, key: string) {
  return requestJson<RenderJobRecord>("/api/renders", mutation(input, key));
}

export function createShare(designId: string, key: string) {
  return requestJson<{ id: string; token: string; expiresAt: string }>("/api/shares", mutation({ designId, expiresInDays: 30 }, key));
}

export function revokeShare(shareId: string) {
  return requestJson<{ id: string; revokedAt: string }>(`/api/shares/${encodeURIComponent(shareId)}`, { method: "DELETE" });
}
