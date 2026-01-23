# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pnpm monorepo for real-time speech-to-text transcription and translation using the Soniox Speech-to-Text Web SDK. Originally built for the Sun Asterisk Annual 2025 CEO Talk event with live display optimizations.

## Monorepo Structure

```text
packages/
  web/                 # Next.js 16 web application (@sun-asterisk/meeting-trans-web)
  realtime/            # WebSocket proxy server (@sun-asterisk/meeting-trans-realtime)
  supabase/            # Shared Supabase types, queries & migrations (@sun-asterisk/meeting-trans-supabase)
  browser-extension/   # Chrome extension for Google Meet (@sun-asterisk/meeting-trans-browser)
```

## Build & Development Commands

Uses Turborepo for parallel task execution and caching.

```bash
# Root workspace commands (via Turbo)
pnpm dev               # Start web app + realtime server in parallel
pnpm dev:web           # Start Next.js web app only
pnpm dev:realtime      # Start realtime proxy server only
pnpm dev:extension     # Start Chrome extension dev build
pnpm build             # Build all packages
pnpm build:web         # Build web app only
pnpm build:realtime    # Build realtime server only
pnpm build:extension   # Build extension only
pnpm start:realtime    # Start realtime server (production)
pnpm lint              # Lint all packages
pnpm typecheck         # Type check all packages

# Database commands
pnpm db:migrate        # Run migrations
pnpm db:reset          # Reset local database
pnpm sb:genTypes       # Generate Supabase types
pnpm sb:push           # Push database changes to remote
pnpm migration:create  # Create new migration
```

## Environment Setup

**Web App (packages/web):** Copy `packages/web/.env.example` to `packages/web/.env` and set:

- `SONIOX_API_KEY` - Your Soniox API key (required for direct mode)
- `NEXT_PUBLIC_REALTIME_TRANSCRIBE_ENDPOINT` - WebSocket proxy URL (optional, enables proxy mode)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Realtime Server (packages/realtime):** Copy `packages/realtime/.env.example` to `packages/realtime/.env` and set:

- `SONIOX_API_KEY` - Your Soniox API key (required)
- `PORT` - WebSocket server port (default: 3001)
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server-side DB access

## Architecture

### Web App

- **src/app/page.tsx** - Entry point, dynamically imports LiveTranscript (SSR disabled for browser APIs)
- **src/app/live-transcript.tsx** - Main UI component with camera preview, microphone selection, and translation display
- **src/app/api/get-temporary-api-key/route.ts** - Server-side route handler that generates 5-minute temporary API keys from the main SONIOX_API_KEY
- **src/lib/useTranscribe.ts** - React hook wrapping `SonioxClient`, manages transcription state and token handling

### Realtime Proxy Server (packages/realtime)

WebSocket proxy server that acts as intermediary between clients and Soniox API:

- **src/server.ts** - Main WebSocket server, handles client connections and Soniox relay
- **src/transcript-handler.ts** - Processes tokens, broadcasts streaming data, saves final transcripts
- **src/supabase.ts** - Database client for saving transcripts and broadcasting
- **src/types.ts** - TypeScript type definitions

### Chrome Extension (packages/browser-extension)

- **background/** - Service worker and auth management
- **content/** - Content scripts for Google Meet integration
- **popup/** - Extension popup UI

### Data Flow

**Direct Mode (default):**

1. Client calls `/api/get-temporary-api-key` to get a short-lived API key
2. `useTranscribe` hook initializes `SonioxClient` with the temporary key
3. Audio is captured via browser MediaRecorder and streamed over WebSocket to Soniox
4. Tokens are categorized as final/non-final and rendered with different styling
5. Client saves final transcripts to database via API

**Proxy Mode (when `NEXT_PUBLIC_REALTIME_PROXY_URL` is set):**

1. Client connects to realtime proxy server via WebSocket
2. Client sends configuration (session info, translation settings) and audio data
3. Proxy server connects to Soniox API with server-side API key
4. Proxy relays audio to Soniox and receives transcription tokens
5. Proxy broadcasts streaming tokens via Supabase Realtime
6. Proxy saves final transcripts directly to database (server-side)
7. Client receives tokens for local display

## SDK Integration Patterns

**Direct Mode (`useTranscribe` hook):**

- Creates `SonioxClient` once via ref (not state) to avoid re-initialization
- Uses async API key function to fetch temporary keys on-demand
- Cleans up with `cancel()` on component unmount
- Separates final tokens (confirmed) from non-final tokens (in progress)

**Proxy Mode (`useProxyTranscribe` hook):**

- Connects to proxy WebSocket server instead of Soniox directly
- Sends config message with session info, then streams audio as binary data
- Receives tokens from proxy, handles state management locally
- Transcript saving handled by proxy server (reduces client responsibility)

## Deployment

Web app configured for Netlify deployment via `packages/web/netlify.toml`.
