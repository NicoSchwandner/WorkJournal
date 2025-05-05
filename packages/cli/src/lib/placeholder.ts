/**
 * Replaces placeholders in a markdown string with values from a map.
 * Placeholders are in the format `$key`.
 * @param md The markdown string containing placeholders.
 * @param map A record where keys are placeholder names (without $) and values are the replacements.
 * @returns The markdown string with placeholders replaced.
 */
export function render(md: string, map: Record<string, string | number>): string {
  // Use a regex to replace all occurrences, avoiding issues with overlapping replacements
  // Placeholder: $ followed by a letter, then letters, numbers, or underscores
  return md.replace(/\$([a-zA-Z][a-zA-Z0-9_]*)/g, (match, key) => {
    // If the key exists in the map, return its string representation
    // Otherwise, return the original match (e.g., leave $unmappedKey as is)
    return map.hasOwnProperty(key) ? String(map[key]) : match;
  });
}

/**
 * Checks if a string contains any unreplaced placeholders in the format `$key`.
 * @param txt The string to check.
 * @returns True if unreplaced placeholders are found, false otherwise.
 */
export const hasUnreplaced = (txt: string): boolean => /\$([a-zA-Z][a-zA-Z0-9_]*)/.test(txt);
