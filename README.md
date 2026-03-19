# p-select

A select web component built with [Lit](https://lit.dev). The `p-select` web component is inspired by the excellent   [ember-power-select](https://github.com/cibernox/ember-power-select) component written for the [Ember.js](https://emberjs.com/) web application framework.

## Installation

```bash
npm install p-select
```

```js
import 'p-select';
```

## Quick Start

```html
<p-select
  id="my-select"
  label-field="name"
  placeholder="Choose a user"
  search-enabled
></p-select>

<script type="module">
  import 'p-select';

  const el = document.querySelector('#my-select');
  el.options = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];
  el.addEventListener('p-change', (e) => {
    console.log('Selected:', e.detail.selected);
  });
</script>
```

## API Reference

### Properties

All properties can be set via JavaScript. Properties marked with an **Attribute** can also be set as HTML attributes.

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `options` | — | `T[]` | `[]` | Array of options. Supports strings or objects. Set via JS only. |
| `selected` | — | `T \| T[] \| undefined` | `undefined` | Current selection. Single value or array (when `multiple`). Set via JS only. |
| `multiple` | `multiple` | `boolean` | `false` | Enable multi-select mode. Selected items render as removable tags. |
| `placeholder` | `placeholder` | `string` | `''` | Placeholder text shown when nothing is selected. |
| `disabled` | `disabled` | `boolean` | `false` | Disable the entire component. |
| `searchEnabled` | `search-enabled` | `boolean` | `true` | Show a search input to filter options. |
| `searchField` | `search-field` | `string` | `undefined` | Object property to search against (e.g., `"name"`). Falls back to `labelField`. |
| `labelField` | `label-field` | `string` | `undefined` | Object property to display as the option label. **Required for object options.** |
| `allowClear` | `allow-clear` | `boolean` | `false` | Show a × button to clear the selection. |
| `closeOnSelect` | `close-on-select` | `boolean` | `true` (single) / `false` (multiple) | Whether to close the dropdown after selecting an option. |
| `searchPlaceholder` | `search-placeholder` | `string` | `''` | Placeholder for the search input. |
| `noMatchesMessage` | `no-matches-message` | `string` | `'No results found'` | Message when filtering produces no matches. |
| `searchMessage` | `search-message` | `string` | `'Type to search'` | Message shown before async search is triggered. |
| `loadingMessage` | `loading-message` | `string` | `'Loading...'` | Message shown while async search is in progress. |
| `highlightOnHover` | `highlight-on-hover` | `boolean` | `true` | Highlight options on mouse hover. |
| `matchTriggerWidth` | `match-trigger-width` | `boolean` | `true` | Dropdown width matches the trigger width. |
| `triggerClass` | `trigger-class` | `string` | `''` | CSS class added to the trigger element. |
| `dropdownClass` | `dropdown-class` | `string` | `''` | CSS class added to the dropdown element. |
| `search` | — | `(term: string) => Promise<T[]>` | `undefined` | Async search function. When set, options are fetched from this function instead of filtering locally. Set via JS only. |
| `matcher` | — | `(option: T, term: string) => number` | built-in | Custom match function. Return >= 0 for match, -1 for no match. Set via JS only. |
| `renderOption` | — | `(option: T) => TemplateResult \| string` | `undefined` | Custom render function for each option in the dropdown. Set via JS only. |
| `renderSelectedItem` | — | `(option: T) => TemplateResult \| string` | `undefined` | Custom render function for the selected item in the trigger. Set via JS only. |

### Events

| Event | Detail Type | Description |
|-------|-------------|-------------|
| `p-change` | `{ selected: T \| T[] \| undefined, previous: T \| T[] \| undefined }` | Fired when the selection changes. |
| `p-open` | `{}` | Fired when the dropdown opens. Use for lazy-loading options. |
| `p-close` | `{}` | Fired when the dropdown closes. |
| `p-search` | `{ term: string, results: T[] }` | Fired after a search/filter completes. |
| `p-focus` | `{}` | Fired when the component gains focus. |
| `p-blur` | `{}` | Fired when the component loses focus. |

### Methods

| Method | Description |
|--------|-------------|
| `open()` | Programmatically open the dropdown. |
| `close()` | Programmatically close the dropdown. |
| `toggle()` | Toggle the dropdown open/closed. |

### CSS Custom Properties

```css
p-select {
  /* Colors */
  --p-select-background: #ffffff;
  --p-select-text-color: inherit;
  --p-select-border-color: #aaaaaa;
  --p-select-placeholder-color: #999999;
  --p-select-highlight-bg: #5897fb;
  --p-select-highlight-color: #ffffff;
  --p-select-selected-bg: #dddddd;
  --p-select-disabled-bg: #eeeeee;
  --p-select-disabled-color: #999999;
  --p-select-tag-bg: #e4e4e4;
  --p-select-tag-color: #333333;

  /* Sizing & Spacing */
  --p-select-line-height: 1.75em;
  --p-select-border-radius: 4px;
  --p-select-option-padding: 4px 8px;
  --p-select-trigger-padding: 0 16px 0 8px;
  --p-select-visible-options: 7;
  --p-select-dropdown-z-index: 1000;

  /* Borders */
  --p-select-trigger-border: 1px solid var(--p-select-border-color);
  --p-select-dropdown-border: 1px solid var(--p-select-border-color);
  --p-select-search-field-border: 1px solid var(--p-select-border-color);
  --p-select-tag-border: 1px solid #ccc;

  /* Effects */
  --p-select-focus-border-color: var(--p-select-border-color);
  --p-select-focus-box-shadow: 0 0 0 2px rgba(88, 151, 251, 0.3);
  --p-select-dropdown-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --p-select-dropdown-margin: 2px 0 0;
}
```

### CSS Parts

Style internal elements from outside the shadow DOM using `::part()`:

```css
p-select::part(trigger) { }
p-select::part(dropdown) { }
p-select::part(search-input) { }
p-select::part(options-list) { }
p-select::part(option) { }
p-select::part(option-highlighted) { }
p-select::part(option-selected) { }
p-select::part(option-disabled) { }
p-select::part(clear-btn) { }
p-select::part(status-icon) { }
p-select::part(placeholder) { }
p-select::part(selected-item) { }
p-select::part(tag) { }
p-select::part(tag-label) { }
p-select::part(tag-remove) { }
p-select::part(no-matches) { }
p-select::part(loading) { }
p-select::part(search) { }
```

### Slots

| Slot Name | Description |
|-----------|-------------|
| `before-options` | Content rendered before the options list inside the dropdown. |
| `after-options` | Content rendered after the options list inside the dropdown. |
| `no-matches` | Custom content for the "no matches" state (overrides `noMatchesMessage`). |
| `loading` | Custom content for the loading state (overrides `loadingMessage`). |

## Usage Patterns

### Basic String Options

```html
<p-select id="severity" placeholder="Select severity"></p-select>
<script>
  const el = document.querySelector('#severity');
  el.options = ['Low', 'Medium', 'High', 'Critical'];
  el.addEventListener('p-change', (e) => {
    console.log(e.detail.selected); // "High"
  });
</script>
```

### Object Options with Label Field

```html
<p-select
  id="users"
  label-field="name"
  search-field="name"
  placeholder="Select user"
  search-enabled
></p-select>
<script>
  const el = document.querySelector('#users');
  el.options = [
    { id: 1, name: 'Alice', login: 'alice01' },
    { id: 2, name: 'Bob', login: 'bob42' },
    { id: 3, name: 'Charlie', login: 'charlie7' },
  ];
  el.addEventListener('p-change', (e) => {
    console.log(e.detail.selected); // { id: 2, name: 'Bob', login: 'bob42' }
  });
</script>
```

### Custom Option Rendering

Use `renderOption` to customize how each option is displayed in the dropdown.
Use `renderSelectedItem` to customize how the selected value appears in the trigger.

```js
import { html } from 'lit';

const el = document.querySelector('#tags');
el.options = [
  { name: 'malware', colour: '#ff0000', isNew: false },
  { name: 'phishing', colour: '#ff8800', isNew: true },
];
el.labelField = 'name';
el.renderOption = (tag) => html`
  <span style="color: ${tag.colour}">
    ${tag.name}
    ${tag.isNew ? html`<em>(new)</em>` : ''}
  </span>
`;
```

### Multiple Selection

```html
<p-select
  id="multi"
  multiple
  label-field="name"
  placeholder="Add tags"
  search-enabled
></p-select>
<script>
  const el = document.querySelector('#multi');
  el.options = [
    { name: 'Tag A' }, { name: 'Tag B' }, { name: 'Tag C' }
  ];
  el.selected = []; // start empty
  el.addEventListener('p-change', (e) => {
    console.log(e.detail.selected); // [{ name: 'Tag A' }, { name: 'Tag C' }]
  });
</script>
```

### Async Search (Lazy Loading)

The most common Polarity pattern: load options from an API on open and on search.

```html
<p-select
  id="async"
  label-field="name"
  search-field="name"
  search-enabled
  placeholder="Search indicators..."
  search-message="Loading Indicators..."
  loading-message="Searching..."
  search-placeholder="Type to search"
></p-select>
<script>
  const el = document.querySelector('#async');

  // Async search function — called on every keystroke
  el.search = async (term) => {
    const res = await fetch(`/api/indicators?q=${encodeURIComponent(term)}`);
    return res.json();
  };

  // Load initial options when dropdown opens
  el.addEventListener('p-open', () => {
    el.search('');
  });

  el.addEventListener('p-change', (e) => {
    console.log('Selected indicator:', e.detail.selected);
  });
</script>
```

### Loading State (Without Search)

When options are fetched on open without using the `search` callback, use the `loading` attribute to show a loading indicator while data is being fetched.

```html
<p-select
  id="lazy-load"
  label-field="name"
  placeholder="Select an option..."
  loading-message="Fetching options..."
></p-select>
<script>
  const el = document.querySelector('#lazy-load');

  el.addEventListener('p-open', async () => {
    el.loading = true;
    const res = await fetch('/api/options');
    el.options = await res.json();
    el.loading = false;
  });

  el.addEventListener('p-change', (e) => {
    console.log('Selected:', e.detail.selected);
  });
</script>
```

You can also use the `loading` slot for a custom spinner:

```html
<p-select id="lazy-load" label-field="name" placeholder="Select...">
  <span slot="loading">
    <my-spinner></my-spinner> Loading options...
  </span>
</p-select>
```

### Disabled Options

Options with `disabled: true` cannot be selected and are skipped during keyboard navigation.

```js
el.options = [
  { name: 'Active', disabled: false },
  { name: 'Archived', disabled: true },
  { name: 'Draft', disabled: false },
];
```

### Disabled Component

```html
<p-select disabled placeholder="Not available"></p-select>
```

### Allow Clear

```html
<p-select allow-clear placeholder="Optional field"></p-select>
```

### Styling with CSS Custom Properties

```html
<style>
  .dark-select {
    --p-select-background: #1e1e1e;
    --p-select-text-color: #eee;
    --p-select-border-color: #555;
    --p-select-highlight-bg: #0078d4;
    --p-select-placeholder-color: #888;
    --p-select-dropdown-box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
</style>
<p-select class="dark-select" placeholder="Dark theme"></p-select>
```

### Styling with CSS Parts

```css
p-select::part(trigger) {
  border: 2px solid #0078d4;
  border-radius: 8px;
}

p-select::part(option-highlighted) {
  background: #0078d4;
  font-weight: bold;
}

p-select::part(tag) {
  background: #0078d4;
  color: white;
  border-radius: 12px;
}
```

### Keyboard Navigation

The component supports full keyboard interaction:

| Key | Action |
|-----|--------|
| `↓` / `↑` | Navigate options (opens dropdown if closed) |
| `Enter` / `Space` | Select highlighted option (opens dropdown if closed) |
| `Escape` | Close dropdown |
| `Tab` | Close dropdown, move focus to next element |
| `Home` / `End` | Jump to first / last option |
| `Backspace` | (Multiple mode) Remove last selected tag when search is empty |
| Any letter | (When closed) Type-ahead — cycles through matching options |

### Accessibility

The component follows the [WAI-ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/):

- Trigger: `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-activedescendant`
- Options list: `role="listbox"`
- Each option: `role="option"`, `aria-selected`, `aria-current`, `aria-disabled`

## Development

```bash
npm install
npm run dev       # Start dev server with live examples
npm run build     # Build for production
npm run test      # Run tests (40 tests)
npm run lint      # Lint source files
npm run format    # Format with Prettier
```

## License

[MIT](LICENSE)
