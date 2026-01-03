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

/**
 * Generates a ChatGPT prompt that helps users create valid JSON for context sets.
 * The prompt includes structure explanation, validation rules, and an example.
 */
export function generateChatGPTPrompt(): string {
  return `I need you to analyze a document/content and create a JSON configuration for a speech-to-text context set.

YOUR TASK:
1. Read and analyze the content I provide (document, file, or text)
2. Extract important terms, keywords, technical terminology, proper nouns, and domain-specific vocabulary
3. Identify key metadata about the domain/topic
4. If the content contains multiple languages, create translation mappings
5. Generate a JSON that will help improve speech recognition accuracy for this domain

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
  * Create mappings if content has terms in multiple languages
  * Help ensure accurate translation of domain-specific terms
- text: string (max 10,000 characters)
  * Include relevant context, examples, or background information from the content

EXAMPLE OUTPUT FORMAT:
${generateContextSetTemplate()}

INSTRUCTIONS:
1. Paste your document content, upload a file, or describe your content below
2. I will analyze it and extract relevant terms automatically
3. I will generate valid JSON that you can copy directly into your application

PASTE YOUR CONTENT BELOW:
[Your document content, file content, or description of the domain here]`;
}
