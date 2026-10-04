// Temporary probe (delete after use): look for the real frontend API domain
import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const sk = get("CLERK_SECRET_KEY") || "";
const pk = get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") || "";

const res = await fetch("https://api.clerk.com/v1/instance", {
  headers: { Authorization: `Bearer ${sk}` },
  signal: AbortSignal.timeout(15000),
});
const data = await res.json().catch(() => ({}));
console.log("allowed_origins:", JSON.stringify(data.allowed_origins));
console.log("allowed_subdomains:", JSON.stringify(data.allowed_subdomains));

// Does the secret key embed a domain the way the publishable key does?
const tail = sk.replace(/^sk_[a-z]+_/, "");
let looksLikeDomain = false;
try {
  const dec = Buffer.from(tail, "base64").toString("utf8");
  looksLikeDomain = /^[a-z0-9.-]+\$?$/.test(dec.trim()) && dec.includes(".");
  console.log("sk tail decodes to a domain-like string:", looksLikeDomain, looksLikeDomain ? dec.trim() : "(no)");
} catch {
  console.log("sk tail is not base64");
}

console.log("pk:", JSON.stringify(Buffer.from(pk.replace(/^pk_[a-z]+_/, ""), "base64").toString("utf8")));
