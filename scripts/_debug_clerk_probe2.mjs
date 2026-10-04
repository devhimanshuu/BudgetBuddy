// Temporary probe (delete after use): confirm which Clerk instance the keys belong to
import { readFileSync } from "node:fs";
import dns from "node:dns/promises";

const env = readFileSync(".env", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const pk = get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") || "";
const sk = get("CLERK_SECRET_KEY") || "";
const pkDomain = Buffer.from(pk.replace(/^pk_[a-z]+_/, ""), "base64").toString("utf8").replace(/\$$/, "");

// 1) Does the proxy host even resolve?
try {
  const addrs = await dns.lookup(pkDomain, { all: true });
  console.log(`DNS ${pkDomain} ->`, addrs.map((a) => a.address).join(", ") || "no records");
} catch (e) {
  console.log(`DNS ${pkDomain} -> ${e.code}`);
}

// 2) Do the standard Clerk JS URLs respond?
for (const url of [
  `https://${pkDomain}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`,
  "https://enhanced-snake-35.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js",
]) {
  try {
    const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(15000) });
    console.log(`${res.status} ${url}`);
  } catch (e) {
    console.log(`ERR ${url} -> ${e?.cause?.code || e?.name}`);
  }
}

// 3) Which frontend API does the local *secret* key's instance use?
try {
  const res = await fetch("https://api.clerk.com/v1/instance", {
    headers: { Authorization: `Bearer ${sk}`, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  console.log(
    "api.clerk.com /v1/instance:",
    res.status,
    JSON.stringify({ id: data?.id, frontend_api: data?.frontend_api, user_count: data?.user_count, environment: data?.environment?.environment_type, name: data?.name }),
  );
} catch (e) {
  console.log("api.clerk.com /v1/instance ->", e?.cause?.code || e?.message);
}

// 4) Publishable key used by the *working* deployment
try {
  const html = await fetch("https://budget-buddy-lovat.vercel.app/", { signal: AbortSignal.timeout(15000) }).then((r) => r.text());
  const livePk = (html.match(/pk_live_[A-Za-z0-9]+/) || [])[0] || "";
  const domain = livePk ? Buffer.from(livePk.replace(/^pk_[a-z]+_/, ""), "base64").toString("utf8").replace(/\$$/, "") : "";
  console.log("deployed pk prefix:", livePk.slice(0, 12) + "…", "-> frontend API:", domain || "n/a");
} catch (e) {
  console.log("deployed pk lookup failed:", e?.cause?.code || e?.message);
}
