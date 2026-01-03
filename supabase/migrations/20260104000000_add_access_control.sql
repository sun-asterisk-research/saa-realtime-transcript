-- ============================================================================
-- SESSION ACCESS CONTROL, INVITATIONS & SCHEDULING
-- Migration: 20260104000000_add_access_control.sql
-- ============================================================================
-- Description: Add access control, invitation system, and session scheduling
-- Features: User profiles, session invitations, join requests, scheduling
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);

COMMENT ON TABLE profiles IS 'User profile information for autocomplete and session management';
COMMENT ON COLUMN profiles.email IS 'User email address from auth.users';
COMMENT ON COLUMN profiles.full_name IS 'User full name for display and autocomplete';

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 2: SESSION INVITATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(session_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_session ON session_invitations(session_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON session_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON session_invitations(session_id, status);

COMMENT ON TABLE session_invitations IS 'Track invited users for sessions (both registered and external emails)';
COMMENT ON COLUMN session_invitations.email IS 'Invited email address (may or may not be in profiles table)';
COMMENT ON COLUMN session_invitations.status IS 'Invitation status: pending, accepted, or declined';

-- ============================================================================
-- SECTION 3: JOIN REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_session ON join_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON join_requests(session_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_email ON join_requests(email) WHERE email IS NOT NULL;

-- Partial unique index: only one pending/approved request per session+email (when email is provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_unique_session_email
  ON join_requests(session_id, email)
  WHERE email IS NOT NULL;

COMMENT ON TABLE join_requests IS 'Pending join requests from non-invited users';
COMMENT ON COLUMN join_requests.email IS 'Optional email (for authenticated users or those providing it)';
COMMENT ON COLUMN join_requests.status IS 'Request status: pending, approved, or rejected';

-- ============================================================================
-- SECTION 4: UPDATE EXISTING TABLES
-- ============================================================================

-- Add columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_join_requests BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sessions_creator ON sessions(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled ON sessions(scheduled_start_time) WHERE scheduled_start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_public ON sessions(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_sessions_creator_created ON sessions(creator_user_id, created_at DESC);

COMMENT ON COLUMN sessions.title IS 'Session title/name for easy identification';
COMMENT ON COLUMN sessions.creator_user_id IS 'User who created the session (NULL for legacy sessions)';
COMMENT ON COLUMN sessions.scheduled_start_time IS 'Optional scheduled start time (NULL for immediate start)';
COMMENT ON COLUMN sessions.is_public IS 'True: anyone can join (legacy), False: invitation-only';
COMMENT ON COLUMN sessions.allow_join_requests IS 'True: non-invited users can request to join';

-- Migrate existing sessions to public (backward compatibility)
UPDATE sessions SET is_public = true WHERE is_public IS NULL;
UPDATE sessions SET allow_join_requests = false WHERE allow_join_requests IS NULL;

-- Add user_id to participants (nullable for anonymous participants)
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id) WHERE user_id IS NOT NULL;

COMMENT ON COLUMN participants.user_id IS 'Link to authenticated user (NULL for anonymous participants)';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Sessions table policies
-- Drop old permissive policy
DROP POLICY IF EXISTS "Allow all on sessions" ON sessions;

-- Anyone can view public active sessions or ended sessions
CREATE POLICY "Public sessions viewable" ON sessions FOR SELECT
  USING (
    is_public = true
    OR status = 'ended'
    OR creator_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM session_invitations
      WHERE session_id = sessions.id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Only authenticated users can create sessions
CREATE POLICY "Authenticated users create sessions" ON sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND creator_user_id = auth.uid());

-- Creators can update their sessions
CREATE POLICY "Creators update their sessions" ON sessions FOR UPDATE
  USING (creator_user_id = auth.uid());

-- Creators can delete their sessions (optional)
CREATE POLICY "Creators delete their sessions" ON sessions FOR DELETE
  USING (creator_user_id = auth.uid());

-- Session invitations policies
ALTER TABLE session_invitations ENABLE ROW LEVEL SECURITY;

-- Session creators can manage invitations
CREATE POLICY "Creators manage invitations" ON session_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = session_invitations.session_id
      AND creator_user_id = auth.uid()
    )
  );

-- Users can view their own invitations
CREATE POLICY "Users view own invitations" ON session_invitations FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can respond to their invitations (update status)
CREATE POLICY "Users respond to invitations" ON session_invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Join requests policies
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- Session creators can view and manage join requests
CREATE POLICY "Creators manage join requests" ON join_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE id = join_requests.session_id
      AND creator_user_id = auth.uid()
    )
  );

-- Anyone can create a join request (anonymous or authenticated)
CREATE POLICY "Anyone creates join requests" ON join_requests FOR INSERT
  WITH CHECK (true);

-- Users can view their own join requests
CREATE POLICY "Users view own requests" ON join_requests FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR (email IS NULL AND auth.uid() IS NULL)
  );

-- Profiles policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view profiles (for autocomplete)
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Users can insert their own profile (handled by trigger, but allow manual too)
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- SECTION 6: REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE session_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE join_requests;

-- ============================================================================
-- SECTION 7: BACKFILL EXISTING DATA
-- ============================================================================

-- Create profiles for existing authenticated users who don't have one
INSERT INTO profiles (id, email, full_name, avatar_url)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
