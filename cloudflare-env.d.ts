declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    RENDER_WORKER_SECRET?: string;
  }
}
