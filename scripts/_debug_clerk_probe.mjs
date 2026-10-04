// Temporary probe (delete after use): why Clerk JS fails to load
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();

const pk = get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") || "";
console.log("pk prefix:", pk.slice(0, 10) + "…");
let decoded = "";
try {
  decoded = Buffer.from(pk.replace(/^pk_[a-z]+_/, ""), "base64").toString("utf8");
} catch {}
console.log("pk decodes to:", JSON.stringify(decoded));

// What does the secret key's instance domain say? (print only the domain)
const sk = get("CLERK_SECRET_KEY") || "";
console.log("sk prefix:", sk.slice(0, 8) + "…");

const urls = [
  "https://clerk.budget-buddy-lovat.vercel.app/npm/@clerk/clerk-js@5/dist/clerk.browser.js",
  "https://clerk.budget-buddy-lovat.vercel.app/",
  "https://budget-buddy-lovat.vercel.app/",
  "https://clerk.budget-buddy-lovat.vercel.app/__clerk/health",
];

for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    const loc = res.headers.get("location") || "";
    const server = res.headers.get("server") || "";
    console.log(`${res.status} ${url}${loc ? ` -> ${loc}` : ""}${server ? ` [server: ${server}]` : ""}`);
  } catch (e) {
    console.log(`ERR ${url} -> ${e?.cause?.code || e?.name}: ${String(e?.message).slice(0, 120)}`);
  }
}

// Find what script URL the deployed app actually references
try {
  const html = await fetch("https://budget-buddy-lovat.vercel.app/", { signal: AbortSignal.timeout(15000) }).then((r) => r.text());
  const clerkRefs = [...html.matchAll(/(https?:\/\/[^"' ]*clerk[^"' ]*)/g)].map((m) => m[1]).slice(0, 8);
  console.log("deployed page clerk refs:", clerkRefs);
  console.log("deployed page status len:", html.length);
} catch (e) {
  console.log("deployed page fetch failed:", e?.message);
}
