import type { ContextSetFormData } from '@/lib/supabase/types';

/**
 * Validation result with detailed error messages and warnings
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: ContextSetFormData;
}

/**
 * Validates imported JSON against ContextSetFormData schema and constraints.
 * Returns validation result with errors, warnings, and normalized data if valid.
 *
 * @param jsonString - The JSON string to validate
 * @returns ValidationResult with validation status and messages
 */
export function validateImportedJson(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Step 1: Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return {
      isValid: false,
      errors: [`Invalid JSON syntax: ${e instanceof Error ? e.message : 'Unknown error'}`],
      warnings: [],
    };
  }

  // Step 2: Type validation
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    errors.push('JSON must be an object, not an array or primitive value');
    return { isValid: false, errors, warnings };
  }

  // Step 3: Required fields
  if (!parsed.name || typeof parsed.name !== 'string') {
    errors.push('Field "name" is required and must be a string');
  } else if (parsed.name.trim().length === 0) {
    errors.push('Field "name" cannot be empty');
  } else if (parsed.name.length > 100) {
    errors.push(`Field "name" exceeds max length (${parsed.name.length}/100 characters)`);
  }

  if (typeof parsed.is_public !== 'boolean') {
    errors.push('Field "is_public" is required and must be a boolean (true or false)');
  }

  // Step 4: Optional field validation
  // Description
  if (parsed.description !== undefined) {
    if (typeof parsed.description !== 'string') {
      errors.push('Field "description" must be a string');
    } else if (parsed.description.length > 500) {
      errors.push(`Field "description" exceeds max length (${parsed.description.length}/500 characters)`);
    }
  }

  // Text
  if (parsed.text !== undefined) {
    if (typeof parsed.text !== 'string') {
      errors.push('Field "text" must be a string');
    } else if (parsed.text.length > 10000) {
      errors.push(`Field "text" exceeds max length (${parsed.text.length}/10,000 characters)`);
    }
  }

  // Terms array
  if (parsed.terms !== undefined) {
    if (!Array.isArray(parsed.terms)) {
      errors.push('Field "terms" must be an array');
    } else {
      if (parsed.terms.length > 500) {
        errors.push(`Field "terms" exceeds max count (${parsed.terms.length}/500 items)`);
      }
      parsed.terms.forEach((term: any, idx: number) => {
        if (typeof term !== 'string') {
          errors.push(`terms[${idx}] must be a string, got ${typeof term}`);
        } else if (term.length > 200) {
          errors.push(`terms[${idx}] exceeds max length (${term.length}/200 characters)`);
        }
      });
    }
  }

  // General metadata array
  if (parsed.general !== undefined) {
    if (!Array.isArray(parsed.general)) {
      errors.push('Field "general" must be an array');
    } else {
      if (parsed.general.length > 100) {
        errors.push(`Field "general" exceeds max count (${parsed.general.length}/100 items)`);
      }
      parsed.general.forEach((item: any, idx: number) => {
        if (typeof item !== 'object' || item === null) {
          errors.push(`general[${idx}] must be an object`);
        } else {
          if (typeof item.key !== 'string') {
            errors.push(`general[${idx}].key must be a string`);
          } else if (item.key.length > 100) {
            errors.push(`general[${idx}].key exceeds max length (${item.key.length}/100 characters)`);
          }
          if (typeof item.value !== 'string') {
            errors.push(`general[${idx}].value must be a string`);
          } else if (item.value.length > 500) {
            errors.push(`general[${idx}].value exceeds max length (${item.value.length}/500 characters)`);
          }
        }
      });
    }
  }

  // Translation terms array
  if (parsed.translation_terms !== undefined) {
    if (!Array.isArray(parsed.translation_terms)) {
      errors.push('Field "translation_terms" must be an array');
    } else {
      if (parsed.translation_terms.length > 500) {
        errors.push(`Field "translation_terms" exceeds max count (${parsed.translation_terms.length}/500 items)`);
      }
      parsed.translation_terms.forEach((item: any, idx: number) => {
        if (typeof item !== 'object' || item === null) {
          errors.push(`translation_terms[${idx}] must be an object`);
        } else {
          if (typeof item.source !== 'string') {
            errors.push(`translation_terms[${idx}].source must be a string`);
          }
          if (typeof item.target !== 'string') {
            errors.push(`translation_terms[${idx}].target must be a string`);
          }
        }
      });
    }
  }

  // Step 5: Unknown fields warning
  const knownFields = new Set(['name', 'description', 'text', 'is_public', 'terms', 'general', 'translation_terms']);
  Object.keys(parsed).forEach((key) => {
    if (!knownFields.has(key)) {
      warnings.push(`Unknown field "${key}" will be ignored`);
    }
  });

  // Step 6: Build valid data object if no errors
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const data: ContextSetFormData = {
    name: parsed.name.trim(),
    description: parsed.description?.trim(),
    text: parsed.text?.trim(),
    is_public: parsed.is_public,
    terms: parsed.terms || [],
    general: parsed.general || [],
    translation_terms: parsed.translation_terms || [],
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    data,
  };
}
