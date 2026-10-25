// Server-side brand asset generation with fal.ai. The FAL_KEY never reaches
// the app. Restricted to BookNoble staff (ADMIN_EMAILS) so it can't be used
// to run up costs. Results are copied into Supabase Storage for reuse.
//
// Secrets: FAL_KEY, ADMIN_EMAILS (comma-separated). Storage bucket: brand-assets (public).
import { admin, cors, currentUser, json, requireEnv } from '../_shared/supabase.ts';

// Bria FIBO 2 is trained only on licensed data, with commercial rights.
const MODEL = 'bria/fibo-2/generate';
const ASPECTS = new Set(['1:1', '4:5', '9:16', '16:9', '3:2', '2:3']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await currentUser(req);
  const admins = requireEnv('ADMIN_EMAILS').split(',').map((s) => s.trim().toLowerCase());
  if (!user?.email || !admins.includes(user.email.toLowerCase())) return json({ error: 'Forbidden' }, 403);

  const { prompt, aspect_ratio = '4:5', name } = await req.json();
  if (typeof prompt !== 'string' || prompt.length < 10 || prompt.length > 2000) return json({ error: 'Prompt required' }, 400);
  if (!ASPECTS.has(aspect_ratio)) return json({ error: 'Unsupported aspect ratio' }, 400);

  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Key ${requireEnv('FAL_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspect_ratio }),
  });
  if (!res.ok) return json({ error: 'Generation failed' }, 502);
  const out = await res.json();
  const url: string | undefined = out?.image?.url ?? out?.images?.[0]?.url;
  if (!url) return json({ error: 'No image returned' }, 502);

  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  const path = `${(name ?? 'asset').replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-${Date.now()}.png`;
  const db = admin();
  const { error } = await db.storage.from('brand-assets').upload(path, bytes, { contentType: 'image/png' });
  if (error) return json({ error: 'Upload failed' }, 500);
  const { data } = db.storage.from('brand-assets').getPublicUrl(path);
  return json({ url: data.publicUrl, model: MODEL, prompt });
});
