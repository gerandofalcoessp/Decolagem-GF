import { Router } from 'express';
import { supabaseAdmin, supabaseConfigStatus } from '../services/supabaseClient';

const router = Router();

router.get('/status', async (_req, res) => {
  const cfg = supabaseConfigStatus();
  const tables = ['regionals', 'members', 'activities', 'goals', 'files'];

  if (!supabaseAdmin) {
    return res.status(200).json({ status: 'no_admin', cfg, tables });
  }

  const checks: Record<string, { ok: boolean; error?: string }> = {};

  for (const t of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(t).select('id').limit(1);
      if (error) {
        checks[t] = { ok: false, error: error.message };
      } else {
        checks[t] = { ok: true };
      }
    } catch (e: any) {
      checks[t] = { ok: false, error: e?.message ?? 'unknown_error' };
    }
  }

  res.json({ status: 'ok', cfg, checks });
});

export default router;