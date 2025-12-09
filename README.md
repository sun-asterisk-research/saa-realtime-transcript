# SAA 2025 Live Transcript

Real-time speech-to-text transcription and translation system for **Sun Asterisk Annual 2025 CEO Talk**. This application provides live transcription with automatic translation, designed to display on large screens during the event.

## Features

- **Real-time Speech-to-Text**: Transcribe Vietnamese speech in real-time
- **Live Translation**: Automatically translate to English, Vietnamese, or Japanese
- **Large Display Mode**: Fullscreen mode optimized for projection on large screens
- **Visual Highlighting**: New words being transcribed are highlighted in red with larger font
- **Camera Preview**: Display speaker video alongside transcription
- **Custom Context**: Pre-configured with Sun Asterisk terminology for improved accuracy

## Tech Stack

- **Next.js 15** - React framework
- **Soniox Speech-to-Text API** - Real-time transcription and translation
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn or npm
- Soniox API Key (get it at [console.soniox.com](https://console.soniox.com))

### Installation

1. Install dependencies:

```bash
yarn install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Add your Soniox API key to `.env`:

```
SONIOX_API_KEY=your_api_key_here
```

4. Start development server:

```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000)

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

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Entry point with dynamic import
│   ├── live-transcript.tsx   # Main transcription component
│   └── api/
│       └── get-temporary-api-key/
│           └── route.ts      # Secure API key endpoint
├── components/
│   └── button.tsx            # UI components
└── lib/
    ├── useTranscribe.ts      # Transcription hook
    └── utils.ts              # Utility functions
```

## License

Internal use for Sun Asterisk Annual 2025 event.

---

Built with Soniox Speech-to-Text Web SDK
