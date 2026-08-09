const previewUrl = process.env.HOMEPLAY_PREVIEW_URL ?? "http://localhost:3002/";

try {
  const response = await fetch(previewUrl, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  console.log(`Preview healthy: ${previewUrl} (HTTP ${response.status})`);
} catch (error) {
  console.error(`Preview unavailable: ${previewUrl}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
