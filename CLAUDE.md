# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

pnpm monorepo for real-time speech-to-text transcription and translation using the Soniox Speech-to-Text Web SDK. Originally built for the Sun Asterisk Annual 2025 CEO Talk event with live display optimizations.

## Monorepo Structure

```text
packages/
  web/                 # Next.js 16 web application (@saa/web)
    supabase/          # Database migrations and configuration
  chrome-extension/    # Chrome extension for Google Meet (@saa/chrome-extension)
```

## Build & Development Commands

```bash
# Root workspace commands
pnpm dev               # Start Next.js web app dev server
pnpm dev:web           # Same as above (alias)
pnpm dev:extension     # Start Chrome extension dev build
pnpm build             # Build all packages
pnpm build:web         # Build web app only
pnpm build:extension   # Build extension only
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

Copy `packages/web/.env.example` to `packages/web/.env` and set:
- `SONIOX_API_KEY` - Your Soniox API key (required)
- `SONIOX_API_HOST` - Optional custom API host (defaults to https://api.soniox.com)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture

### Web App (packages/web)

- **src/app/page.tsx** - Entry point, dynamically imports LiveTranscript (SSR disabled for browser APIs)
- **src/app/live-transcript.tsx** - Main UI component with camera preview, microphone selection, and translation display
- **src/app/api/get-temporary-api-key/route.ts** - Server-side route handler that generates 5-minute temporary API keys from the main SONIOX_API_KEY
- **src/lib/useTranscribe.ts** - React hook wrapping `SonioxClient`, manages transcription state and token handling

### Chrome Extension (packages/chrome-extension)

- **background/** - Service worker and auth management
- **content/** - Content scripts for Google Meet integration
- **popup/** - Extension popup UI

### Data Flow

1. Client calls `/api/get-temporary-api-key` to get a short-lived API key
2. `useTranscribe` hook initializes `SonioxClient` with the temporary key
3. Audio is captured via browser MediaRecorder and streamed over WebSocket
4. Tokens are categorized as final/non-final and rendered with different styling

## SDK Integration Pattern

The `useTranscribe` hook demonstrates the recommended pattern for React apps:
- Creates `SonioxClient` once via ref (not state) to avoid re-initialization
- Uses async API key function to fetch temporary keys on-demand
- Cleans up with `cancel()` on component unmount
- Separates final tokens (confirmed) from non-final tokens (in progress)

## Deployment

Web app configured for Netlify deployment via `packages/web/netlify.toml`.
