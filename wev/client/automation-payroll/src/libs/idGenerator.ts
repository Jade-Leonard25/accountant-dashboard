/**
 * Generates a 9-digit numeric string ending with 's' (e.g., "048291735s").
 * Uses crypto.getRandomValues when available for stronger randomness.
 */
export function createNumericSId(): string {
  const digits: string[] = [];

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const array = new Uint32Array(9);
    crypto.getRandomValues(array);

    for (let i = 0; i < 9; i++) {
      digits.push(String(array[i] % 10));
    }
  } else {
    for (let i = 0; i < 9; i++) {
      digits.push(String(Math.floor(Math.random() * 10)));
    }
  }

  return `${digits.join('')}s`;
}

/**
 * Generates a unique 9-digit + 's' ID against an existing Set of IDs.
 */
export function createUniqueNumericSId(existingIds: Set<string>): string {
  let id = createNumericSId();
  while (existingIds.has(id)) {
    id = createNumericSId();
  }
  existingIds.add(id);
  return id;
}

/**
 * Validates whether a string matches 9 digits followed by 's'.
 */
export function isValidNumericSId(value: string): boolean {
  return /^\d{9}s$/.test(value);
}