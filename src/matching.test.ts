import { describe, it, expect } from 'vitest';
import {
  stripDiacritics,
  defaultMatcher,
  defaultTypeAheadMatcher,
  getOptionLabel,
  getSearchText,
  isOptionDisabled,
  filterOptions,
  advanceSelectableOption,
  findOptionWithOffset,
  isEqual,
  isSelected,
} from './utils/matching.js';

describe('matching utilities', () => {
  describe('stripDiacritics', () => {
    it('removes accents from characters', () => {
      expect(stripDiacritics('Café')).toBe('Cafe');
      expect(stripDiacritics('Naïve')).toBe('Naive');
      expect(stripDiacritics('Résumé')).toBe('Resume');
    });

    it('leaves plain ASCII unchanged', () => {
      expect(stripDiacritics('hello')).toBe('hello');
    });
  });

  describe('defaultMatcher', () => {
    it('returns index of substring match', () => {
      expect(defaultMatcher('Hello World', 'world')).toBe(6);
    });

    it('returns -1 for no match', () => {
      expect(defaultMatcher('Hello', 'xyz')).toBe(-1);
    });

    it('is diacritics-insensitive', () => {
      expect(defaultMatcher('Café', 'cafe')).toBeGreaterThanOrEqual(0);
    });

    it('accepts pre-normalized term', () => {
      expect(defaultMatcher('Hello World', 'world', 'world')).toBe(6);
      expect(defaultMatcher('Hello World', 'ignored', 'world')).toBe(6);
    });
  });

  describe('defaultTypeAheadMatcher', () => {
    it('returns 0 when option starts with term', () => {
      expect(defaultTypeAheadMatcher('Alpha', 'al')).toBe(0);
    });

    it('returns -1 when option does not start with term', () => {
      expect(defaultTypeAheadMatcher('Alpha', 'ph')).toBe(-1);
    });

    it('is case-insensitive', () => {
      expect(defaultTypeAheadMatcher('Alpha', 'AL')).toBe(0);
    });

    it('is diacritics-insensitive', () => {
      expect(defaultTypeAheadMatcher('Élan', 'elan')).toBe(0);
    });

    it('accepts pre-normalized term', () => {
      expect(defaultTypeAheadMatcher('Alpha', 'al', 'al')).toBe(0);
      expect(defaultTypeAheadMatcher('Alpha', 'ignored', 'al')).toBe(0);
    });
  });

  describe('getOptionLabel', () => {
    it('returns empty string for null/undefined', () => {
      expect(getOptionLabel(null)).toBe('');
      expect(getOptionLabel(undefined)).toBe('');
    });

    it('returns string as-is', () => {
      expect(getOptionLabel('hello')).toBe('hello');
    });

    it('converts number to string', () => {
      expect(getOptionLabel(42)).toBe('42');
    });

    it('uses labelField for objects', () => {
      expect(getOptionLabel({ name: 'Alice' }, 'name')).toBe('Alice');
    });

    it('falls back to String() for objects without labelField', () => {
      const obj = { toString: () => 'custom' };
      expect(getOptionLabel(obj)).toBe('custom');
    });

    it('returns empty string for missing labelField property', () => {
      expect(getOptionLabel({ id: 1 }, 'name')).toBe('');
    });
  });

  describe('getSearchText', () => {
    it('returns empty string for null/undefined', () => {
      expect(getSearchText(null)).toBe('');
      expect(getSearchText(undefined)).toBe('');
    });

    it('returns string as-is', () => {
      expect(getSearchText('hello')).toBe('hello');
    });

    it('converts number to string', () => {
      expect(getSearchText(42)).toBe('42');
    });

    it('uses searchField over labelField', () => {
      expect(
        getSearchText({ name: 'Alice', role: 'Admin' }, 'role', 'name'),
      ).toBe('Admin');
    });

    it('falls back to labelField when no searchField', () => {
      expect(getSearchText({ name: 'Alice' }, undefined, 'name')).toBe('Alice');
    });

    it('falls back to String() for objects without fields', () => {
      const obj = { toString: () => 'custom' };
      expect(getSearchText(obj)).toBe('custom');
    });
  });

  describe('isOptionDisabled', () => {
    it('returns false for null/undefined', () => {
      expect(isOptionDisabled(null)).toBe(false);
      expect(isOptionDisabled(undefined)).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isOptionDisabled('hello')).toBe(false);
      expect(isOptionDisabled(42)).toBe(false);
    });

    it('returns true for disabled objects', () => {
      expect(isOptionDisabled({ disabled: true })).toBe(true);
    });

    it('returns false for non-disabled objects', () => {
      expect(isOptionDisabled({ disabled: false })).toBe(false);
      expect(isOptionDisabled({ name: 'test' })).toBe(false);
    });
  });

  describe('filterOptions', () => {
    it('returns all options when term is empty', () => {
      const opts = ['A', 'B', 'C'];
      expect(filterOptions(opts, '', undefined, undefined)).toEqual(opts);
    });

    it('filters by substring match', () => {
      const opts = ['Alpha', 'Beta', 'Gamma'];
      expect(filterOptions(opts, 'al', undefined, undefined)).toEqual([
        'Alpha',
      ]);
    });

    it('skips disabled options when skipDisabled is true', () => {
      const opts = [{ name: 'Alice' }, { name: 'Albert', disabled: true }];
      const result = filterOptions(
        opts,
        'al',
        'name',
        undefined,
        undefined,
        true,
      );
      expect(result).toEqual([{ name: 'Alice' }]);
    });

    it('uses custom matcher when provided', () => {
      const opts = ['Alpha', 'Beta'];
      const matcher = () => 0; // always matches
      expect(filterOptions(opts, 'xyz', undefined, undefined, matcher)).toEqual(
        opts,
      );
    });
  });

  describe('advanceSelectableOption', () => {
    it('returns first non-disabled option when no current', () => {
      const opts = ['A', 'B', 'C'];
      expect(advanceSelectableOption(opts, undefined, 1)).toBe('A');
    });

    it('advances forward', () => {
      const opts = ['A', 'B', 'C'];
      expect(advanceSelectableOption(opts, 'A', 1)).toBe('B');
    });

    it('advances backward', () => {
      const opts = ['A', 'B', 'C'];
      expect(advanceSelectableOption(opts, 'B', -1)).toBe('A');
    });

    it('wraps around forward', () => {
      const opts = ['A', 'B', 'C'];
      expect(advanceSelectableOption(opts, 'C', 1)).toBe('A');
    });

    it('wraps around backward', () => {
      const opts = ['A', 'B', 'C'];
      expect(advanceSelectableOption(opts, 'A', -1)).toBe('C');
    });

    it('skips disabled options', () => {
      const opts = [
        { name: 'A' },
        { name: 'B', disabled: true },
        { name: 'C' },
      ];
      expect(advanceSelectableOption(opts, opts[0], 1)).toBe(opts[2]);
    });

    it('returns current when all options are disabled', () => {
      const opts = [
        { name: 'A', disabled: true },
        { name: 'B', disabled: true },
      ];
      expect(advanceSelectableOption(opts, opts[0], 1)).toBe(opts[0]);
    });

    it('returns undefined for empty array', () => {
      expect(advanceSelectableOption([], undefined, 1)).toBeUndefined();
    });
  });

  describe('findOptionWithOffset', () => {
    it('finds option matching type-ahead text', () => {
      const opts = ['Alpha', 'Beta', 'Gamma'];
      expect(
        findOptionWithOffset(opts, 'be', undefined, undefined, undefined),
      ).toBe('Beta');
    });

    it('starts searching after current option', () => {
      const opts = ['Apple', 'Apricot', 'Banana'];
      expect(
        findOptionWithOffset(opts, 'ap', undefined, undefined, 'Apple'),
      ).toBe('Apricot');
    });

    it('wraps around when searching from end', () => {
      const opts = ['Apple', 'Banana', 'Cherry'];
      expect(
        findOptionWithOffset(opts, 'ap', undefined, undefined, 'Cherry'),
      ).toBe('Apple');
    });

    it('skips disabled options', () => {
      const opts = [
        { name: 'Alpha' },
        { name: 'Albert', disabled: true },
        { name: 'Almond' },
      ];
      expect(
        findOptionWithOffset(opts, 'al', 'name', undefined, undefined),
      ).toBe(opts[0]);
      expect(findOptionWithOffset(opts, 'al', 'name', undefined, opts[0])).toBe(
        opts[2],
      );
    });

    it('returns undefined for empty text', () => {
      expect(
        findOptionWithOffset(['A'], '', undefined, undefined, undefined),
      ).toBeUndefined();
    });

    it('returns undefined for empty options', () => {
      expect(
        findOptionWithOffset([], 'a', undefined, undefined, undefined),
      ).toBeUndefined();
    });

    it('returns undefined when no match found', () => {
      expect(
        findOptionWithOffset(['A', 'B'], 'z', undefined, undefined, undefined),
      ).toBeUndefined();
    });

    it('uses custom matcher', () => {
      const opts = ['Alpha', 'Beta'];
      const matcher = () => -1; // never matches
      expect(
        findOptionWithOffset(
          opts,
          'al',
          undefined,
          undefined,
          undefined,
          matcher,
        ),
      ).toBeUndefined();
    });
  });

  describe('isEqual', () => {
    it('returns true for same reference', () => {
      const obj = { a: 1 };
      expect(isEqual(obj, obj)).toBe(true);
    });

    it('returns true for equal Date objects', () => {
      const d1 = new Date('2024-01-01');
      const d2 = new Date('2024-01-01');
      expect(isEqual(d1, d2)).toBe(true);
    });

    it('returns false for different Date objects', () => {
      const d1 = new Date('2024-01-01');
      const d2 = new Date('2024-06-15');
      expect(isEqual(d1, d2)).toBe(false);
    });

    it('returns false for different values', () => {
      expect(isEqual('a', 'b')).toBe(false);
      expect(isEqual(1, 2)).toBe(false);
    });

    it('returns true for same primitives', () => {
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(1, 1)).toBe(true);
    });
  });

  describe('isSelected', () => {
    it('returns false for null/undefined selected', () => {
      expect(isSelected('A', null)).toBe(false);
      expect(isSelected('A', undefined)).toBe(false);
    });

    it('returns true for matching value', () => {
      expect(isSelected('A', 'A')).toBe(true);
    });

    it('returns false for non-matching value', () => {
      expect(isSelected('A', 'B')).toBe(false);
    });

    it('returns true when option is in selected array', () => {
      expect(isSelected('B', ['A', 'B', 'C'])).toBe(true);
    });

    it('returns false when option is not in selected array', () => {
      expect(isSelected('D', ['A', 'B', 'C'])).toBe(false);
    });

    it('handles Date objects in arrays', () => {
      const d1 = new Date('2024-01-01');
      const d2 = new Date('2024-01-01');
      expect(isSelected(d1, [d2])).toBe(true);
    });
  });
});
