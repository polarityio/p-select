import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { computePosition, flip, shift, size } from '@floating-ui/dom';
import { baseStyles } from './styles/base.js';
import type {
  MatcherFn,
  OptionRenderer,
  PSelectChangeDetail,
  PSelectSearchDetail,
} from './types.js';
import {
  getOptionLabel,
  filterOptions,
  advanceSelectableOption,
  findOptionWithOffset,
  isOptionDisabled,
  isSelected,
} from './utils/matching.js';

@customElement('p-select')
export class PSelect<T = unknown> extends LitElement {
  static styles = [baseStyles];

  // ── Public Properties ──

  @property({ attribute: false })
  options: T[] = [];

  @property({ attribute: false })
  selected?: T | T[];

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property()
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, attribute: 'search-enabled' })
  searchEnabled = true;

  @property({ attribute: 'search-field' })
  searchField?: string;

  @property({ attribute: 'label-field' })
  labelField?: string;

  @property({ type: Boolean, attribute: 'allow-clear' })
  allowClear = false;

  @property({ type: Boolean, attribute: 'close-on-select' })
  closeOnSelect?: boolean;

  @property({ attribute: 'search-placeholder' })
  searchPlaceholder = '';

  @property({ attribute: 'no-matches-message' })
  noMatchesMessage = 'No results found';

  @property({ attribute: 'search-message' })
  searchMessage = 'Type to search';

  @property({ attribute: 'loading-message' })
  loadingMessage = 'Loading...';

  @property({ type: Boolean, attribute: 'highlight-on-hover' })
  highlightOnHover = true;

  @property({ type: Boolean, attribute: 'match-trigger-width' })
  matchTriggerWidth = true;

  @property({ attribute: 'trigger-class' })
  triggerClass = '';

  @property({ attribute: 'dropdown-class' })
  dropdownClass = '';

  @property({ type: Number, reflect: true, attribute: 'tabindex' })
  triggerTabindex = 0;

  @property({ attribute: false })
  search?: (term: string) => Promise<T[]>;

  @property({ attribute: false })
  matcher?: MatcherFn<T>;

  @property({ attribute: false })
  renderOption?: OptionRenderer<T>;

  @property({ attribute: false })
  renderSelectedItem?: OptionRenderer<T>;

  // ── Internal State ──

  @state() private _isOpen = false;
  @state() private _searchText = '';
  @state() private _highlighted?: T;
  @property({ type: Boolean, reflect: true })
  loading = false;
  @state() private _results: T[] = [];
  @state() private _hasSearched = false;

  @query('.trigger') private _triggerEl!: HTMLElement;
  @query('.dropdown') private _dropdownEl!: HTMLElement;
  @query('.search-input') private _searchInputEl?: HTMLInputElement;
  @query('.trigger__search-input')
  private _triggerSearchInputEl?: HTMLInputElement;

  private _searchCounter = 0;
  private _typeAheadBuffer = '';
  private _typeAheadTimeout?: ReturnType<typeof setTimeout>;
  private _searchDebounceTimer?: ReturnType<typeof setTimeout>;
  private _resizeObserver?: ResizeObserver;

  // ── Lifecycle ──

  override connectedCallback() {
    super.connectedCallback();
    this._results = [...this.options];
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanup();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('options') && !this.search) {
      this._results = [...this.options];
      if (this._searchText) {
        this._filterSync(this._searchText);
      }
    }

    if (changed.has('_isOpen')) {
      this.setAttribute('aria-expanded', String(this._isOpen));
      if (this._isOpen) {
        this._positionDropdown();
        this._addOutsideClickListener();
      } else {
        this._removeOutsideClickListener();
      }
    }
  }

  // ── Computed helpers ──

  private get _shouldCloseOnSelect(): boolean {
    return this.closeOnSelect ?? !this.multiple;
  }

  private get _activeOptions(): T[] {
    return this._results;
  }

  private _getLabel(option: T): string {
    return getOptionLabel(option, this.labelField);
  }

  // ── Open / Close ──

  open() {
    if (this._isOpen || this.disabled) return;
    this._isOpen = true;
    this._hasSearched = false;

    if (!this.search) {
      this._results = [...this.options];
      if (this._searchText) {
        this._filterSync(this._searchText);
      }
    }

    // Highlight the currently selected option (or first)
    if (this.multiple) {
      this._highlighted = this._activeOptions.find((o) => !isOptionDisabled(o));
    } else {
      this._highlighted =
        (this.selected != null
          ? this._activeOptions.find((o) => o === this.selected)
          : undefined) ?? this._activeOptions.find((o) => !isOptionDisabled(o));
    }

    this.dispatchEvent(
      new CustomEvent('p-open', { bubbles: true, composed: true }),
    );

    this.updateComplete.then(() => {
      if (this.searchEnabled) {
        const input = this.multiple
          ? this._triggerSearchInputEl
          : this._searchInputEl;
        input?.focus();
      }
      this._scrollToHighlighted();
    });
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._searchText = '';
    this._hasSearched = false;
    this.loading = false;

    this.dispatchEvent(
      new CustomEvent('p-close', { bubbles: true, composed: true }),
    );

    // Return focus to trigger
    this.updateComplete.then(() => {
      this._triggerEl?.focus();
    });
  }

  toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // ── Selection ──

  private _selectOption(option: T) {
    if (isOptionDisabled(option)) return;

    const previous = this.selected;

    if (this.multiple) {
      const currentSelected = Array.isArray(this.selected)
        ? [...this.selected]
        : [];
      const idx = currentSelected.indexOf(option);
      if (idx >= 0) {
        currentSelected.splice(idx, 1);
      } else {
        currentSelected.push(option);
      }
      this.selected = currentSelected;
    } else {
      this.selected = option;
    }

    const detail: PSelectChangeDetail<T> = {
      selected: this.selected,
      previous,
    };
    this.dispatchEvent(
      new CustomEvent('p-change', { bubbles: true, composed: true, detail }),
    );

    if (this._shouldCloseOnSelect) {
      this.close();
    } else if (this.multiple && this.searchEnabled) {
      // Clear search and refocus input in multiple mode
      this._searchText = '';
      if (!this.search) {
        this._results = [...this.options];
      }
      this.updateComplete.then(() => {
        this._triggerSearchInputEl?.focus();
      });
    }
  }

  private _clearSelection(e: Event) {
    e.stopPropagation();
    const previous = this.selected;
    this.selected = this.multiple ? [] : undefined;
    const detail: PSelectChangeDetail<T> = {
      selected: this.selected,
      previous,
    };
    this.dispatchEvent(
      new CustomEvent('p-change', { bubbles: true, composed: true, detail }),
    );
  }

  private _removeTag(option: T, e: Event) {
    e.stopPropagation();
    if (this.disabled) return;
    const previous = this.selected;
    const currentSelected = Array.isArray(this.selected)
      ? [...this.selected]
      : [];
    const idx = currentSelected.indexOf(option);
    if (idx >= 0) {
      currentSelected.splice(idx, 1);
      this.selected = currentSelected;
      const detail: PSelectChangeDetail<T> = {
        selected: this.selected,
        previous,
      };
      this.dispatchEvent(
        new CustomEvent('p-change', { bubbles: true, composed: true, detail }),
      );
    }
  }

  // ── Search / Filter ──

  /** Debounce delay for synchronous search filtering (ms). */
  @property({ type: Number, attribute: 'search-debounce' })
  searchDebounce = 150;

  private _onSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this._searchText = input.value;

    if (this.search) {
      this._doAsyncSearch(this._searchText);
    } else {
      clearTimeout(this._searchDebounceTimer);
      if (this.searchDebounce <= 0) {
        this._filterSync(this._searchText);
      } else {
        this._searchDebounceTimer = setTimeout(() => {
          this._filterSync(this._searchText);
        }, this.searchDebounce);
      }
    }
  }

  private _filterSync(term: string) {
    this._results = filterOptions(
      this.options,
      term,
      this.searchField,
      this.labelField,
      this.matcher,
    );
    this._highlighted = this._results.find((o) => !isOptionDisabled(o));
    this._hasSearched = true;

    const detail: PSelectSearchDetail<T> = {
      term,
      results: this._results,
    };
    this.dispatchEvent(
      new CustomEvent('p-search', { bubbles: true, composed: true, detail }),
    );
  }

  private async _doAsyncSearch(term: string) {
    if (!this.search) return;

    const searchId = ++this._searchCounter;
    this.loading = true;
    this._hasSearched = true;

    try {
      const results = await this.search(term);
      // Ignore stale results
      if (searchId !== this._searchCounter) return;
      this._results = results;
      this._highlighted = results.find((o) => !isOptionDisabled(o));
      this.loading = false;

      const detail: PSelectSearchDetail<T> = { term, results };
      this.dispatchEvent(
        new CustomEvent('p-search', { bubbles: true, composed: true, detail }),
      );
    } catch {
      if (searchId !== this._searchCounter) return;
      this.loading = false;
      this._results = [];
    }
  }

  // ── Keyboard Navigation ──

  private _onTriggerKeydown(e: KeyboardEvent) {
    if (this.disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._isOpen) {
          this.open();
        } else {
          this._highlighted = advanceSelectableOption(
            this._activeOptions,
            this._highlighted,
            1,
          );
          this._scrollToHighlighted();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!this._isOpen) {
          this.open();
        } else {
          this._highlighted = advanceSelectableOption(
            this._activeOptions,
            this._highlighted,
            -1,
          );
          this._scrollToHighlighted();
        }
        break;

      case 'Home':
        e.preventDefault();
        if (this._isOpen) {
          this._highlighted = this._activeOptions.find(
            (o) => !isOptionDisabled(o),
          );
          this._scrollToHighlighted();
        }
        break;

      case 'End':
        e.preventDefault();
        if (this._isOpen) {
          for (let i = this._activeOptions.length - 1; i >= 0; i--) {
            if (!isOptionDisabled(this._activeOptions[i])) {
              this._highlighted = this._activeOptions[i];
              break;
            }
          }
          this._scrollToHighlighted();
        }
        break;

      case 'Enter':
      case ' ': {
        // Allow space to type normally in search inputs
        const isSearchInput =
          e.key === ' ' &&
          (e.target as HTMLElement)?.tagName === 'INPUT' &&
          (e.target as HTMLInputElement)?.type === 'search';
        if (isSearchInput) break;

        if (this._isOpen && this._highlighted) {
          e.preventDefault();
          this._selectOption(this._highlighted);
        } else if (!this._isOpen) {
          if (e.key === ' ') e.preventDefault();
          this.open();
        }
        break;
      }

      case 'Escape':
        if (this._isOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.close();
        }
        break;

      case 'Tab':
        if (this._isOpen) {
          this.close();
          // Allow default tab behavior
        }
        break;

      case 'Backspace':
        if (
          this.multiple &&
          this._searchText === '' &&
          Array.isArray(this.selected) &&
          this.selected.length > 0
        ) {
          e.preventDefault();
          const last = this.selected[this.selected.length - 1];
          this._removeTag(last, e);
        }
        break;

      default:
        // Type-ahead when dropdown is closed
        if (!this._isOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          this._handleTypeAhead(e.key);
        }
        break;
    }
  }

  private _onDropdownKeydown(e: KeyboardEvent) {
    // Delegate to trigger handler, then stop propagation so it doesn't
    // also fire on the parent trigger element (which would double-navigate).
    this._onTriggerKeydown(e);
    e.stopPropagation();
  }

  private _handleTypeAhead(char: string) {
    clearTimeout(this._typeAheadTimeout);
    this._typeAheadBuffer += char.toLowerCase();
    this._typeAheadTimeout = setTimeout(() => {
      this._typeAheadBuffer = '';
    }, 1000);

    const match = findOptionWithOffset(
      this.options,
      this._typeAheadBuffer,
      this.searchField,
      this.labelField,
      this.selected as T | undefined,
    );

    if (match) {
      const previous = this.selected;
      this.selected = match;
      const detail: PSelectChangeDetail<T> = {
        selected: this.selected,
        previous,
      };
      this.dispatchEvent(
        new CustomEvent('p-change', { bubbles: true, composed: true, detail }),
      );
    }
  }

  // ── Positioning ──

  private async _positionDropdown() {
    await this.updateComplete;
    const trigger = this._triggerEl;
    const dropdown = this._dropdownEl;
    if (!trigger || !dropdown) return;

    this._resizeObserver?.disconnect();

    const middleware = [flip(), shift()];

    if (this.matchTriggerWidth) {
      middleware.push(
        size({
          apply({ rects }) {
            Object.assign(dropdown.style, {
              width: `${rects.reference.width}px`,
            });
          },
        }),
      );
    }

    const position = async () => {
      const { x, y } = await computePosition(trigger, dropdown, {
        placement: 'bottom-start',
        middleware,
      });
      Object.assign(dropdown.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    };

    // Initial positioning
    await position();

    // Watch trigger for height changes (e.g., tags wrapping to new rows)
    this._resizeObserver = new ResizeObserver(() => {
      position();
    });
    this._resizeObserver.observe(trigger);
  }

  // ── Outside Click ──

  private _onOutsideClick = (e: MouseEvent) => {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.close();
    }
  };

  private _addOutsideClickListener() {
    document.addEventListener('mousedown', this._onOutsideClick, true);
  }

  private _removeOutsideClickListener() {
    document.removeEventListener('mousedown', this._onOutsideClick, true);
  }

  private _cleanup() {
    this._removeOutsideClickListener();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
    clearTimeout(this._typeAheadTimeout);
    clearTimeout(this._searchDebounceTimer);
    if (this._scrollRAF) {
      cancelAnimationFrame(this._scrollRAF);
      this._scrollRAF = undefined;
    }
  }

  // ── Event Handlers ──

  private _onTriggerClick() {
    if (this.disabled) return;
    // In multiple mode with search, don't toggle — just open
    if (this.multiple && this.searchEnabled && this._isOpen) return;
    this.toggle();
  }

  private _onTriggerFocus() {
    this.dispatchEvent(
      new CustomEvent('p-focus', { bubbles: true, composed: true }),
    );
  }

  private _onTriggerBlur() {
    this.dispatchEvent(
      new CustomEvent('p-blur', { bubbles: true, composed: true }),
    );
  }

  private _onOptionMouseup(option: T, e: MouseEvent) {
    e.preventDefault();
    this._selectOption(option);
  }

  private _onOptionMouseover(option: T) {
    if (this.highlightOnHover && !isOptionDisabled(option)) {
      this._highlighted = option;
    }
  }

  private _scrollRAF?: number;

  private _scrollToHighlighted() {
    if (!this._highlighted) return;
    if (this._scrollRAF) {
      cancelAnimationFrame(this._scrollRAF);
    }
    this._scrollRAF = requestAnimationFrame(() => {
      this._scrollRAF = undefined;
      this.updateComplete.then(() => {
        const idx = this._activeOptions.indexOf(this._highlighted!);
        const optionEl = this.shadowRoot?.querySelector(
          `[data-option-index="${idx}"]`,
        );
        optionEl?.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  // ── Rendering ──

  private _spinnerSvg(): TemplateResult {
    // Font Awesome spinner-third (Pro) approximation using open paths
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      width="1em"
      height="1em"
    >
      <path
        d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416m0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"
        opacity="0.25"
      />
      <path d="M256 0a256 256 0 0 1 256 256h-48A208 208 0 0 0 256 48z" />
    </svg>`;
  }

  private _renderTriggerContent(): TemplateResult | typeof nothing {
    if (this.multiple) {
      return this._renderMultipleTrigger();
    }
    return this._renderSingleTrigger();
  }

  private _renderSingleTrigger(): TemplateResult {
    const hasSelection = this.selected != null;
    const showClear = this.allowClear && hasSelection && !this.disabled;

    return html`
      ${hasSelection
        ? html`<span class="trigger__selected" part="selected-item">
            ${this.renderSelectedItem
              ? this.renderSelectedItem(this.selected as T)
              : this._getLabel(this.selected as T)}
          </span>`
        : html`<span class="trigger__placeholder" part="placeholder"
            >${this.placeholder}</span
          >`}
      ${showClear
        ? html`<button
            class="clear-btn"
            part="clear-btn"
            type="button"
            aria-label="Clear selection"
            @click=${this._clearSelection}
          >
            ×
          </button>`
        : nothing}
      ${this.loading
        ? html`<span class="loading-icon" part="loading-icon"
            >${this._spinnerSvg()}</span
          >`
        : html`<span class="status-icon" part="status-icon"></span>`}
    `;
  }

  private _renderMultipleTrigger(): TemplateResult {
    const selectedArr = Array.isArray(this.selected) ? this.selected : [];
    const hasSelection = selectedArr.length > 0;
    const showClear = this.allowClear && hasSelection && !this.disabled;

    return html`
      <div class="trigger__tags-area" part="tags-area">
        ${selectedArr.map(
          (item) => html`
            <span class="tag" part="tag">
              <span class="tag__label" part="tag-label">
                ${this.renderSelectedItem
                  ? this.renderSelectedItem(item)
                  : this._getLabel(item)}
              </span>
              <button
                class="tag__remove"
                part="tag-remove"
                type="button"
                aria-label="Remove ${this._getLabel(item)}"
                @click=${(e: Event) => this._removeTag(item, e)}
              >
                ×
              </button>
            </span>
          `,
        )}
        ${this.searchEnabled
          ? html`<input
              class="trigger__search-input"
              part="search-input"
              type="search"
              autocomplete="off"
              spellcheck="false"
              .value=${this._searchText}
              placeholder=${!hasSelection
                ? this.placeholder
                : this.searchPlaceholder}
              ?disabled=${this.disabled}
              @input=${this._onSearchInput}
              @keydown=${this._onDropdownKeydown}
              @focus=${() => {
                if (!this._isOpen) this.open();
              }}
            />`
          : !hasSelection
            ? html`<span class="trigger__placeholder" part="placeholder"
                >${this.placeholder}</span
              >`
            : nothing}
      </div>
      <div class="trigger__icons" part="icons">
        ${showClear
          ? html`<button
              class="clear-btn"
              part="clear-btn"
              type="button"
              aria-label="Clear all selections"
              @click=${this._clearSelection}
            >
              ×
            </button>`
          : nothing}
        ${this.loading
          ? html`<span class="loading-icon" part="loading-icon"
              >${this._spinnerSvg()}</span
            >`
          : html`<span class="status-icon" part="status-icon"></span>`}
      </div>
    `;
  }

  private _renderOption(option: T): TemplateResult | string {
    if (this.renderOption) {
      return this.renderOption(option);
    }
    return this._getLabel(option);
  }

  private _renderDropdownContent(): TemplateResult {
    // Async search mode: show searchMessage before first search
    if (this.search && !this._hasSearched && !this.loading) {
      return html`
        <ul class="options" part="options-list" role="listbox">
          <li
            class="option option--message"
            part="no-matches"
            role="option"
            aria-selected="false"
          >
            ${this.searchMessage}
          </li>
        </ul>
      `;
    }

    // Loading state
    if (this.loading) {
      return html`
        <ul class="options" part="options-list" role="listbox">
          <li
            class="option option--message"
            part="loading"
            role="option"
            aria-selected="false"
          >
            <slot name="loading">${this.loadingMessage}</slot>
          </li>
        </ul>
      `;
    }

    // No results
    if (this._activeOptions.length === 0) {
      return html`
        <ul class="options" part="options-list" role="listbox">
          <li
            class="option option--message"
            part="no-matches"
            role="option"
            aria-selected="false"
          >
            <slot name="no-matches">${this.noMatchesMessage}</slot>
          </li>
        </ul>
      `;
    }

    // Build a Set for O(1) selected lookups in multiple mode
    const selectedSet: Set<unknown> = new Set();
    if (Array.isArray(this.selected)) {
      for (const s of this.selected) {
        selectedSet.add(s instanceof Date ? s.getTime() : s);
      }
    }
    const isOptionSelected = (option: T): boolean => {
      if (selectedSet.size > 0) {
        const key =
          option instanceof Date ? (option as Date).getTime() : option;
        return selectedSet.has(key);
      }
      return isSelected(option, this.selected);
    };

    // Options list
    return html`
      <ul class="options" part="options-list" role="listbox" id="listbox">
        ${repeat(
          this._activeOptions,
          (option) => option,
          (option, index) => {
            const optDisabled = isOptionDisabled(option);
            const optSelected = isOptionSelected(option);
            const optHighlighted = option === this._highlighted;
            const classes = {
              option: true,
              'option--highlighted': optHighlighted,
              'option--selected': optSelected,
              'option--disabled': optDisabled,
            };
            return html`
              <li
                class=${classMap(classes)}
                part="option ${optHighlighted
                  ? 'option-highlighted'
                  : ''} ${optSelected ? 'option-selected' : ''} ${optDisabled
                  ? 'option-disabled'
                  : ''}"
                role="option"
                aria-selected=${optSelected}
                aria-current=${optHighlighted}
                aria-disabled=${optDisabled}
                data-option-index=${index}
                id="option-${index}"
                @mouseup=${(e: MouseEvent) => this._onOptionMouseup(option, e)}
                @mouseover=${() => this._onOptionMouseover(option)}
              >
                ${this._renderOption(option)}
              </li>
            `;
          },
        )}
      </ul>
    `;
  }

  override render() {
    const highlightedIndex = this._highlighted
      ? this._activeOptions.indexOf(this._highlighted)
      : -1;

    return html`
      <div
        class=${classMap({
          trigger: true,
          'trigger--active': this._isOpen,
          'trigger--multiple': this.multiple,
          [this.triggerClass]: !!this.triggerClass,
        })}
        part="trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded=${this._isOpen}
        aria-controls=${this._isOpen ? 'listbox' : nothing}
        aria-activedescendant=${highlightedIndex >= 0
          ? `option-${highlightedIndex}`
          : nothing}
        tabindex=${this.multiple && this.searchEnabled
          ? -1
          : this.triggerTabindex}
        @click=${this._onTriggerClick}
        @keydown=${this._onTriggerKeydown}
        @focus=${this._onTriggerFocus}
        @blur=${this._onTriggerBlur}
      >
        ${this._renderTriggerContent()}
      </div>

      <div
        class=${classMap({
          dropdown: true,
          [this.dropdownClass]: !!this.dropdownClass,
        })}
        part="dropdown"
        ?hidden=${!this._isOpen}
        @keydown=${this._onDropdownKeydown}
      >
        <slot name="before-options"></slot>
        ${this._isOpen && this.searchEnabled && !this.multiple
          ? html`
              <div class="search" part="search">
                <input
                  class="search-input"
                  part="search-input"
                  type="search"
                  autocomplete="off"
                  spellcheck="false"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-expanded=${this._isOpen}
                  aria-controls="listbox"
                  aria-activedescendant=${highlightedIndex >= 0
                    ? `option-${highlightedIndex}`
                    : nothing}
                  placeholder=${this.searchPlaceholder}
                  .value=${this._searchText}
                  @input=${this._onSearchInput}
                />
              </div>
            `
          : nothing}
        ${this._isOpen ? this._renderDropdownContent() : nothing}
        <slot name="after-options"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'p-select': PSelect;
  }
}
