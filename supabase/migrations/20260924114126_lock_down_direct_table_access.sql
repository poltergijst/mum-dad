/*
  # Lock down direct table access to the tracking data

  ## Purpose
  The three tracking tables were reachable directly from the browser with the public
  key, and every policy on them was unconditional (`USING (true)` / `WITH CHECK (true)`)
  for the anon role. Anyone holding the app's public key could therefore list every
  device's counts, overwrite them, insert fabricated rows, or delete all history.
  The app itself only ever needs its own device's rows, and as of the previous
  migration it reaches them through scoped server-side functions.

  ## Changes

  1. Dropped policies (all unconditional, on `user_stats`, `daily_stats`, `user_achievements`)
     - anon_select_*, anon_insert_*, anon_update_*, anon_delete_*
     Row level security remains ENABLED on all three tables, now with no policy granting
     the public roles any access, which is deny-by-default.

  2. Revoked all table privileges on those three tables from `anon` and `authenticated`
     - Removes the Data API surface entirely, so the tables cannot be read or written
       directly even if a policy is added by accident later.
     - Also revoked default privileges on future objects in the public schema for these
       roles is NOT done here, to avoid surprising other work.

  3. The SECURITY DEFINER functions added in the previous migration continue to work:
     they execute with the owner's rights, and each one is scoped to the single device
     identifier passed in.

  ## Security
  - Read of another device's counts: no longer possible; reads go through
    app_get_user_stats / app_get_daily_stats / app_get_user_achievements.
  - Overwrite or deletion of another device's data: no longer possible; there is no
    UPDATE or DELETE path exposed to the client at all (the app never deleted rows).
  - Fabricated inserts: no longer possible; inserts happen only inside the validated
    increment functions.

  ## Important notes
  1. No data is destroyed. Only policies and privileges change; every row is retained.
  2. This migration is idempotent and safe to re-run.
*/

-- 1. Remove the unconditional policies -----------------------------------------------

DROP POLICY IF EXISTS "anon_select_user_stats"        ON user_stats;
DROP POLICY IF EXISTS "anon_insert_user_stats"        ON user_stats;
DROP POLICY IF EXISTS "anon_update_user_stats"        ON user_stats;
DROP POLICY IF EXISTS "anon_delete_user_stats"        ON user_stats;

DROP POLICY IF EXISTS "anon_select_daily_stats"       ON daily_stats;
DROP POLICY IF EXISTS "anon_insert_daily_stats"       ON daily_stats;
DROP POLICY IF EXISTS "anon_update_daily_stats"       ON daily_stats;
DROP POLICY IF EXISTS "anon_delete_daily_stats"       ON daily_stats;

DROP POLICY IF EXISTS "anon_select_user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "anon_insert_user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "anon_update_user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "anon_delete_user_achievements" ON user_achievements;

-- 2. Keep row level security on (deny by default now that no policy exists) ----------

ALTER TABLE user_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- 3. Remove the Data API surface -----------------------------------------------------

REVOKE ALL ON TABLE user_stats        FROM anon, authenticated;
REVOKE ALL ON TABLE daily_stats       FROM anon, authenticated;
REVOKE ALL ON TABLE user_achievements FROM anon, authenticated;
