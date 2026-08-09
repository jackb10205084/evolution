export type BrandKind = "owned" | "affiliate";
export type RoomKind = "living" | "dining" | "bedroom" | "decor";
export type EditorMode = "decorate" | "explore";

export type Vec3 = { x: number; y: number; z: number };
export type Quaternion = { x: number; y: number; z: number; w: number };

export type FurnitureItem = {
  id: string;
  sku: string;
  assetVersion: string;
  name: string;
  category: RoomKind;
  brand: string;
  brandKind: BrandKind;
  price: number;
  cashbackRate?: number;
  partnershipStatus?: "demo" | "active";
  productUrl?: string;
  sourceUpdatedAt?: string;
  assetPath?: string;
  color: string;
  accent: string;
  shape: "sofa" | "table" | "chair" | "lamp" | "plant" | "rug" | "shelf" | "bed";
  size: { width: number; depth: number; height: number };
  stock: "in_stock" | "low_stock" | "out_of_stock";
};

export type SceneObjectV1 = {
  id: string;
  sku: string;
  assetVersion: string;
  position: Vec3;
  rotation: Quaternion;
  materialVariant: number;
};

export type SceneSnapshotV1 = {
  schemaVersion: "1.0";
  projectId: string;
  floorplanId: string;
  themeId: string;
  unit: "meter";
  camera: {
    position: Vec3;
    target: Vec3;
    fov: number;
  };
  objects: SceneObjectV1[];
  savedAt: string;
};

export type Floorplan = {
  id: string;
  name: string;
  subtitle: string;
  area: string;
  rooms: string;
  accent: string;
  sourceStatus: "ready" | "indexed" | "awaiting_source";
  shellVersion?: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  english: string;
  description: string;
  palette: [string, string, string];
  emoji: string;
};

export type BookingDraft = {
  date: string;
  slot: string;
  name: string;
  phone: string;
  consent: boolean;
};

export type RenderLedgerEntry = {
  id: string;
  delta: number;
  reason: "purchase" | "check_in_grant" | "render_charge" | "render_refund";
  createdAt: string;
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amount);
}
