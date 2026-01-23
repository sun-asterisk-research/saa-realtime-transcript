-- Meet Sessions for Chrome Extension collaboration
-- This allows multiple participants in a Meet call to sync transcripts

-- 1. Meet Sessions table
create table meet_sessions (
  id uuid primary key default gen_random_uuid(),
  meeting_code text unique not null, -- Meet room code: arf-qqwo-oyx
  created_at timestamptz default now(),
  ended_at timestamptz,
  status text default 'active' check (status in ('active', 'ended')),

  -- Metadata
  total_participants int default 0,
  total_transcripts int default 0
);

create index idx_meet_sessions_meeting_code on meet_sessions(meeting_code);
create index idx_meet_sessions_status on meet_sessions(status);

comment on table meet_sessions is 'Google Meet sessions for real-time transcript collaboration';
comment on column meet_sessions.meeting_code is 'Google Meet room code (e.g., arf-qqwo-oyx)';

-- 2. Meet Session Participants table
create table meet_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references meet_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Participant info from Meet
  display_name text not null,
  email text,

  -- Status
  joined_at timestamptz default now(),
  left_at timestamptz,
  is_active boolean default true,

  -- Unique constraint: one participant record per user per session
  unique(session_id, user_id)
);

create index idx_meet_session_participants_session on meet_session_participants(session_id);
create index idx_meet_session_participants_user on meet_session_participants(user_id);
create index idx_meet_session_participants_is_active on meet_session_participants(is_active);

comment on table meet_session_participants is 'Participants in a Meet session';
comment on column meet_session_participants.display_name is 'Name shown in Google Meet';

-- 3. Meet Transcripts table
create table meet_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references meet_sessions(id) on delete cascade,
  participant_id uuid not null references meet_session_participants(id) on delete cascade,

  -- Transcript data
  text text not null,
  translated_text text, -- if translation enabled
  is_final boolean default false,

  -- Timing
  start_time timestamptz not null,
  end_time timestamptz,

  -- Metadata
  created_at timestamptz default now()
);

create index idx_meet_transcripts_session on meet_transcripts(session_id);
create index idx_meet_transcripts_participant on meet_transcripts(participant_id);
create index idx_meet_transcripts_start_time on meet_transcripts(start_time);
create index idx_meet_transcripts_is_final on meet_transcripts(is_final);

comment on table meet_transcripts is 'Individual transcripts from Meet participants';

-- 4. Enable Realtime for meet_transcripts
alter publication supabase_realtime add table meet_transcripts;

-- 5. RLS Policies

-- meet_sessions: anyone authenticated can read active sessions
alter table meet_sessions enable row level security;

create policy "Anyone can read active sessions"
  on meet_sessions for select
  using (auth.role() = 'authenticated');

create policy "System can insert sessions"
  on meet_sessions for insert
  with check (true);

create policy "System can update sessions"
  on meet_sessions for update
  using (true);

-- meet_session_participants: users can see participants in sessions they're in
alter table meet_session_participants enable row level security;

create policy "Users can see participants in their sessions"
  on meet_session_participants for select
  using (
    auth.role() = 'authenticated' and (
      user_id = auth.uid() or
      session_id in (
        select session_id from meet_session_participants where user_id = auth.uid()
      )
    )
  );

create policy "Users can join sessions"
  on meet_session_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own participant status"
  on meet_session_participants for update
  using (auth.uid() = user_id);

-- meet_transcripts: users can see transcripts from sessions they're in
alter table meet_transcripts enable row level security;

create policy "Users can see transcripts from their sessions"
  on meet_transcripts for select
  using (
    auth.role() = 'authenticated' and
    session_id in (
      select session_id from meet_session_participants where user_id = auth.uid()
    )
  );

create policy "Participants can insert transcripts"
  on meet_transcripts for insert
  with check (
    participant_id in (
      select id from meet_session_participants where user_id = auth.uid()
    )
  );

-- 6. Function to update session participant count
create or replace function update_session_participant_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update meet_sessions
    set total_participants = (
      select count(*) from meet_session_participants where session_id = NEW.session_id
    )
    where id = NEW.session_id;
  elsif (TG_OP = 'DELETE') then
    update meet_sessions
    set total_participants = (
      select count(*) from meet_session_participants where session_id = OLD.session_id
    )
    where id = OLD.session_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger update_session_participant_count_trigger
  after insert or delete on meet_session_participants
  for each row execute function update_session_participant_count();

-- 7. Function to update session transcript count
create or replace function update_session_transcript_count()
returns trigger as $$
begin
  update meet_sessions
  set total_transcripts = (
    select count(*) from meet_transcripts where session_id = NEW.session_id
  )
  where id = NEW.session_id;
  return NEW;
end;
$$ language plpgsql;

create trigger update_session_transcript_count_trigger
  after insert on meet_transcripts
  for each row execute function update_session_transcript_count();
