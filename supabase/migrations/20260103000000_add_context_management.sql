-- Migration: Add Context Management
-- Created: 2026-01-03
-- Description: Add tables for managing context sets with terms, general metadata,
--              translation terms, and text for improving transcription/translation accuracy

-- ============================================================================
-- TABLES
-- ============================================================================

-- Context Sets table (main entity)
CREATE TABLE IF NOT EXISTS context_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  text TEXT, -- Long-form context description (max ~10,000 chars per Soniox)
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context Set Terms table (array of keywords/phrases)
CREATE TABLE IF NOT EXISTS context_set_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_set_id UUID REFERENCES context_sets(id) ON DELETE CASCADE NOT NULL,
  term VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context Set General table (key-value metadata like domain, topic, organization)
CREATE TABLE IF NOT EXISTS context_set_general (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_set_id UUID REFERENCES context_sets(id) ON DELETE CASCADE NOT NULL,
  key VARCHAR(100) NOT NULL,
  value VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(context_set_id, key) -- Ensure unique keys per context set
);

-- Context Set Translation Terms table (source-target translation pairs)
CREATE TABLE IF NOT EXISTS context_set_translation_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_set_id UUID REFERENCES context_sets(id) ON DELETE CASCADE NOT NULL,
  source VARCHAR(200) NOT NULL,
  target VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Context Sets table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS session_context_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  context_set_id UUID REFERENCES context_sets(id) ON DELETE CASCADE NOT NULL,
  sort_order INTEGER DEFAULT 0, -- Order for merge priority (lower = higher priority)
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, context_set_id) -- Prevent duplicate context sets per session
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Context Sets indexes
CREATE INDEX IF NOT EXISTS idx_context_sets_user ON context_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_context_sets_public ON context_sets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_context_sets_updated ON context_sets(updated_at DESC);

-- Context Set Terms indexes
CREATE INDEX IF NOT EXISTS idx_context_terms_set ON context_set_terms(context_set_id);
CREATE INDEX IF NOT EXISTS idx_context_terms_order ON context_set_terms(context_set_id, sort_order);

-- Context Set General indexes
CREATE INDEX IF NOT EXISTS idx_context_general_set ON context_set_general(context_set_id);

-- Context Set Translation Terms indexes
CREATE INDEX IF NOT EXISTS idx_context_translation_set ON context_set_translation_terms(context_set_id);
CREATE INDEX IF NOT EXISTS idx_context_translation_order ON context_set_translation_terms(context_set_id, sort_order);

-- Session Context Sets indexes
CREATE INDEX IF NOT EXISTS idx_session_contexts_session ON session_context_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_session_contexts_context ON session_context_sets(context_set_id);
CREATE INDEX IF NOT EXISTS idx_session_contexts_order ON session_context_sets(session_id, sort_order);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE context_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_set_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_set_general ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_set_translation_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_context_sets ENABLE ROW LEVEL SECURITY;

-- Context Sets policies
CREATE POLICY "Users can view their own context sets"
  ON context_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public context sets"
  ON context_sets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own context sets"
  ON context_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context sets"
  ON context_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own context sets"
  ON context_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Context Set Terms policies (inherit from parent context_set)
CREATE POLICY "Users can manage terms for their context sets"
  ON context_set_terms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_terms.context_set_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_terms.context_set_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view terms for accessible context sets"
  ON context_set_terms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_terms.context_set_id
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

-- Context Set General policies (inherit from parent context_set)
CREATE POLICY "Users can manage general metadata for their context sets"
  ON context_set_general FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_general.context_set_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_general.context_set_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view general metadata for accessible context sets"
  ON context_set_general FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_general.context_set_id
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

-- Context Set Translation Terms policies (inherit from parent context_set)
CREATE POLICY "Users can manage translation terms for their context sets"
  ON context_set_translation_terms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_translation_terms.context_set_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_translation_terms.context_set_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view translation terms for accessible context sets"
  ON context_set_translation_terms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM context_sets
      WHERE id = context_set_translation_terms.context_set_id
      AND (user_id = auth.uid() OR is_public = true)
    )
  );

-- Session Context Sets policies (allow all, matching current session policies)
CREATE POLICY "Allow all on session_context_sets"
  ON session_context_sets FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for context management
ALTER PUBLICATION supabase_realtime ADD TABLE context_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE session_context_sets;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on context_sets
CREATE OR REPLACE FUNCTION update_context_sets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER context_sets_updated_at
  BEFORE UPDATE ON context_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_context_sets_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE context_sets IS 'Context sets for improving transcription/translation accuracy';
COMMENT ON TABLE context_set_terms IS 'Domain-specific terms and keywords for context sets';
COMMENT ON TABLE context_set_general IS 'Key-value metadata (domain, topic, organization, etc.)';
COMMENT ON TABLE context_set_translation_terms IS 'Custom translation pairs for ambiguous terms';
COMMENT ON TABLE session_context_sets IS 'Many-to-many relationship between sessions and context sets';

COMMENT ON COLUMN context_sets.text IS 'Long-form context description (max ~10,000 chars per Soniox limit)';
COMMENT ON COLUMN context_sets.is_public IS 'Public contexts are visible to all users, private only to owner';
COMMENT ON COLUMN session_context_sets.sort_order IS 'Merge priority: lower values have higher priority';
