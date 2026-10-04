// Temporary probe (delete after use): pull the working publishable key out of the deployed bundle
import { writeFileSync } from "node:fs";

const site = "https://budget-buddy-lovat.vercel.app/";
const html = await fetch(site, { signal: AbortSignal.timeout(20000) }).then((r) => r.text());
const chunks = [...new Set([...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]))];
console.log("chunks to scan:", chunks.length);

let found = "";
for (const src of chunks) {
  if (found) break;
  try {
    const body = await fetch(new URL(src, site), { signal: AbortSignal.timeout(20000) }).then((r) => r.text());
    const m = body.match(/pk_live_[A-Za-z0-9_\-]+/);
    if (m) {
      found = m[0];
      console.log("found pk in", src, "->", found.slice(0, 14) + "…");
      break;
    }
    // Clerk publishable keys also appear already-decoded as the frontend API in the bundle
    const fa = body.match(/enhanced-snake-35\.clerk\.accounts\.dev/);
    if (fa) console.log("frontend API string appears in", src);
  } catch (e) {
    console.log("chunk failed", src, e?.cause?.code || e?.message);
  }
}

if (found) {
  const domain = Buffer.from(found.replace(/^pk_[a-z]+_/, ""), "base64").toString("utf8");
  console.log("decoded:", JSON.stringify(domain));
  writeFileSync("scripts/.pk_candidate", found);
  console.log("wrote scripts/.pk_candidate");
} else {
  console.log("no pk found in chunks");
}
