-- Create pack system tables for PostgreSQL

-- Claimable Packs (for gifts, special offers, etc.)
CREATE TABLE IF NOT EXISTS claimable_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_type VARCHAR(50) NOT NULL, -- e.g., 'standard_starter', 'premium_starter', 'gift_pack_common'
    is_claimed BOOLEAN DEFAULT FALSE,
    claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP
);

-- Contents of Claimable Packs
CREATE TABLE IF NOT EXISTS claimable_pack_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id UUID NOT NULL REFERENCES claimable_packs(id) ON DELETE CASCADE,
    character_id VARCHAR(20) NOT NULL REFERENCES characters(id),
    is_granted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's Character Echoes (for duplicate characters)
CREATE TABLE IF NOT EXISTS user_character_echoes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_template_id VARCHAR(20) NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    echo_count INTEGER DEFAULT 0 CHECK (echo_count >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, character_template_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_claimable_packs_user ON claimable_packs(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_claimable_packs_claimed ON claimable_packs(is_claimed);
CREATE INDEX IF NOT EXISTS idx_pack_contents_pack ON claimable_pack_contents(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_echoes_user ON user_character_echoes(user_id);