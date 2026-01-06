import type { Context } from '@soniox/speech-to-text-web';
import type { ContextSetWithDetails } from '../shared/types';
import { webAppAPI } from './web-app-api';

/**
 * Merges multiple context sets into a single Soniox Context object.
 * Based on merge.ts from web app.
 *
 * Merge strategy:
 * - Terms: concatenate all unique terms
 * - General: later sets override earlier sets (by key)
 * - Text: concatenate with double newline separator
 * - Translation terms: later sets override earlier sets (by source)
 */
export function mergeContextSets(contextSets: ContextSetWithDetails[]): Context {
  if (contextSets.length === 0) {
    return {};
  }

  console.log(`Merging ${contextSets.length} context sets`);

  // Merge terms (unique only, preserve order)
  const termsSet = new Set<string>();
  contextSets.forEach((cs) => {
    if (cs.terms && Array.isArray(cs.terms)) {
      cs.terms
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((t) => termsSet.add(t.term));
    }
  });
  const terms = Array.from(termsSet);

  // Merge general metadata (later overrides earlier by key)
  const generalMap = new Map<string, string>();
  contextSets.forEach((cs) => {
    if (cs.general && Array.isArray(cs.general)) {
      cs.general.forEach((g) => generalMap.set(g.key, g.value));
    }
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
    if (cs.translation_terms && Array.isArray(cs.translation_terms)) {
      cs.translation_terms
        .sort((a, b) => a.sort_order - b.sort_order)
        .forEach((tt) => translationMap.set(tt.source, tt.target));
    }
  });
  const translation_terms = Array.from(translationMap.entries()).map(([source, target]) => ({
    source,
    target,
  }));

  console.log('Merged context:', {
    termsCount: terms.length,
    generalCount: general.length,
    textLength: text?.length || 0,
    translationTermsCount: translation_terms.length,
  });

  // Return only non-empty fields (Soniox accepts partial Context)
  return {
    ...(terms.length > 0 && { terms }),
    ...(general.length > 0 && { general }),
    ...(text && { text }),
    ...(translation_terms.length > 0 && { translation_terms }),
  };
}

/**
 * Fetches context sets from backend and returns merged context
 */
export async function fetchAndMergeContexts(contextIds: string[]): Promise<Context> {
  if (contextIds.length === 0) {
    return {};
  }

  console.log(`Fetching contexts for IDs:`, contextIds);

  try {
    // Fetch all context sets from backend
    const allContexts = await webAppAPI.getContextSets();

    // Filter to selected contexts
    const selectedContexts = allContexts.filter((ctx) => contextIds.includes(ctx.id));

    console.log(`Found ${selectedContexts.length} matching contexts`);

    // Merge contexts
    const merged = mergeContextSets(selectedContexts);

    console.log('Merged context:', merged);

    return merged;
  } catch (error) {
    console.error('Failed to fetch and merge contexts:', error);
    return {};
  }
}

/**
 * Fetches session contexts from backend (for session-based transcription)
 */
export async function fetchSessionContext(sessionCode: string): Promise<Context> {
  try {
    console.log(`Fetching session context for session: ${sessionCode}`);
    const context = await webAppAPI.getSessionContexts(sessionCode);
    console.log('Session context fetched:', context);
    return context;
  } catch (error) {
    console.error('Failed to fetch session context:', error);
    return {};
  }
}
