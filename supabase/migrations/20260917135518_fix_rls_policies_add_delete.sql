/*
# Fix RLS Policies and Add DELETE Support

1. Security Changes
   - Drop existing policies on user_stats, daily_stats, user_achievements
   - Recreate all policies with explicit `TO anon, authenticated` role scoping
     (this is a no-auth single-tenant app, so anon-key access is required)
   - Add missing DELETE policies for all three tables
   - All policies use `USING (true)` / `WITH CHECK (true)` because the data
     is intentionally shared/public in this single-tenant app with no sign-in

2. Tables Affected
   - user_stats: SELECT, INSERT, UPDATE, DELETE
   - daily_stats: SELECT, INSERT, UPDATE, DELETE
   - user_achievements: SELECT, INSERT, UPDATE, DELETE
*/

-- user_stats: drop and recreate with explicit role + add DELETE
DROP POLICY IF EXISTS "Anyone can read their own stats" ON user_stats;
DROP POLICY IF EXISTS "Anyone can insert their own stats" ON user_stats;
DROP POLICY IF EXISTS "Anyone can update their own stats" ON user_stats;

CREATE POLICY "anon_select_user_stats" ON user_stats FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_user_stats" ON user_stats FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_user_stats" ON user_stats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_user_stats" ON user_stats FOR DELETE
  TO anon, authenticated USING (true);

-- daily_stats: drop and recreate with explicit role + add DELETE
DROP POLICY IF EXISTS "Anyone can read their own daily stats" ON daily_stats;
DROP POLICY IF EXISTS "Anyone can insert their own daily stats" ON daily_stats;
DROP POLICY IF EXISTS "Anyone can update their own daily stats" ON daily_stats;

CREATE POLICY "anon_select_daily_stats" ON daily_stats FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_daily_stats" ON daily_stats FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_daily_stats" ON daily_stats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_daily_stats" ON daily_stats FOR DELETE
  TO anon, authenticated USING (true);

-- user_achievements: drop and recreate with explicit role + add DELETE
DROP POLICY IF EXISTS "Anyone can read their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can insert their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Anyone can update their own achievements" ON user_achievements;

CREATE POLICY "anon_select_user_achievements" ON user_achievements FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_user_achievements" ON user_achievements FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_user_achievements" ON user_achievements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_user_achievements" ON user_achievements FOR DELETE
  TO anon, authenticated USING (true);
