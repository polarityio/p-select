import type { MatcherFn } from '../types.js';

/**
 * Unicode diacritics combining marks range.
 * Matches combining diacritical marks (U+0300–U+036F).
 */
const DIACRITICS_RE = /[\u0300-\u036f]/g;

/** Strip diacritical marks from a string for accent-insensitive matching. */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(DIACRITICS_RE, '');
}

/**
 * Default matcher: case-insensitive, diacritics-stripped substring match.
 * Returns the index of the match, or -1 if no match.
 */
export function defaultMatcher(option: unknown, term: string): number {
  const text = stripDiacritics(String(option)).toLowerCase();
  const needle = stripDiacritics(term).toLowerCase();
  return text.indexOf(needle);
}

/**
 * Default type-ahead matcher: case-insensitive startsWith check.
 * Returns 0 if the option starts with the term, -1 otherwise.
 */
export function defaultTypeAheadMatcher(option: unknown, term: string): number {
  const text = stripDiacritics(String(option)).toLowerCase();
  const needle = stripDiacritics(term).toLowerCase();
  return text.startsWith(needle) ? 0 : -1;
}

/** Get the display label for an option, given an optional labelField. */
export function getOptionLabel(option: unknown, labelField?: string): string {
  if (option == null) return '';
  if (typeof option === 'string') return option;
  if (typeof option === 'number') return String(option);
  if (labelField && typeof option === 'object') {
    return String((option as Record<string, unknown>)[labelField] ?? '');
  }
  return String(option);
}

/** Get the searchable text for an option, given searchField or labelField. */
export function getSearchText(
  option: unknown,
  searchField?: string,
  labelField?: string,
): string {
  if (option == null) return '';
  if (typeof option === 'string') return option;
  if (typeof option === 'number') return String(option);
  const field = searchField ?? labelField;
  if (field && typeof option === 'object') {
    return String((option as Record<string, unknown>)[field] ?? '');
  }
  return String(option);
}

/** Check if an option is disabled. */
export function isOptionDisabled(option: unknown): boolean {
  if (option == null || typeof option !== 'object') return false;
  return (option as Record<string, unknown>).disabled === true;
}

/**
 * Filter options by search term using a matcher function.
 * Skips disabled options if skipDisabled is true.
 */
export function filterOptions<T>(
  options: readonly T[],
  term: string,
  searchField: string | undefined,
  labelField: string | undefined,
  matcher: MatcherFn<T> = defaultMatcher as MatcherFn<T>,
  skipDisabled = false,
): T[] {
  if (!term) return [...options];

  return options.filter((option) => {
    if (skipDisabled && isOptionDisabled(option)) return false;
    const text = getSearchText(option, searchField, labelField);
    // Use the matcher with the searchable text, not the raw option
    return (matcher as MatcherFn<unknown>)(text, term) >= 0;
  });
}

/**
 * Advance to the next selectable (non-disabled) option.
 * step=1 moves forward, step=-1 moves backward. Wraps around.
 */
export function advanceSelectableOption<T>(
  options: readonly T[],
  current: T | undefined,
  step: 1 | -1,
): T | undefined {
  if (options.length === 0) return undefined;

  const currentIndex = current != null ? options.indexOf(current) : -1;
  let index = currentIndex;
  const len = options.length;

  for (let i = 0; i < len; i++) {
    index = (((index + step) % len) + len) % len;
    if (!isOptionDisabled(options[index])) {
      return options[index];
    }
  }

  return current;
}

/**
 * Find an option matching a type-ahead string.
 * Starts searching from the option after `current` to allow cycling.
 */
export function findOptionWithOffset<T>(
  options: readonly T[],
  text: string,
  searchField: string | undefined,
  labelField: string | undefined,
  current: T | undefined,
  matcher: (option: unknown, term: string) => number = defaultTypeAheadMatcher,
): T | undefined {
  if (!text || options.length === 0) return undefined;

  const startIndex = current != null ? options.indexOf(current) + 1 : 0;
  const len = options.length;

  for (let i = 0; i < len; i++) {
    const idx = (startIndex + i) % len;
    const option = options[idx];
    if (isOptionDisabled(option)) continue;
    const searchText = getSearchText(option, searchField, labelField);
    if (matcher(searchText, text) >= 0) {
      return option;
    }
  }

  return undefined;
}

/** Shallow equality check, with support for Date objects. */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return false;
}

/** Check if a value is selected (handles arrays for multiple mode). */
export function isSelected(option: unknown, selected: unknown): boolean {
  if (selected == null) return false;
  if (Array.isArray(selected)) {
    return selected.some((s) => isEqual(s, option));
  }
  return isEqual(option, selected);
}
