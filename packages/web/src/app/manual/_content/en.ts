import type { ManualContent } from './types';

export const enContent: ManualContent = {
  locale: 'en',
  title: 'User Guide',
  subtitle: 'Complete guide to using the Session Translation application',
  lastUpdated: '2025-01',
  tableOfContentsTitle: 'Table of Contents',
  sections: [
    {
      id: 'login',
      title: '1. Login',
      description: 'Get started by signing in with your Google account',
      content: [
        'Before using the application, you need to sign in with your Google account. This allows you to create sessions, manage context sets, and access your session history.',
        'Click the "Sign In" button in the top right corner of the home page. You will be redirected to Google\'s authentication page where you can select your account.',
        'After successful authentication, you will be redirected back to the application and can start using all features.',
      ],
      image: {
        src: '/manual/01-login.png',
        alt: 'Login screen with Sign In button',
      },
      tips: [
        'In the current MVP version, the system is limited to internal use within Sun*. You need to sign in with your Sun* account.',
        'Your session history and context sets are linked to your account',
      ],
    },
    {
      id: 'main-screen',
      title: '2. Main Screen Overview',
      description: 'Understanding the home page and main features',
      content: [
        'After logging in, you will see the main screen with several key actions available:',
      ],
      image: {
        src: '/manual/02-main-screen.png',
        alt: 'Main screen with action buttons',
      },
      subsections: [
        {
          id: 'main-actions',
          title: 'Main Actions',
          content: [
            '**Create Session**: Start a new translation session as a host. You can configure language pairs, translation mode, and invite participants.',
            '**Join Session**: Enter a session code to join an existing meeting as a participant.',
            '**View My Sessions**: Access your dashboard to see all sessions you have created or participated in.',
            '**Manage Context Sets**: Create and manage terminology dictionaries to improve translation accuracy.',
          ],
        },
      ],
    },
    {
      id: 'context-management',
      title: '3. Context Management',
      description: 'Create and manage context sets for accurate translations',
      content: [
        'Context sets are collections of domain-specific terms, proper nouns, and translation mappings that help the AI recognize and translate specialized vocabulary accurately.',
      ],
      subsections: [
        {
          id: 'what-is-context',
          title: '3.1 What is a Context Set?',
          content: [
            'A context set contains terminology and background information specific to your meetings. When meeting with a new client or discussing a new project, the AI may not recognize company names, product names, or technical terms correctly.',
            'By creating a context set, you provide the AI with this specialized knowledge, resulting in more accurate speech recognition and translation.',
          ],
          tips: [
            'Create context sets for each client or project',
            'Include company names, product names, and technical terms',
            'Add translation mappings for terms that need specific translations',
          ],
        },
        {
          id: 'access-context',
          title: '3.2 Accessing Context Management',
          content: [
            'Click "Manage Context Sets" on the home page or navigate directly to the Contexts page.',
            'You will see two sections: your personal context sets and publicly available context sets that other users have shared.',
          ],
          image: {
            src: '/manual/03-context-list.png',
            alt: 'Context management page showing list of context sets',
          },
        },
        {
          id: 'create-context',
          title: '3.3 Creating a New Context Set',
          content: [
            'Click the "Create New" button to open the context set creation form.',
            'Fill in the following fields:',
            '**Name**: A descriptive name for the context set (e.g., "ClientX Project - JA-VI")',
            '**Description**: Brief explanation of what this context set covers',
            '**Terms**: Domain-specific keywords, proper nouns, and technical terms',
            '**Translation Terms**: Mappings between source and target language terms',
            '**Text**: Additional background information and context',
          ],
          image: {
            src: '/manual/04-context-create.png',
            alt: 'Context set creation form',
          },
        },
        {
          id: 'chatgpt-prompt',
          title: '3.4 Using ChatGPT to Generate Context (Recommended)',
          content: [
            'The easiest way to create a comprehensive context set is to use the built-in ChatGPT prompt feature:',
            '1. Click the "ChatGPT Prompt" button in the context creation form',
            '2. Select the source and target languages for your meeting',
            '3. Copy the generated prompt to your clipboard',
            '4. Open ChatGPT and paste the prompt',
            '5. Paste your project documents, meeting materials, or company information into ChatGPT',
            '6. ChatGPT will analyze the content and generate a JSON with extracted terms',
            '7. Copy the JSON output from ChatGPT',
            '8. Return to the app and use the Import feature to paste the JSON',
          ],
          image: {
            src: '/manual/05-context-chatgpt.png',
            alt: 'ChatGPT prompt dialog with language selection',
          },
          note: 'This method automatically extracts proper nouns, technical terms, and creates appropriate translation mappings.',
        },
        {
          id: 'import-export',
          title: '3.5 Import and Export',
          content: [
            '**Import**: You can import context sets from JSON files. Use the Import tab in the creation form to paste or upload JSON data.',
            '**Export**: Export existing context sets to JSON for backup or sharing with colleagues.',
          ],
        },
        {
          id: 'context-best-practices',
          title: '3.6 Best Practices',
          content: [
            'Follow these recommendations for best results:',
          ],
          tips: [
            'Create separate context sets for each language pair (e.g., one for JA-VI, another for EN-VI)',
            'Use clear naming conventions: "[Client/Project] - [Language Pair]"',
            'Update context sets when new terminology is introduced',
            'Keep terms concise - prefer 1-2 words over long phrases',
            'Include both the original term and common variations',
          ],
        },
      ],
    },
    {
      id: 'create-session',
      title: '4. Creating a Session',
      description: 'Set up a new translation session with the right mode and options',
      content: [
        'After preparing your context sets, you can create a translation session. Choose the translation mode and options that best fit your meeting needs.',
      ],
      image: {
        src: '/manual/06-session-create.png',
        alt: 'Session creation form',
      },
      subsections: [
        {
          id: 'one-way-mode',
          title: '4.1 One-Way Translation Mode',
          content: [
            'In one-way mode, all speech is translated into a single target language.',
            '**Best for**: Meetings where participants speak multiple languages but everyone wants to read translations in one common language.',
            '**Example**: Your team wants all content translated to Vietnamese, regardless of whether speakers are using Japanese, English, or Vietnamese.',
            'Simply select your target language and all recognized speech will be translated to that language.',
          ],
        },
        {
          id: 'two-way-mode',
          title: '4.2 Two-Way Translation Mode',
          content: [
            'In two-way mode, the system detects which of two languages is being spoken and translates it to the other.',
            '**Best for**: Bilateral meetings with exactly two languages where both parties want to see translations in their native language.',
            '**Example**: A Japanese-Vietnamese meeting where Japanese participants see Vietnamese speech translated to Japanese, and Vietnamese participants see Japanese speech translated to Vietnamese.',
            'Select Language A and Language B. The system will automatically detect and translate between them.',
          ],
        },
        {
          id: 'session-options',
          title: '4.3 Session Options',
          content: [
            '**Speaker Diarization**: Enable this to identify different speakers (Speaker 1, Speaker 2, etc.). Useful for meetings with multiple participants to track who said what.',
            '**Context Selection**: Attach one or more context sets to improve recognition accuracy for domain-specific terms.',
          ],
          image: {
            src: '/manual/07-session-options.png',
            alt: 'Session options including speaker diarization and context selection',
          },
        },
        {
          id: 'select-context',
          title: '4.4 Selecting Context Sets',
          content: [
            'During session creation, you can attach context sets to improve transcription and translation accuracy.',
            'In the "Context Sets" section of the creation form, click "Add Context" to browse and select from your personal and public context sets.',
            'You can add multiple context sets to a single session. The system will merge all terms and translation mappings from the selected sets.',
            'If you have not created any context sets yet, refer to section 3 (Context Management) to learn how to create one before starting your session.',
          ],
          tips: [
            'Select context sets that match the meeting topic and language pair',
            'You can also add or remove context sets after the session has started from the session control panel',
          ],
        },
        {
          id: 'invite-participants',
          title: '4.5 Inviting Participants',
          content: [
            'You can invite others to join your session:',
            '**By Email**: Enter email addresses to send invitations. Invited users will receive a notification.',
            '**By Session Code**: Share the 6-digit session code directly. Anyone with the code can join via the Join Session page.',
          ],
          tips: [
            'Session codes are case-insensitive',
            'Invited participants can view the live transcription and translation',
          ],
        },
      ],
    },
    {
      id: 'in-meeting',
      title: '5. During the Meeting',
      description: 'How to use the translation features during your meeting',
      content: [
        'Once the session is started, you will see the real-time transcription and translation interface.',
      ],
      image: {
        src: '/manual/08-in-meeting.png',
        alt: 'In-meeting transcription view',
      },
      note: 'IMPORTANT: For best results, only ONE person needs to join the session and enable their microphone. Use external speakers so the microphone can capture all meeting audio including remote participants.',
      subsections: [
        {
          id: 'audio-setup',
          title: '5.1 Audio Setup (External Speakers)',
          content: [
            'The recommended setup for capturing meeting audio when using external speakers:',
            '1. Have one designated person (usually the host) join the session with microphone enabled',
            '2. Use external speakers at adequate volume',
            '3. The microphone will capture all audio from the room including online meeting participants',
            '4. Other attendees can view the translation on their devices without joining as speakers',
          ],
          tips: [
            'Position the microphone centrally in the meeting room',
            'Avoid multiple people joining with microphones enabled - this can cause echo and duplicate transcriptions',
            'Test audio levels before the meeting starts',
          ],
        },
        {
          id: 'chrome-tab-audio',
          title: '5.2 Chrome Tab Mode (Remote Meetings with Headphones)',
          content: [
            'When you are in an online meeting using headphones, the meeting audio is not played through external speakers, so the microphone cannot capture it. The Tab Audio feature solves this problem.',
            'How it works:',
            '1. Click the "Record from Browser Tab" button in the Tab Audio section',
            '2. The browser will show a tab picker - select the tab containing your meeting (Google Meet, Teams, etc.)',
            '3. IMPORTANT: Check the "Share audio" checkbox before clicking Share',
            '4. The system will automatically capture BOTH your microphone audio AND the browser tab audio SIMULTANEOUSLY',
            'When using this mode, you can wear headphones to listen to the meeting while the system captures both your voice and the voices of other meeting participants.',
          ],
          tips: [
            'This feature only works on Chrome and Edge, not supported on Firefox and Safari',
            'Especially useful for remote meetings when using headphones - no need for external speakers',
            'You can still speak normally - the microphone will capture your voice',
            'Click "Remove" to disconnect the Chrome tab and return to microphone-only mode',
          ],
          note: 'NOTE: When selecting a tab to share, make sure to enable "Share audio" so the system can capture audio from the tab.',
        },
        {
          id: 'transcription-view',
          title: '5.3 Understanding the Display',
          content: [
            'The meeting interface shows:',
            '**Original Speech**: What was recognized from the audio',
            '**Translation**: The translated text in your target language',
            '**Speaker Labels**: If diarization is enabled, speakers are labeled (Speaker 1, Speaker 2, etc.)',
            'Text appears in real-time as speech is recognized. Initial text may update as the AI refines its recognition.',
          ],
        },
        {
          id: 'recording-cost',
          title: '5.4 Important: Recording Costs',
          content: [
            'When you click "Start Recording", the system opens a connection to the AI transcription service. This connection incurs costs as long as it is active, even if no one is speaking.',
            'To avoid unnecessary costs:',
            '1. Click "Stop Recording" when you are not actively using the transcription',
            '2. Click "End Session" when the meeting is finished',
          ],
          note: 'COST WARNING: The AI service connection is billed based on connection time, not speech time. Always stop recording or end the session when not in use.',
        },
      ],
    },
    {
      id: 'other-features',
      title: '6. Other Features',
      description: 'Additional functionality for managing sessions',
      subsections: [
        {
          id: 'end-session',
          title: '6.1 Ending a Session',
          content: [
            'Click the "End Session" button to stop the transcription and save the session.',
            'The complete transcript with translations will be saved and accessible from your session history.',
          ],
        },
        {
          id: 'display-view',
          title: '6.2 Display View',
          content: [
            'Use the Display View for sharing translations on a large screen:',
            '1. Open the session and click "Display View" or navigate to /session/[code]/display',
            '2. This provides a clean, read-only view optimized for projectors or large displays',
            '3. Share this screen so everyone in the meeting room can see the live translations',
          ],
          image: {
            src: '/manual/09-display-view.png',
            alt: 'Display view for sharing on large screens',
          },
          tips: [
            'Use full-screen mode (F11) for the best viewing experience',
            'Adjust browser zoom for readability at distance',
          ],
        },
        {
          id: 'history',
          title: '6.3 Session History',
          content: [
            'Access past sessions from your Dashboard:',
            '1. Click "View My Sessions" on the home page',
            '2. Find the session you want to review',
            '3. Click to open the full transcript with original speech and translations',
            'You can review past meetings, search for specific content, and share transcripts if needed.',
          ],
          image: {
            src: '/manual/10-history.png',
            alt: 'Session history showing past meetings',
          },
        },
      ],
    },
  ],
  footer: {
    helpText: 'Need more help? Contact us via Slack channel',
    channelName: '#con_sun-meeting-support_int',
  },
};
