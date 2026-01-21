# Soniox Meet Extension

Chrome Extension (Manifest V3) for real-time transcription and translation in Google Meet using Soniox SDK.

## ✨ Features

### Core Features
- ✅ **Real-time Transcription** - Live speech-to-text using Soniox SDK
- ✅ **Auto-Sync with Meet** - Automatically start/stop when toggling Meet's mic button
- ✅ **Caption Replacement** - Hides Meet's captions and shows Soniox captions
- ✅ **Translation** - Translate to 8 languages (English, Vietnamese, Japanese, etc.)
- ✅ **Context Support** - Use custom context sets for enhanced accuracy
- ✅ **Google OAuth** - Secure authentication via existing Next.js web app

### Technical Features
- ✅ Tab Capture API - Captures all Meet audio (local + remote participants)
- ✅ Mic Button Detection - Multiple fallback selectors for reliability
- ✅ Caption Injection - Dynamic hiding of Meet's captions with MutationObserver
- ✅ State Management - Synced state across popup, content script, and background
- ✅ Temporary API Keys - Secure key rotation with retry logic
- ✅ Error Handling - Comprehensive error handling and recovery

## 📦 Installation

### Prerequisites

1. **Next.js Server Running**:
   ```bash
   cd /Users/pham.van.toan/Project/speech-to-text-web/examples/nextjs
   npm run dev
   ```

2. **Environment Variables** (in Next.js `.env`):
   ```bash
   SONIOX_API_KEY=your_permanent_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Build & Install

```bash
# 1. Install dependencies
cd chrome-extension
npm install

# 2. Build extension
npm run build

# 3. Load in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select chrome-extension/dist folder
```

## 🚀 Usage

### First Time Setup

1. **Open Google Meet**: https://meet.google.com/new
2. **Click Extension Icon** in Chrome toolbar
3. **Login with Google** - Will redirect to Next.js app
4. **After login** - Popup shows your contexts and settings

### Start Transcription

**Option 1: Manual Start**
1. Click extension icon
2. Select contexts (optional)
3. Select translation language
4. Click "Start Transcription"

**Option 2: Auto-Sync (Default)**
1. Unmute mic in Google Meet
2. Transcription starts automatically
3. Mute mic → Transcription stops

### View Captions

- Captions appear at bottom of Meet window
- **White text** = Final confirmed tokens
- **Green text** = Non-final in-progress tokens
- Meet's native captions are automatically hidden

## 🏗️ Architecture

### Extension Components

```
chrome-extension/
├── background/
│   ├── service-worker.ts       # Extension lifecycle, auth, state
│   └── auth-manager.ts          # OAuth flow handler
├── content/
│   ├── meet-content-script.ts  # Main orchestrator
│   ├── meet-detector.ts        # Page detection, mic monitoring
│   ├── caption-injector.ts     # Caption display logic
│   └── audio-capture.ts        # Tab audio capture
├── popup/
│   ├── popup.tsx               # React popup UI
│   ├── popup.html              # Popup HTML
│   └── popup.css               # Popup styles
├── shared/
│   ├── types.ts                # TypeScript interfaces
│   ├── messaging.ts            # Chrome message protocol
│   └── constants.ts            # Configuration constants
├── lib/
│   ├── soniox-wrapper.ts       # Soniox SDK wrapper
│   ├── web-app-api.ts          # Backend API client
│   └── context-utils.ts        # Context merging logic
└── manifest.json               # Extension configuration
```

### Data Flow

```
User Action (Mic Toggle)
  ↓
MutationObserver detects change
  ↓
MicButtonMonitor → handleMicStateChange()
  ↓
If Unmuted: Start Transcription
  ↓
1. Capture tab audio (Tab Capture API)
2. Fetch temporary API key from backend
3. Fetch & merge selected contexts
4. Initialize SonioxClient with config
  ↓
Audio Stream → Soniox API
  ↓
Tokens received (onPartialResult)
  ↓
Filter & separate final/non-final
  ↓
CaptionInjector → Update DOM
  ↓
User sees real-time captions ✓
```

## 🔧 Development Setup

### 1. Install Dependencies

```bash
cd chrome-extension
npm install
```

### 2. Build Extension

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension/dist` folder
5. The extension should now appear in your extensions list

### 4. Test on Google Meet

1. Make sure the Next.js web app is running (`npm run dev` in the parent directory)
2. Open a Google Meet call (https://meet.google.com/)
3. Click the extension icon in Chrome toolbar
4. Click "Login with Google"
5. After authentication, you can start transcription

## Project Structure

```
chrome-extension/
├── background/          # Service worker and auth manager
├── content/            # Content scripts for Meet integration
├── popup/              # Extension popup UI
├── shared/             # Shared types and messaging
├── lib/                # API client and Soniox wrapper
├── assets/             # Icons and static assets
├── manifest.json       # Extension configuration
├── vite.config.ts      # Build configuration
└── package.json        # Dependencies
```

## Configuration

Update `WEB_APP_URL` in `shared/constants.ts` to point to your Next.js app:

```typescript
export const WEB_APP_URL = 'http://localhost:3000'; // Development
// export const WEB_APP_URL = 'https://your-app.com'; // Production
```

## Permissions

The extension requires these permissions:
- `storage` - Store authentication tokens and settings
- `tabs` - Query active tabs
- `tabCapture` - Capture audio from Google Meet
- `activeTab` - Access current tab

## Next Steps

Phase 1 (Authentication) is complete. Next phases:

- **Phase 2**: Meet integration (mic monitoring, caption injection, audio capture)
- **Phase 3**: Transcription integration (Soniox wrapper, content script orchestration)
- **Phase 4**: State management, error handling, testing

## Troubleshooting

### Extension doesn't load
- Make sure you built the extension (`npm run build`)
- Check that you're loading the `dist` folder, not the source folder

### Authentication fails
- Make sure the Next.js app is running
- Check that `WEB_APP_URL` in `shared/constants.ts` is correct
- Check browser console for errors

### Can't capture audio
- Make sure you're on a Google Meet page
- Check that the extension has `tabCapture` permission
- Try reloading the Meet page

## Development Workflow

1. Make changes to source files
2. Extension auto-rebuilds (if using `npm run dev`)
3. Click "Reload" button for the extension in `chrome://extensions/`
4. Test changes on Google Meet

## Building for Production

```bash
npm run build
```

The built extension will be in the `dist` folder. Zip this folder to submit to Chrome Web Store.
