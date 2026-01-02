# SAA 2025 Live Transcript for CEO Talk

Real-time speech-to-text transcription and translation system for **Sun Asterisk Annual 2025 CEO Talk**. This application provides live transcription with automatic translation, designed to display on large screens during the event.

## Features

- **Real-time Speech-to-Text**: Transcribe Vietnamese speech in real-time
- **Live Translation**: Automatically translate to English, Vietnamese, or Japanese
- **Session-based Translation**: Multi-participant sessions with unique codes
- **One-way Mode**: All participants translate to a single target language
- **Two-way Mode**: Bidirectional translation between two languages
- **Large Display Mode**: Fullscreen mode optimized for projection on large screens
- **Visual Highlighting**: New words being transcribed are highlighted in red with larger font
- **Camera Preview**: Display speaker video alongside transcription
- **Custom Context**: Pre-configured with Sun Asterisk terminology for improved accuracy
- **Transcript History**: View past session transcripts

## Tech Stack

- **Next.js 15** - React framework with App Router
- **Soniox Speech-to-Text API** - Real-time transcription and translation
- **Supabase** - Database, real-time subscriptions, and authentication
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js 20+
- Docker Desktop (for Supabase local)
- Yarn or npm
- Soniox API Key (get it at [console.soniox.com](https://console.soniox.com))

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Add your Soniox API key to `.env`:

```
SONIOX_API_KEY=your_api_key_here
```

### Start Supabase (Local Database)

4. Start Supabase local development:

```bash
npx supabase start
```

5. Get the API keys (for reference):

```bash
npx supabase status
```

The default keys are already in `.env.example`. After first start, migrations run automatically.

6. (Optional) Reset database to re-apply migrations and seeds:

```bash
npx supabase db reset
```

### Start Development Server

7. Start the Next.js development server:

```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000)

### Supabase Studio

Access Supabase Studio at [http://127.0.0.1:54323](http://127.0.0.1:54323) to view and manage your database.

### Stop Services

```bash
# Stop Supabase
npx supabase stop

# Stop with data cleanup
npx supabase stop --no-backup
```

## Usage

### Control Panel (Left Side - 30%)

- **Camera**: Select video input device for speaker preview
- **Microphone**: Select audio input device for transcription
- **Target Language**: Choose translation language (English/Vietnamese/Japanese)
- **Start/Stop**: Control transcription session
- **Source Language**: View original transcription

### Display Panel (Right Side - 70%)

- Shows translated text in large, readable font
- New words appear in **red** and **larger size** for emphasis
- Click fullscreen button for projection mode

### Fullscreen Mode

- Click the fullscreen icon (top-right) to expand the translation display
- Optimized font size (`text-6xl`) for large screen projection
- Press `Esc` or click X to exit fullscreen

## Custom Context

The application is pre-configured with Sun Asterisk context for better recognition:

- Company names: Sun Asterisk, Sun*, Viblo, xLab, Morpheus, MoMorph
- Locations: Hanoi, Ho Chi Minh City, Da Nang
- Tech terms: Digital transformation, Agentic Coding, Digital Creative Studio
- Translation mappings for consistent terminology

## Deployment

### Deploy to Netlify

1. Push code to GitHub (ensure `.env` is in `.gitignore`)

2. Connect repository to Netlify

3. Configure build settings:
   - **Base directory**: `examples/nextjs`
   - **Build command**: `yarn build`
   - **Publish directory**: `examples/nextjs/.next`

4. Add environment variable in Netlify dashboard:
   - `SONIOX_API_KEY`: Your Soniox API key

### Security Notes

- API key is stored securely on server-side
- Only temporary API keys (5-minute expiry) are sent to the client
- Never commit `.env` file to version control

## Session-based Translation

### Creating a Session

1. Go to `/create` to create a new session
2. Enter host name and choose translation mode:
   - **One-way**: All participants see translation in one target language
   - **Two-way**: Bidirectional translation between two languages
3. Share the session code with participants

### Joining a Session

1. Go to `/join` or enter session code on homepage
2. Enter your name to join
3. Start speaking - your speech will be transcribed and translated

### Session Display

- `/session/[code]` - Active session with transcription
- `/session/[code]/display` - Large display mode for projection
- `/history` - View past session transcripts

## Project Structure

```
├── supabase/
│   ├── config.toml                    # Supabase CLI configuration
│   ├── migrations/
│   │   └── 20260102000000_init_schema.sql  # Database schema
│   └── seeds/
│       ├── common/                    # Seeds for all environments
│       └── dev/                       # Development-only seeds
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Landing page
│   │   ├── live-transcript.tsx        # Live transcription component
│   │   ├── create/                    # Create session page
│   │   ├── join/                      # Join session page
│   │   ├── session/[code]/            # Session pages
│   │   ├── history/                   # Session history page
│   │   └── api/
│   │       ├── get-temporary-api-key/ # Soniox API key endpoint
│   │       └── sessions/              # Session CRUD endpoints
│   ├── components/
│   │   ├── button.tsx                 # Button component
│   │   └── input.tsx                  # Input component
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts              # Browser Supabase client
│       │   ├── server.ts              # Server Supabase client
│       │   ├── admin-client.ts        # Admin client (bypasses RLS)
│       │   └── types.ts               # Database types
│       ├── useTranscribe.ts           # Transcription hook
│       └── utils.ts                   # Utility functions
└── .env                               # Environment variables
```

## Supabase Commands Reference

```bash
# Start local Supabase
npx supabase start

# Check status and get API keys
npx supabase status

# Reset database (run migrations + seeds)
npx supabase db reset

# Create new migration
npx supabase migration new <name>

# Apply pending migrations
npx supabase migration up

# Stop Supabase
npx supabase stop
```

## License

Internal use for Sun Asterisk Annual 2025 event.

---

Built with Soniox Speech-to-Text Web SDK and Supabase
