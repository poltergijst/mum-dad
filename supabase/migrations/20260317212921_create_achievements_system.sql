/*
  # Create Achievements System

  1. New Tables
    - `user_stats`
      - `id` (uuid, primary key)
      - `user_id` (text, unique) - device/browser identifier
      - `total_mum_count` (integer)
      - `total_dad_count` (integer)
      - `total_calls` (integer)
      - `consecutive_days` (integer)
      - `last_active_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `daily_stats`
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `date` (date)
      - `mum_count` (integer)
      - `dad_count` (integer)
      - `total_calls` (integer)
      - `created_at` (timestamp)
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `achievement_id` (text)
      - `unlocked_at` (timestamp)
      - `progress` (integer)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
    
  3. Important Notes
    - Using user_id as text to support anonymous device tracking
    - No authentication required for this demo app
    - Users can view and update their own stats
*/

CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  total_mum_count integer DEFAULT 0,
  total_dad_count integer DEFAULT 0,
  total_calls integer DEFAULT 0,
  consecutive_days integer DEFAULT 0,
  last_active_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  date date NOT NULL,
  mum_count integer DEFAULT 0,
  dad_count integer DEFAULT 0,
  total_calls integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  achievement_id text NOT NULL,
  progress integer DEFAULT 0,
  unlocked_at timestamptz,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats (no-auth app: anon + authenticated, shared data)
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

-- Policies for daily_stats
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

-- Policies for user_achievements
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user ON user_stats(user_id);