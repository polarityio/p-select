import { css } from 'lit';

export const baseStyles = css`
  :host {
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    font-family: inherit;
    width: 100%;
    overflow: visible;
    contain: layout;
  }

  :host([aria-expanded='true']) {
    z-index: var(--p-select-dropdown-z-index, 1000);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ── Trigger ── */
  .trigger {
    display: flex;
    align-items: center;
    min-height: var(--p-select-line-height, 1.75em);
    padding: var(--p-select-trigger-padding, 0 16px 0 8px);
    border: var(
      --p-select-trigger-border,
      1px solid var(--p-select-border-color, #aaa)
    );
    border-radius: var(--p-select-border-radius, 4px);
    background: var(--p-select-background, #fff);
    color: var(--p-select-text-color, inherit);
    cursor: pointer;
    user-select: none;
    position: relative;
    outline: none;
    line-height: var(--p-select-line-height, 1.75em);
  }

  .trigger:focus,
  .trigger--active {
    border-color: var(
      --p-select-focus-border-color,
      var(--p-select-border-color, #aaa)
    );
    box-shadow: var(
      --p-select-focus-box-shadow,
      0 0 0 2px rgba(88, 151, 251, 0.3)
    );
    outline: var(--p-select-focus-outline, none);
  }

  :host([disabled]) .trigger {
    background: var(--p-select-disabled-bg, #eee);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .trigger__selected {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .trigger__placeholder {
    flex: 1;
    color: var(--p-select-placeholder-color, #999);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Status Icon (▼) ── */
  .status-icon {
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 8px;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid var(--p-select-text-color, #333);
    flex-shrink: 0;
    transition: transform 0.15s ease;
  }

  :host([aria-expanded='true']) .status-icon {
    transform: rotate(180deg);
  }

  /* ── Loading Icon ── */
  .loading-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    flex-shrink: 0;
    color: var(
      --p-select-loading-icon-color,
      var(--p-select-placeholder-color, #999)
    );
    animation: p-select-spin 0.8s linear infinite;
  }

  @keyframes p-select-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* ── Clear Button ── */
  .clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1em;
    color: var(--p-select-placeholder-color, #999);
    padding: 0 4px;
    margin-right: 4px;
    line-height: 1;
    flex-shrink: 0;
  }

  .clear-btn:hover {
    color: var(--p-select-text-color, #333);
  }

  :host([disabled]) .clear-btn {
    display: none;
  }

  /* ── Dropdown ── */
  .dropdown {
    position: absolute;
    left: 0;
    z-index: var(--p-select-dropdown-z-index, 1000);
    border: var(
      --p-select-dropdown-border,
      1px solid var(--p-select-border-color, #aaa)
    );
    border-radius: var(--p-select-border-radius, 4px);
    background: var(--p-select-background, #fff);
    box-shadow: var(
      --p-select-dropdown-box-shadow,
      0 2px 8px rgba(0, 0, 0, 0.15)
    );
    margin: var(--p-select-dropdown-margin, 2px 0 0);
    overflow: hidden;
    width: max-content;
    min-width: 100%;
  }

  .dropdown[hidden] {
    display: none;
  }

  /* ── Search Input ── */
  .search {
    padding: 4px;
    border-bottom: 1px solid var(--p-select-border-color, #aaa);
  }

  .search-input {
    display: block;
    width: 100%;
    padding: var(--p-select-option-padding, 4px 8px);
    border: var(
      --p-select-search-field-border,
      1px solid var(--p-select-border-color, #aaa)
    );
    border-radius: var(--p-select-search-input-border-radius, 3px);
    font: inherit;
    font-size: inherit;
    outline: none;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(
      --p-select-focus-border-color,
      var(--p-select-border-color, #aaa)
    );
    box-shadow: var(
      --p-select-focus-box-shadow,
      0 0 0 2px rgba(88, 151, 251, 0.3)
    );
  }

  /* ── Options List ── */
  .options {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: calc(
      var(--p-select-visible-options, 7) * var(--p-select-line-height, 1.75em)
    );
    overflow-y: auto;
  }

  .option {
    padding: var(--p-select-option-padding, 4px 8px);
    cursor: pointer;
    user-select: none;
    line-height: var(--p-select-line-height, 1.75em);
  }

  .option--highlighted {
    background: var(--p-select-highlight-bg, #5897fb);
    color: var(--p-select-highlight-color, #fff);
  }

  .option--selected {
    background: var(--p-select-selected-bg, #ddd);
  }

  .option--selected.option--highlighted {
    background: var(--p-select-highlight-bg, #5897fb);
    color: var(--p-select-highlight-color, #fff);
  }

  .option--disabled {
    color: var(--p-select-disabled-color, #999);
    cursor: not-allowed;
    opacity: 0.5;
  }

  .option--message {
    font-style: italic;
    color: var(--p-select-placeholder-color, #999);
    cursor: default;
  }

  /* ── Multiple Select Tags ── */
  .trigger--multiple {
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: 4px;
    padding: 4px;
    min-height: var(--p-select-line-height, 1.75em);
  }

  .trigger__tags-area {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
    min-width: 0;
    min-height: var(--p-select-line-height, 1.75em);
    align-items: center;
  }

  .trigger__icons {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    align-self: flex-start;
    height: var(--p-select-line-height, 1.75em);
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: var(--p-select-tag-bg, #e4e4e4);
    color: var(--p-select-tag-color, #333);
    border: var(--p-select-tag-border, 1px solid #ccc);
    border-radius: var(--p-select-tag-border-radius, 3px);
    padding: var(--p-select-tag-padding, 0 4px);
    line-height: 1.5;
    font-size: 0.9em;
    max-width: 100%;
  }

  .tag__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tag__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1em;
    color: inherit;
    padding: 0 2px;
    line-height: 1;
    opacity: 0.7;
  }

  .tag__remove:hover {
    opacity: 1;
  }

  .trigger__search-input {
    border: none;
    outline: none;
    font: inherit;
    font-size: inherit;
    background: transparent;
    flex: 1;
    min-width: 60px;
    padding: 0;
    line-height: 1.5;
    margin: 0;
  }
`;
