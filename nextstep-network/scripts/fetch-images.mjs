// Downloads the fal.ai-generated images into public/images so the site doesn't
// depend on fal's CDN. Usage: node scripts/fetch-images.mjs
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.join("src", "lib", "images.ts"), "utf8");
const base = src.match(/const FAL = "([^"]+)"/)[1];
const pairs = [...src.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map((m) => [m[1], m[2]]);
fs.mkdirSync(path.join("public", "images"), { recursive: true });
for (const [remote, localName] of pairs) {
  const res = await fetch(base + remote);
  if (!res.ok) { console.error(`Failed ${remote}: ${res.status}`); continue; }
  fs.writeFileSync(path.join("public", "images", localName), Buffer.from(await res.arrayBuffer()));
  console.log(`Saved public/images/${localName}`);
}
console.log("Done. Set NEXT_PUBLIC_LOCAL_IMAGES=true in .env.local to use the local copies.");
