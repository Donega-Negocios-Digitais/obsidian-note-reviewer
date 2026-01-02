/**
 * Validation utilities for batch operations.
 *
 * SECURITY RATIONALE:
 * ====================
 * These functions provide security-critical input validation to prevent
 * "Mass Assignment" vulnerabilities (also known as "over-posting" or
 * "auto-binding" vulnerabilities).
 *
 * WHAT IS MASS ASSIGNMENT?
 * Mass assignment occurs when an application automatically binds user input
 * to internal object properties without proper filtering. An attacker can
 * exploit this by including unexpected fields in their request payload.
 *
 * ATTACK EXAMPLE:
 * An attacker sends: { title: 'New Title', org_id: 'attacker-org-id' }
 * Without validation, org_id could be overwritten, allowing the attacker
 * to transfer note ownership to their organization.
 *
 * DEFENSE STRATEGY:
 * We use a WHITELIST approach - only explicitly allowed fields are accepted.
 * All other fields are filtered out, and attempts to modify protected fields
 * are logged for security monitoring.
 *
 * See OWASP for more: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html
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
