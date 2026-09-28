/*
  # Server-side accessors, input validation and server-computed achievements

  ## Purpose
  Closes several access-control and business-logic defects found in the security audit.
  Previously the browser could read and write every user's rows directly, chose its own
  achievement progress, and could push unbounded or negative counter increments for any
  device identifier. This migration adds the server-side surface the app will use instead.

  ## Changes

  1. New helper `app_is_valid_user_id(text)`
     - Validates the device identifier format the app generates.
     - Rejects null, malformed and junk identifiers so the RPC surface cannot be used
       to seed arbitrary rows or as a probing oracle.

  2. Hardened `increment_user_stats(text, int, int)` and `increment_daily_stats(text, int, int)`
     - Reject identifiers that fail `app_is_valid_user_id`.
     - Reject non-positive amounts (previously a negative value could drive counters below
       zero and corrupt the analytics arithmetic).
     - Cap each call at 100 per counter, well above any legitimate single transcript or tap,
       preventing integer overflow and value inflation.

  3. New read accessors, all SECURITY DEFINER, scoped to a single supplied device id
     - `app_get_user_stats(text)`
     - `app_get_daily_stats(text)`  (30 most recent days, matching prior app behaviour)
     - `app_get_user_achievements(text)`
     These replace direct table SELECTs from the client, so table-wide read grants can be
     revoked without breaking any feature.

  4. New `app_reset_daily_stats(text)`
     - Zeroes today's row for one device. Replaces the client-side upsert.

  5. New `app_recompute_achievements(text)`
     - Implements all six achievement rules in SQL over the server's own user_stats and
       daily_stats data, so achievement progress and unlock timestamps are no longer
       decided by the client. Preserves the original unlock timestamp once set.

  ## Security
  - All functions are SECURITY DEFINER with `SET search_path = public` (no mutable search path).
  - EXECUTE is granted to anon and authenticated because this app has no sign-in and
    operates entirely with the public anon key.
  - Every function is scoped to the single device identifier passed in; none can enumerate
    or affect other rows.

  ## Important notes
  1. No data is destroyed: this migration only adds functions and replaces two function
     bodies. No table, column or row is dropped or altered.
  2. A follow-up migration revokes the direct table grants once the client is updated.
*/

-- 1. Device identifier format guard -------------------------------------------------

CREATE OR REPLACE FUNCTION app_is_valid_user_id(p_user_id text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_user_id IS NOT NULL
     AND p_user_id ~ '^user_[0-9]{10,20}_[a-z0-9]{6,64}$';
$$;

-- 2. Hardened atomic increments ------------------------------------------------------

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
  v_mum int;
  v_dad int;
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;

  v_mum := LEAST(GREATEST(COALESCE(p_mum, 0), 0), 100);
  v_dad := LEAST(GREATEST(COALESCE(p_dad, 0), 0), 100);

  IF v_mum = 0 AND v_dad = 0 THEN
    RETURN;
  END IF;

  SELECT last_active_date, consecutive_days
    INTO v_last_active, v_consecutive
  FROM user_stats WHERE user_id = p_user_id;

  IF v_last_active IS NULL THEN
    v_consecutive := 1;
  ELSIF v_last_active = v_today - 1 THEN
    v_consecutive := COALESCE(v_consecutive, 0) + 1;
  ELSIF v_last_active <> v_today THEN
    v_consecutive := 1;
  END IF;

  INSERT INTO user_stats (user_id, total_mum_count, total_dad_count, total_calls,
                          consecutive_days, last_active_date, updated_at)
  VALUES (p_user_id, v_mum, v_dad, v_mum + v_dad, v_consecutive, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_mum_count  = user_stats.total_mum_count + v_mum,
    total_dad_count  = user_stats.total_dad_count + v_dad,
    total_calls      = user_stats.total_calls + v_mum + v_dad,
    consecutive_days = v_consecutive,
    last_active_date = v_today,
    updated_at       = now();
END;
$$;

CREATE OR REPLACE FUNCTION increment_daily_stats(p_user_id text, p_mum int, p_dad int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mum int;
  v_dad int;
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;

  v_mum := LEAST(GREATEST(COALESCE(p_mum, 0), 0), 100);
  v_dad := LEAST(GREATEST(COALESCE(p_dad, 0), 0), 100);

  IF v_mum = 0 AND v_dad = 0 THEN
    RETURN;
  END IF;

  INSERT INTO daily_stats (user_id, date, mum_count, dad_count, total_calls)
  VALUES (p_user_id, CURRENT_DATE, v_mum, v_dad, v_mum + v_dad)
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    mum_count   = daily_stats.mum_count + v_mum,
    dad_count   = daily_stats.dad_count + v_dad,
    total_calls = daily_stats.total_calls + v_mum + v_dad;
END;
$$;

-- 3. Read accessors ------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_get_user_stats(p_user_id text)
RETURNS TABLE (
  user_id text,
  total_mum_count int,
  total_dad_count int,
  total_calls int,
  consecutive_days int,
  last_active_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.user_id, s.total_mum_count, s.total_dad_count, s.total_calls,
         s.consecutive_days, s.last_active_date
  FROM user_stats s
  WHERE s.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION app_get_daily_stats(p_user_id text)
RETURNS TABLE (
  user_id text,
  date date,
  mum_count int,
  dad_count int,
  total_calls int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.user_id, d.date, d.mum_count, d.dad_count, d.total_calls
  FROM daily_stats d
  WHERE d.user_id = p_user_id
  ORDER BY d.date DESC
  LIMIT 30;
END;
$$;

CREATE OR REPLACE FUNCTION app_get_user_achievements(p_user_id text)
RETURNS TABLE (
  achievement_id text,
  progress int,
  unlocked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT a.achievement_id, a.progress, a.unlocked_at
  FROM user_achievements a
  WHERE a.user_id = p_user_id;
END;
$$;

-- 4. Reset today's counts ------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_reset_daily_stats(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;

  INSERT INTO daily_stats (user_id, date, mum_count, dad_count, total_calls)
  VALUES (p_user_id, CURRENT_DATE, 0, 0, 0)
  ON CONFLICT (user_id, date) DO UPDATE
  SET mum_count = 0, dad_count = 0, total_calls = 0;
END;
$$;

-- 5. Server-computed achievements ----------------------------------------------------

CREATE OR REPLACE FUNCTION app_recompute_achievements(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_calls int := 0;
  v_consecutive int := 0;
  v_max_daily int := 0;
  v_has_equal boolean := false;
  v_progress int;
  v_max int;
  v_id text;
BEGIN
  IF NOT app_is_valid_user_id(p_user_id) THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;

  SELECT COALESCE(s.total_calls, 0), COALESCE(s.consecutive_days, 0)
    INTO v_total_calls, v_consecutive
  FROM user_stats s WHERE s.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Derived from the 30 most recent days, matching the app's prior window.
  SELECT COALESCE(MAX(w.total_calls), 0),
         COALESCE(BOOL_OR(w.total_calls >= 20 AND w.mum_count = w.dad_count), false)
    INTO v_max_daily, v_has_equal
  FROM (
    SELECT d.total_calls, d.mum_count, d.dad_count
    FROM daily_stats d
    WHERE d.user_id = p_user_id
    ORDER BY d.date DESC
    LIMIT 30
  ) w;

  FOR v_id, v_max IN
    SELECT * FROM (VALUES
      ('first_steps', 1),
      ('chatter_champion', 50),
      ('equal_opportunity', 1),
      ('week_warrior', 7),
      ('century_club', 100),
      ('dedication', 500)
    ) AS t(id, max_progress)
  LOOP
    v_progress := CASE v_id
      WHEN 'first_steps'       THEN CASE WHEN v_total_calls >= 1 THEN 1 ELSE 0 END
      WHEN 'chatter_champion'  THEN LEAST(v_max_daily, 50)
      WHEN 'equal_opportunity' THEN CASE WHEN v_has_equal THEN 1 ELSE 0 END
      WHEN 'week_warrior'      THEN LEAST(v_consecutive, 7)
      WHEN 'century_club'      THEN LEAST(v_max_daily, 100)
      WHEN 'dedication'        THEN LEAST(v_total_calls, 500)
      ELSE 0
    END;

    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
    VALUES (
      p_user_id,
      v_id,
      v_progress,
      CASE WHEN v_progress >= v_max THEN now() ELSE NULL END
    )
    ON CONFLICT (user_id, achievement_id) DO UPDATE
    SET
      progress = v_progress,
      -- keep the original unlock moment once earned
      unlocked_at = CASE
        WHEN v_progress >= v_max
          THEN COALESCE(user_achievements.unlocked_at, now())
        ELSE NULL
      END;
  END LOOP;
END;
$$;

-- 6. Grants --------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION app_is_valid_user_id(text)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_user_stats(text, int, int)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_stats(text, int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_get_user_stats(text)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_get_daily_stats(text)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_get_user_achievements(text)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_reset_daily_stats(text)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_recompute_achievements(text)      TO anon, authenticated;
