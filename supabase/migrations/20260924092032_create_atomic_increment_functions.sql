/*
# Add Atomic Increment Functions

## Purpose
Fixes a race condition where concurrent calls to updateUserStats could
overwrite each other's data. The old approach did SELECT-then-UPSERT,
which loses increments if two calls read the same baseline simultaneously.

## Changes
1. New SECURITY DEFINER function: `increment_user_stats(p_user_id text, p_mum int, p_dad int)`
   - Atomically increments user_stats counters using INSERT ... ON CONFLICT
   - Updates consecutive_days based on last_active_date vs today
   - Returns void
2. New SECURITY DEFINER function: `increment_daily_stats(p_user_id text, p_mum int, p_dad int)`
   - Atomically increments today's daily_stats row using INSERT ... ON CONFLICT
   - Returns void
3. Grants EXECUTE on both functions to anon and authenticated roles

## Security
- Functions are SECURITY DEFINER so they can modify rows regardless of RLS
- Execute is granted to anon, authenticated (no-auth app uses anon key)
- Functions only modify rows for the given user_id, no cross-user access
*/

CREATE OR REPLACE FUNCTION increment_user_stats(p_user_id text, p_mum int, p_dad int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_consecutive int := 1;
  v_last_active date;
BEGIN
  SELECT last_active_date INTO v_last_active
  FROM user_stats WHERE user_id = p_user_id;

  IF v_last_active IS NOT NULL THEN
    IF v_last_active = v_today - 1 THEN
      SELECT consecutive_days INTO v_consecutive
      FROM user_stats WHERE user_id = p_user_id;
      v_consecutive := v_consecutive + 1;
    ELSIF v_last_active = v_today THEN
      SELECT consecutive_days INTO v_consecutive
      FROM user_stats WHERE user_id = p_user_id;
    END IF;
  END IF;

  INSERT INTO user_stats (user_id, total_mum_count, total_dad_count, total_calls, consecutive_days, last_active_date, updated_at)
  VALUES (p_user_id, p_mum, p_dad, p_mum + p_dad, v_consecutive, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_mum_count = user_stats.total_mum_count + p_mum,
    total_dad_count = user_stats.total_dad_count + p_dad,
    total_calls = user_stats.total_calls + p_mum + p_dad,
    consecutive_days = v_consecutive,
    last_active_date = v_today,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION increment_daily_stats(p_user_id text, p_mum int, p_dad int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, mum_count, dad_count, total_calls)
  VALUES (p_user_id, CURRENT_DATE, p_mum, p_dad, p_mum + p_dad)
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    mum_count = daily_stats.mum_count + p_mum,
    dad_count = daily_stats.dad_count + p_dad,
    total_calls = daily_stats.total_calls + p_mum + p_dad;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_user_stats(text, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_stats(text, int, int) TO anon, authenticated;
