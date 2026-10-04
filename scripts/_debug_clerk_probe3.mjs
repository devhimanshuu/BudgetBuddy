// Temporary probe (delete after use): find the publishable key that matches the local secret key
import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const sk = get("CLERK_SECRET_KEY") || "";

// 1) Full (non-secret) shape of the instance record
try {
  const res = await fetch("https://api.clerk.com/v1/instance", {
    headers: { Authorization: `Bearer ${sk}` },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  console.log("instance keys:", Object.keys(data).join(", "));
  const interesting = {};
  for (const k of Object.keys(data)) {
    if (/url|domain|api|instance|environment|name|id/i.test(k) && typeof data[k] !== "object") interesting[k] = data[k];
  }
  console.log("instance (redacted):", JSON.stringify(interesting));
} catch (e) {
  console.log("instance fetch failed:", e?.cause?.code || e?.message);
}

// 2) Publishable key shipped by the working deployment
try {
  const html = await fetch("https://budget-buddy-lovat.vercel.app/", { signal: AbortSignal.timeout(15000) }).then((r) => r.text());
  const hits = [...html.matchAll(/pk_live_[A-Za-z0-9_\-]+/g)].map((m) => m[0]);
  console.log("pk hits in deployed HTML:", hits.length, hits.map((h) => h.slice(0, 14) + "…"));
  for (const h of hits) {
    const domain = Buffer.from(h.replace(/^pk_[a-z]+_/, ""), "base64").toString("utf8");
    console.log("  decoded:", JSON.stringify(domain));
    if (domain.startsWith("enhanced-snake-35.clerk.accounts.dev")) {
      writeFileSync("scripts/.pk_candidate", h);
      console.log("wrote matching pk (public value) to scripts/.pk_candidate", h.slice(0, 14) + "…");
    }
  }
  const ctx = html.indexOf("enhanced-snake-35");
  if (ctx >= 0) console.log("context around frontend api:", JSON.stringify(html.slice(Math.max(0, ctx - 200), ctx + 120)));
} catch (e) {
  console.log("deployed HTML fetch failed:", e?.cause?.code || e?.message);
}
