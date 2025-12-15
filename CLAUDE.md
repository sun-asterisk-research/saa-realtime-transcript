# IMPORTANT
BEFORE ANYTHING ELSE: run 'bd onboard' and follow the instructions

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 example application for real-time speech-to-text transcription and translation using the Soniox Speech-to-Text Web SDK. Originally built for the Sun Asterisk Annual 2025 CEO Talk event with live display optimizations.

## Build & Development Commands

```bash
yarn dev           # Start Next.js dev server with Turbopack
yarn build         # Production build
yarn start         # Start production server
yarn lint          # Run ESLint
```

## Environment Setup

Copy `.env.example` to `.env` and set:
- `SONIOX_API_KEY` - Your Soniox API key (required)
- `SONIOX_API_HOST` - Optional custom API host (defaults to https://api.soniox.com)

## Architecture

### Key Files

- **src/app/page.tsx** - Entry point, dynamically imports LiveTranscript (SSR disabled for browser APIs)
- **src/app/live-transcript.tsx** - Main UI component with camera preview, microphone selection, and translation display
- **src/app/api/get-temporary-api-key/route.ts** - Server-side route handler that generates 5-minute temporary API keys from the main SONIOX_API_KEY
- **src/lib/useTranscribe.ts** - React hook wrapping `SonioxClient`, manages transcription state and token handling

### Data Flow

1. Client calls `/api/get-temporary-api-key` to get a short-lived API key
2. `useTranscribe` hook initializes `SonioxClient` with the temporary key
3. Audio is captured via browser MediaRecorder and streamed over WebSocket
4. Tokens are categorized as final/non-final and rendered with different styling

### UI Components

- **src/components/button.tsx** - Styled button component
- **src/components/input.tsx** - Form input component
- **src/lib/utils.ts** - `cn()` utility for Tailwind class merging

## SDK Integration Pattern

The `useTranscribe` hook demonstrates the recommended pattern for React apps:
- Creates `SonioxClient` once via ref (not state) to avoid re-initialization
- Uses async API key function to fetch temporary keys on-demand
- Cleans up with `cancel()` on component unmount
- Separates final tokens (confirmed) from non-final tokens (in progress)

## Deployment

Configured for Netlify deployment via `netlify.toml`. The base directory should be set to `examples/nextjs` when deploying from the parent SDK repository.
