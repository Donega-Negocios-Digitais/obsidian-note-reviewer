/**
 * Validation utilities for batch operations.
 * These functions provide security-critical input validation to prevent
 * mass assignment vulnerabilities.
 */

/**
 * Filters an input object to only include keys from the allowed fields list.
 * This is a pure function that does not mutate the input object.
 *
 * @param data - The input object to filter (typically user-provided data)
 * @param allowedFields - A readonly array of allowed field names
 * @returns A new object containing only the allowed keys with their values
 *
 * @example
 * const input = { title: 'Test', org_id: 'malicious' };
 * const result = filterAllowedFields(input, ['title', 'content'] as const);
 * // result: { title: 'Test' }
 */
export function filterAllowedFields<T extends readonly string[]>(
  data: Record<string, unknown>,
  allowedFields: T
): Partial<Record<T[number], unknown>> {
  const result: Partial<Record<T[number], unknown>> = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      result[field as T[number]] = data[field];
    }
  }

  return result;
}
