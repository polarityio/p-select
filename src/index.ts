export { PSelect } from './p-select.js';
export type {
  PSelectChangeDetail,
  PSelectSearchDetail,
  PSelectConfig,
  PSelectState,
  PSelectEventMap,
  MatcherFn,
  OptionRenderer,
  GroupObject,
  Option,
} from './types.js';
export {
  defaultMatcher,
  defaultTypeAheadMatcher,
  stripDiacritics,
  getOptionLabel,
  filterOptions,
  isOptionDisabled,
  isSelected,
} from './utils/matching.js';
