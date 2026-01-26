import type { ContextSetFormData } from '@/lib/supabase/types';

/**
 * Generates a clean JSON template for context set import.
 * This template can be copied and pasted directly into applications.
 */
export function generateContextSetTemplate(): string {
  const template: ContextSetFormData = {
    name: 'My Context Set',
    description: 'Brief description of what this context set contains',
    is_public: false,
    terms: ['term1', 'term2', 'term3'],
    general: [
      { key: 'domain', value: 'Technology' },
      { key: 'topic', value: 'Cloud Computing' },
    ],
    translation_terms: [
      { source: 'cloud', target: 'クラウド' },
      { source: 'server', target: 'サーバー' },
    ],
    text: 'Additional context text, examples, or relevant information goes here.',
  };

  return JSON.stringify(template, null, 2);
}

/**
 * Generates an annotated template with inline comments explaining the structure.
 * Since JSON doesn't support comments, this returns a comment-annotated string.
 * Users can reference this to understand the structure but should use the clean template for imports.
 */
export function generateAnnotatedTemplate(): string {
  return `{
  // REQUIRED: Name of the context set (max 100 characters)
  "name": "My Context Set",

  // OPTIONAL: Brief description (max 500 characters)
  "description": "Brief description of what this context set contains",

  // REQUIRED: Whether this context set is publicly accessible
  "is_public": false,

  // OPTIONAL: Array of domain-specific terms/keywords (max 500 terms)
  // Each term: max 200 characters
  "terms": [
    "term1",
    "term2",
    "term3"
  ],

  // OPTIONAL: Key-value metadata pairs (max 100 pairs)
  // Each key: max 100 characters, each value: max 500 characters
  "general": [
    { "key": "domain", "value": "Technology" },
    { "key": "topic", "value": "Cloud Computing" }
  ],

  // OPTIONAL: Translation term mappings (max 500 pairs)
  // Forces specific translations for certain terms
  "translation_terms": [
    { "source": "cloud", "target": "クラウド" },
    { "source": "server", "target": "サーバー" }
  ],

  // OPTIONAL: Long-form context text (max 10,000 characters)
  "text": "Additional context text, examples, or relevant information goes here."
}`;
}

// Language code to name mapping
export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'th', name: 'Thai (ภาษาไทย)' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
  { code: 'ms', name: 'Malay (Bahasa Melayu)' },
  { code: 'tl', name: 'Filipino/Tagalog' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ar', name: 'Arabic (العربية)' },
];

/**
 * Generates a ChatGPT prompt that helps users create valid JSON for context sets.
 * The prompt includes structure explanation, validation rules, and an example.
 * @param sourceLanguage - Optional source language code (e.g., 'en', 'vi')
 * @param targetLanguage - Optional target language code (e.g., 'ja', 'ko')
 */
export function generateChatGPTPrompt(sourceLanguage?: string, targetLanguage?: string): string {
  const sourceLang = LANGUAGE_OPTIONS.find(l => l.code === sourceLanguage);
  const targetLang = LANGUAGE_OPTIONS.find(l => l.code === targetLanguage);

  const hasJapanese = sourceLanguage === 'ja' || targetLanguage === 'ja';

  const languageContext = sourceLanguage && targetLanguage
    ? `\n\nLANGUAGE PAIR FOR THIS CONTEXT SET:
- Source Language: ${sourceLang?.name || sourceLanguage.toUpperCase()} (${sourceLanguage})
- Target Language: ${targetLang?.name || targetLanguage.toUpperCase()} (${targetLanguage})

IMPORTANT: Generate the context set specifically for this language pair:
- The "terms" array should contain important terms in ${sourceLang?.name || sourceLanguage.toUpperCase()} that need accurate recognition
- The "translation_terms" array MUST contain translations from ${sourceLang?.name || sourceLanguage.toUpperCase()} to ${targetLang?.name || targetLanguage.toUpperCase()}
- Focus on domain-specific terms that are commonly mistranslated or need specific translations
- Include proper nouns, technical terms, and specialized vocabulary with their accurate translations`
    : '';

  const translationExample = hasJapanese
    ? `
  "translation_terms": [
    { "source": "デジタルトランスフォーメーション", "target": "Digital Transformation" },
    { "source": "クラウド", "target": "Cloud" },
    { "source": "サーバー", "target": "Server" },
    { "source": "インフラストラクチャー", "target": "Infrastructure" }
  ],`
    : sourceLanguage && targetLanguage
    ? `
  "translation_terms": [
    { "source": "example term in ${sourceLanguage}", "target": "translation in ${targetLanguage}" },
    { "source": "technical term", "target": "accurate translation" }
  ],`
    : `
  "translation_terms": [
    { "source": "digital transformation", "target": "chuyển đổi số" },
    { "source": "infrastructure", "target": "cơ sở hạ tầng" }
  ],`;

  const katakanaExamples = hasJapanese
    ? `
  - Japanese Katakana loanwords → map to original English in translation_terms
    Examples: "デジタルトランスフォーメーション" → "Digital Transformation", "クラウド" → "Cloud"`
    : '';

  const katakanaTranslationRule = hasJapanese
    ? `
- Focus primarily on Katakana loanwords → original English form
  Examples: "デジタルトランスフォーメーション" → "Digital Transformation", "クラウド" → "Cloud", "サーバー" → "Server"
- For specialized Japanese IT terminology, prefer English technical terms over direct Vietnamese translations`
    : '';

  return `I need you to analyze a document/content and create a JSON configuration for a speech-to-text context set.${languageContext}

YOUR TASK:
1. Read and analyze the content I provide (document, file, or text)
2. Extract important terms, keywords, technical terminology, proper nouns, and domain-specific vocabulary
3. Identify key metadata about the domain/topic
4. ${sourceLanguage && targetLanguage ? `Create translation mappings from ${sourceLang?.name || sourceLanguage.toUpperCase()} to ${targetLang?.name || targetLanguage.toUpperCase()}` : 'If the content contains multiple languages, create translation mappings'}
5. Generate a JSON that will help improve speech recognition accuracy for this domain

ADDITIONAL REQUIREMENTS (IMPORTANT – FOLLOW STRICTLY)

Goal: Build a speech-to-text context set. The priority is to include terms that are frequently misrecognized without domain context.

1) What to extract (HIGH PRIORITY):
- Proper nouns: people names, company names, subsidiary names, product/platform/service names
- Organization terms: department/team/unit/line/center names (use the shortest meaningful form; see formatting rules below)
- Acronyms and abbreviations (e.g., R&D, HRBP, CI/CD, DX, KPI)
- Loanwords and technical vocabulary that tend to be misrecognized:
  - English terms used in non-English meetings${katakanaExamples}

2) What to exclude (FILTER OUT):
- Generic/common words that are easy for Speech-To-Text engines (e.g., company, overview, meeting)
- Common words unless they are part of a proper noun

3) Term formatting rules (STRICT):
- Terms must be single words or short phrases (1-2 words preferred)
- Avoid long sentences, slogans, or phrases longer than 2 words whenever possible
- Prefer the most "recognition-critical" form:
  - If the term already implies the category, remove redundant suffixes like "Line / Unit / Center"
    Example: "AI Research Line" → "AI Research"; "Design Vietnam Unit" → "Design Vietnam"
  - If a department appears in multiple numbered variants, keep the base name only
    Example: "Creative & Engineering Vietnam Center 1/2/3/4" → "Creative & Engineering Vietnam Center"
- For Vietnamese personal names: include only the accented Vietnamese form (no duplicate non-accent versions)

4) translation_terms rules:${katakanaTranslationRule}
- Focus on domain-specific terms that need accurate translation
- Include technical terms, proper nouns, and specialized vocabulary with their accurate translations

5) Completeness expectations:
- Be exhaustive within the document scope: do not miss important names/acronyms/department labels/loanwords

6) text field:
- Provide a long, coherent background text usable as STT context
- Include relevant examples, definitions, and context about the domain

JSON STRUCTURE REQUIREMENTS:

REQUIRED FIELDS:
- name: string (max 100 characters) - Create a descriptive name based on the content domain
- is_public: boolean - Set to false by default

OPTIONAL FIELDS (Extract from provided content):
- description: string (max 500 characters) - Summarize what domain/topic this covers
- terms: string[] (max 500 items, each max 200 chars)
  * Extract: technical terms, jargon, product names, company names, acronyms, specialized vocabulary
  * Prioritize: words that might be misrecognized by generic speech-to-text
- general: {key: string, value: string}[] (max 100 items)
  * Add metadata like: domain, industry, topic, language, region, etc.
  * Each key: max 100 characters, each value: max 500 characters
- translation_terms: {source: string, target: string}[] (max 500 items)
  * Create mappings for domain-specific terms${sourceLanguage && targetLanguage ? ` from ${sourceLang?.name || sourceLanguage.toUpperCase()} to ${targetLang?.name || targetLanguage.toUpperCase()}` : ''}
  * Help ensure accurate translation of domain-specific terms
- text: string (max 10,000 characters)
  * Include relevant context, examples, or background information from the content

EXAMPLE OUTPUT FORMAT:
{
  "name": "Company Annual Meeting 2025",
  "description": "Context set for annual corporate meeting with department introductions and business updates",
  "is_public": false,
  "terms": [
    "Sun Asterisk",
    "Nguyễn Văn A",
    "Tanaka Taro",
    "AI Research",
    "Creative Engineering",
    "R&D",
    "DX",
    "HRBP",
    "CI/CD"
  ],
  "general": [
    { "key": "domain", "value": "Corporate" },
    { "key": "event_type", "value": "Annual Meeting" },
    { "key": "source_language", "value": "${sourceLanguage || 'ja'}" },
    { "key": "target_language", "value": "${targetLanguage || 'vi'}" }
  ],${translationExample}
  "text": "This is the annual meeting of Sun Asterisk Inc., featuring presentations from various departments including AI Research, Creative Engineering Vietnam, and the R&D division. Key topics include digital transformation (DX) initiatives, CI/CD pipeline improvements, and HRBP updates."
}

INSTRUCTIONS:
1. Paste your document content, upload a file, or describe your content below
2. I will analyze it and extract relevant terms automatically
3. I will generate valid JSON that you can copy directly into your application

PASTE YOUR CONTENT BELOW:
[Your document content, file content, or description of the domain here]`;
}
