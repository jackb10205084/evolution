import { and, eq, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getDb } from "../../../db";
import { designs, shareLinks } from "../../../db/schema";
import { catalog, floorplans, themes } from "../../lib/catalog";
import type { SceneSnapshotV1 } from "../../lib/domain";
import { formatCurrency } from "../../lib/domain";
import { proposalProject } from "../../lib/project";
import { sha256 } from "../../lib/server-hash";

export const dynamic = "force-dynamic";

export default async function SharedDesignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const [link] = await db.select().from(shareLinks)
    .where(and(
      eq(shareLinks.tokenHash, await sha256(token)),
      isNull(shareLinks.revokedAt),
      or(isNull(shareLinks.expiresAt), sql`datetime(${shareLinks.expiresAt}) > CURRENT_TIMESTAMP`),
    ))
    .limit(1);

  if (!link) {
    return <UnavailableShare />;
  }
  const [design] = await db.select().from(designs).where(eq(designs.id, link.designId)).limit(1);
  if (!design) return <UnavailableShare />;
  const snapshot = JSON.parse(design.snapshotJson) as SceneSnapshotV1;
  const objects = snapshot.objects.map((object) => ({
    object,
    product: catalog.find((product) => product.sku === object.sku),
  })).filter((entry) => entry.product);
  const total = objects.reduce((sum, entry) => sum + (entry.product?.price ?? 0), 0);
  const floorplan = floorplans.find((entry) => entry.id === snapshot.floorplanId);
  const theme = themes.find((entry) => entry.id === snapshot.themeId);

  return (
    <main className="shared-page">
      <header className="shared-header">
        <Link className="shared-brand" href="/"><span>居遊所</span><small>Play Ground</small></Link>
        <span className="readonly-badge">唯讀分享</span>
        <Link className="shared-cta" href="/">打造我的未來家</Link>
      </header>
      <section className="shared-hero">
        <div>
          <span className="eyebrow">居遊所 Play Ground × {proposalProject.name} · 概念提案</span>
          <h1>{design.title}</h1>
          <p>{floorplan?.name} · {theme?.name} · {objects.length} 件家具</p>
        </div>
        <div className="shared-total"><small>配置家具總價</small><strong>{formatCurrency(total)}</strong></div>
      </section>
      <section className="shared-content">
        <article className="shared-plan-card">
          <div className="shared-plan-heading"><strong>配置俯視圖</strong><small>家具位置與原稿同步，分享者無法修改</small></div>
          <div className="shared-plan">
            <span className="shared-window" />
            <span className="shared-door" />
            {objects.map(({ object, product }) => {
              const left = ((object.position.x + 5) / 10) * 100;
              const top = ((object.position.z + 3.2) / 6.4) * 100;
              return (
                <span
                  className={`shared-object shared-object-${product!.shape}`}
                  key={object.id}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${Math.max(7, product!.size.width * 7.5)}%`,
                    height: `${Math.max(7, product!.size.depth * 11)}%`,
                    "--object-color": product!.color,
                    transform: `translate(-50%, -50%) rotate(${quaternionToY(object.rotation)}rad)`,
                  } as CSSProperties}
                  title={product!.name}
                >
                  <i />
                </span>
              );
            })}
          </div>
        </article>
        <aside className="shared-products">
          <div className="shared-plan-heading"><strong>這個家用了什麼</strong><small>價格與庫存以購買當下為準</small></div>
          <div className="shared-product-list">
            {objects.map(({ object, product }) => (
              <article key={object.id}>
                <span style={{ background: product!.color }}>{shapeGlyph(product!.shape)}</span>
                <div><small>{product!.brandKind === "owned" ? "居遊所自有品牌" : product!.brand}</small><strong>{product!.name}</strong><p>{formatCurrency(product!.price)}</p></div>
                <b>{product!.brandKind === "affiliate" ? "聯盟" : "自有"}</b>
              </article>
            ))}
          </div>
          <Link className="primary-button full large" href="/">體驗這個建案提案</Link>
        </aside>
      </section>
      <footer className="shared-footer">分享連結有效至 {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString("zh-TW") : "撤銷為止"} · 原稿仍為私人所有</footer>
    </main>
  );
}

function UnavailableShare() {
  return <main className="share-unavailable"><span>居遊所 Play Ground</span><h1>這個分享連結已失效</h1><p>可能已超過有效期限，或由原作者主動撤銷。</p><Link className="primary-button" href="/">回到居遊所</Link></main>;
}

function shapeGlyph(shape: string) {
  return ({ sofa: "▰", table: "●", chair: "▱", lamp: "✦", plant: "♣", rug: "⬭", shelf: "▦", bed: "▭" } as Record<string, string>)[shape] ?? "◆";
}

function quaternionToY(q: { x: number; y: number; z: number; w: number }) {
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
}
