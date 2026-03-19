import type { TemplateResult } from 'lit';

/**
 * Extracts the leaf option type from potentially grouped/nested option arrays.
 * For plain types (string, number, object), returns T itself.
 * For group objects, recursively unwraps to the leaf option type.
 */
export type Option<T> = T extends readonly (infer U)[]
  ? Option<U>
  : T extends GroupObject<infer O>
    ? Option<O>
    : T;

/** A group of options with a label and nested options array. */
export interface GroupObject<T = unknown> {
  groupName: string;
  options: readonly T[];
  disabled?: boolean;
  [key: string]: unknown;
}

/** Event detail for p-change events. */
export interface PSelectChangeDetail<T> {
  selected: T | T[] | undefined;
  previous: T | T[] | undefined;
}

/** Event detail for p-search events. */
export interface PSelectSearchDetail<T> {
  term: string;
  results: T[];
}

/** Custom matcher function signature. Returns -1 for no match, 0+ for match. */
export type MatcherFn<T> = (option: T, term: string) => number;

/** Render callback for custom option display. */
export type OptionRenderer<T> = (option: T) => TemplateResult | string;

/** Configuration properties for the p-select component. */
export interface PSelectConfig<T> {
  options: T[];
  selected?: T | T[];
  multiple: boolean;
  placeholder: string;
  searchEnabled: boolean;
  searchField?: string;
  labelField?: string;
  disabled: boolean;
  allowClear: boolean;
  closeOnSelect?: boolean;
  searchPlaceholder: string;
  noMatchesMessage: string;
  searchMessage: string;
  loadingMessage: string;
  highlightOnHover: boolean;
  matchTriggerWidth: boolean;
  triggerClass: string;
  dropdownClass: string;
  tabindex: number;
  search?: (term: string) => Promise<T[]>;
  matcher?: MatcherFn<T>;
  renderOption?: OptionRenderer<T>;
  renderSelectedItem?: OptionRenderer<T>;
}

/** Internal state tracked by the component. */
export interface PSelectState<T> {
  isOpen: boolean;
  searchText: string;
  highlighted: T | undefined;
  loading: boolean;
  results: T[];
}

/** Map of custom events fired by the component. */
export interface PSelectEventMap<T> {
  'p-change': CustomEvent<PSelectChangeDetail<T>>;
  'p-open': CustomEvent<Record<string, never>>;
  'p-close': CustomEvent<Record<string, never>>;
  'p-search': CustomEvent<PSelectSearchDetail<T>>;
  'p-focus': CustomEvent<Record<string, never>>;
  'p-blur': CustomEvent<Record<string, never>>;
}
