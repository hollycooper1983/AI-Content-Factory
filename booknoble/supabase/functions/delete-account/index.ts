// In-app account deletion (App Store guideline 5.1.1(v), Google Play account deletion policy).
// Deleting the auth user cascades to the business and every record it owns.
import { admin, cors, currentUser, json } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await currentUser(req);
  if (!user) return json({ error: 'Not signed in' }, 401);

  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) return json({ error: 'Could not delete account' }, 500);
  return json({ deleted: true });
});
