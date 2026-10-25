// Downloads full-resolution originals of the fal.ai brand images listed in
// assets/brand/manifest.json into assets/brand/full/. Run: npm run fetch:brand
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../assets/brand/manifest.json', import.meta.url)));
const dir = new URL('../assets/brand/full/', import.meta.url);
await mkdir(dir, { recursive: true });
for (const a of manifest.assets) {
  const name = a.file.replace(/\.webp$/, '.png');
  const res = await fetch(a.original_url);
  if (!res.ok) {
    console.warn(`skip ${name}: HTTP ${res.status}`);
    continue;
  }
  await writeFile(new URL(name, dir), Buffer.from(await res.arrayBuffer()));
  console.log(`saved assets/brand/full/${name}`);
}
