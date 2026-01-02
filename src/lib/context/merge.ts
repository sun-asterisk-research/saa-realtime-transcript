import type { Context } from '@soniox/speech-to-text-web';
import type { ContextSetWithDetails } from '@/lib/supabase/types';

/**
 * Merges multiple context sets into a single Soniox Context object.
 *
 * Merge strategy:
 * - Terms: concatenate all unique terms
 * - General: later sets override earlier sets (by key)
 * - Text: concatenate with double newline separator
 * - Translation terms: later sets override earlier sets (by source)
 *
 * @param contextSets - Array of context sets in merge priority order (first = lowest priority, last = highest)
 * @returns Merged Context object ready for Soniox SDK
 *
 * @example
 * ```typescript
 * const contextSets = [
 *   { terms: ['AWS', 'Docker'], general: [{ key: 'domain', value: 'Tech' }], ... },
 *   { terms: ['Docker', 'K8s'], general: [{ key: 'domain', value: 'DevOps' }], ... }
 * ];
 * const merged = mergeContextSets(contextSets);
 * // Result: { terms: ['AWS', 'Docker', 'K8s'], general: [{ key: 'domain', value: 'DevOps' }], ... }
 * ```
 */
export function mergeContextSets(contextSets: ContextSetWithDetails[]): Context {
  if (contextSets.length === 0) {
    return {};
  }

  // Merge terms (unique only, preserve order)
  const termsSet = new Set<string>();
  contextSets.forEach((cs) => {
    cs.terms
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((t) => termsSet.add(t.term));
  });
  const terms = Array.from(termsSet);

  // Merge general metadata (later overrides earlier by key)
  const generalMap = new Map<string, string>();
  contextSets.forEach((cs) => {
    cs.general.forEach((g) => generalMap.set(g.key, g.value));
  });
  const general = Array.from(generalMap.entries()).map(([key, value]) => ({ key, value }));

  // Merge text (concatenate with separator, filter empty)
  const textParts = contextSets
    .map((cs) => cs.text)
    .filter((t): t is string => !!t && t.trim().length > 0);
  const text = textParts.length > 0 ? textParts.join('\n\n') : undefined;

  // Merge translation terms (later overrides earlier by source)
  const translationMap = new Map<string, string>();
  contextSets.forEach((cs) => {
    cs.translation_terms
      .sort((a, b) => a.sort_order - b.sort_order)
      .forEach((tt) => translationMap.set(tt.source, tt.target));
  });
  const translation_terms = Array.from(translationMap.entries()).map(([source, target]) => ({
    source,
    target,
  }));

  // Return only non-empty fields (Soniox accepts partial Context)
  return {
    ...(terms.length > 0 && { terms }),
    ...(general.length > 0 && { general }),
    ...(text && { text }),
    ...(translation_terms.length > 0 && { translation_terms }),
  };
}

/**
 * Validates a context set against Soniox limits
 *
 * Limits (from Soniox docs):
 * - Max context size: 8,000 tokens (~10,000 characters)
 * - General section: ideally ≤10 key-value pairs
 * - No specific limits on terms/translation_terms count
 *
 * @param contextSet - Context set to validate
 * @returns Validation errors (empty array if valid)
 */
export function validateContextSet(contextSet: ContextSetWithDetails): string[] {
  const errors: string[] = [];

  // Validate text length (rough approximation: 1 char ≈ 1 token)
  const textLength = contextSet.text?.length || 0;
  if (textLength > 10000) {
    errors.push(`Text field too long (${textLength} chars, max 10,000)`);
  }

  // Validate general metadata count
  if (contextSet.general.length > 100) {
    errors.push(`Too many general metadata pairs (${contextSet.general.length}, max 100)`);
  }

  // Validate terms count
  if (contextSet.terms.length > 500) {
    errors.push(`Too many terms (${contextSet.terms.length}, recommended max 500)`);
  }

  // Validate translation terms count
  if (contextSet.translation_terms.length > 500) {
    errors.push(`Too many translation terms (${contextSet.translation_terms.length}, recommended max 500)`);
  }

  // Validate individual term lengths
  contextSet.terms.forEach((term, idx) => {
    if (term.term.length > 200) {
      errors.push(`Term #${idx + 1} too long (${term.term.length} chars, max 200)`);
    }
  });

  // Validate general key/value lengths
  contextSet.general.forEach((g, idx) => {
    if (g.key.length > 100) {
      errors.push(`General key #${idx + 1} too long (${g.key.length} chars, max 100)`);
    }
    if (g.value.length > 500) {
      errors.push(`General value for key "${g.key}" too long (${g.value.length} chars, max 500)`);
    }
  });

  return errors;
}

/**
 * Estimates the total token count for merged context sets
 * (Rough approximation: 1 word ≈ 1.3 tokens, 1 char ≈ 0.25 tokens)
 *
 * @param contextSets - Context sets to estimate
 * @returns Estimated token count
 */
export function estimateTokenCount(contextSets: ContextSetWithDetails[]): number {
  const merged = mergeContextSets(contextSets);

  let totalChars = 0;

  // Terms: each term ≈ its character length
  if (merged.terms) {
    totalChars += merged.terms.reduce((sum, term) => sum + term.length, 0);
  }

  // General: key + value pairs
  if (merged.general) {
    totalChars += merged.general.reduce((sum, g) => sum + g.key.length + g.value.length, 0);
  }

  // Text: full text length
  if (merged.text) {
    totalChars += merged.text.length;
  }

  // Translation terms: source + target pairs
  if (merged.translation_terms) {
    totalChars += merged.translation_terms.reduce((sum, tt) => sum + tt.source.length + tt.target.length, 0);
  }

  // Rough approximation: 4 chars ≈ 1 token
  return Math.ceil(totalChars / 4);
}
