-- Migration: Add Speaker Diarization Support
-- Description: Adds option for sessions to enable speaker diarization,
-- useful for offline meetings where multiple people speak into one microphone.

-- Add enable_speaker_diarization column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS enable_speaker_diarization BOOLEAN DEFAULT false;

-- Add speaker_id column to transcripts table
-- Stores speaker identifier from Soniox API (e.g., "1", "2", "3"... up to "15")
ALTER TABLE transcripts
ADD COLUMN IF NOT EXISTS speaker_id VARCHAR(5);

-- Add comment for documentation
COMMENT ON COLUMN sessions.enable_speaker_diarization IS 'When enabled, Soniox API will identify different speakers from the same audio source';
COMMENT ON COLUMN transcripts.speaker_id IS 'Speaker identifier from Soniox speaker diarization (1-15)';
