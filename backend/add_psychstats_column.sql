-- Add psychstats column to user_characters table
ALTER TABLE user_characters ADD COLUMN IF NOT EXISTS psychstats JSONB;

-- Create an index for better performance on psychstats queries
CREATE INDEX IF NOT EXISTS idx_user_characters_psychstats ON user_characters USING gin(psychstats);