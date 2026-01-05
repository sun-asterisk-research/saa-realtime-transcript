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

  // For simplified ContextSetWithDetails (from API), we don't have the full structure
  // So we'll just merge what we have
  // In real usage, backend should return full context structure

  // Return empty context for now
  // TODO: Backend API should return full context with terms, general, etc.
  return {};
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
