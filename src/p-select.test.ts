import { describe, it, expect, vi, afterEach } from 'vitest';
import { html, render, type TemplateResult } from 'lit';
import './p-select.js';
import type { PSelect } from './p-select.js';

// ── Helpers ──

async function fixture(tpl: TemplateResult): Promise<PSelect> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(tpl, container);
  const el = container.querySelector('p-select') as PSelect;
  await el.updateComplete;
  return el;
}

function cleanup() {
  document.body.innerHTML = '';
}

function trigger(el: PSelect): HTMLElement {
  return el.shadowRoot!.querySelector('.trigger')!;
}

function dropdown(el: PSelect): HTMLElement {
  return el.shadowRoot!.querySelector('.dropdown')!;
}

function options(el: PSelect): HTMLElement[] {
  return [
    ...el.shadowRoot!.querySelectorAll<HTMLElement>(
      '.option:not(.option--message)',
    ),
  ];
}

function searchInput(el: PSelect): HTMLInputElement | null {
  return el.shadowRoot!.querySelector('.search-input');
}

function triggerSearchInput(el: PSelect): HTMLInputElement | null {
  return el.shadowRoot!.querySelector('.trigger__search-input');
}

function tags(el: PSelect): HTMLElement[] {
  return [...el.shadowRoot!.querySelectorAll<HTMLElement>('.tag')];
}

async function click(element: HTMLElement) {
  element.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, composed: true }),
  );
  element.dispatchEvent(
    new MouseEvent('mouseup', { bubbles: true, composed: true }),
  );
  element.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true }),
  );
  await new Promise((r) => setTimeout(r, 0));
}

async function type(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 0));
}

async function keydown(element: HTMLElement, key: string) {
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, composed: true }),
  );
  await new Promise((r) => setTimeout(r, 0));
}

// ── Test Data ──

const STRING_OPTIONS = ['Alpha', 'Beta', 'Gamma', 'Delta'];

const OBJECT_OPTIONS = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
  { id: 3, name: 'Charlie', role: 'Moderator' },
  { id: 4, name: 'Diana', role: 'User', disabled: true },
];

// ── Tests ──

describe('PSelect', () => {
  afterEach(cleanup);

  // ── Rendering ──

  describe('rendering', () => {
    it('renders with string options', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} .selected=${'Beta'}></p-select>
      `);
      expect(trigger(el).textContent).toContain('Beta');
    });

    it('renders with object options and labelField', async () => {
      const el = await fixture(html`
        <p-select
          .options=${OBJECT_OPTIONS}
          .selected=${OBJECT_OPTIONS[0]}
          label-field="name"
        ></p-select>
      `);
      expect(trigger(el).textContent).toContain('Alice');
    });

    it('shows placeholder when nothing is selected', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} placeholder="Pick one"></p-select>
      `);
      expect(trigger(el).textContent).toContain('Pick one');
    });
  });

  // ── Open / Close ──

  describe('open/close', () => {
    it('opens on trigger click', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      expect(dropdown(el).hidden).toBe(true);
      await click(trigger(el));
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(false);
    });

    it('closes on second trigger click', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      await click(trigger(el));
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(true);
    });

    it('dispatches p-open and p-close events', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      const openSpy = vi.fn();
      const closeSpy = vi.fn();
      el.addEventListener('p-open', openSpy);
      el.addEventListener('p-close', closeSpy);

      await click(trigger(el));
      await el.updateComplete;
      expect(openSpy).toHaveBeenCalledTimes(1);

      await keydown(trigger(el), 'Escape');
      await el.updateComplete;
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('does not open when disabled', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} disabled></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(true);
    });
  });

  // ── Single Select ──

  describe('single select', () => {
    it('selects an option on click', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} @p-change=${changeSpy}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      expect(opts.length).toBe(4);

      await click(opts[2]); // "Gamma"
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      const detail = changeSpy.mock.calls[0][0].detail;
      expect(detail.selected).toBe('Gamma');
      expect(detail.previous).toBeUndefined();
    });

    it('closes after selection by default', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      await click(options(el)[0]);
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(true);
    });

    it('shows selected value in trigger', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} .selected=${'Gamma'}></p-select>
      `);
      expect(trigger(el).textContent).toContain('Gamma');
    });

    it('does not select disabled options', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${OBJECT_OPTIONS}
          label-field="name"
          @p-change=${changeSpy}
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      const diana = opts[3]; // disabled
      expect(diana.classList.contains('option--disabled')).toBe(true);

      await click(diana);
      await el.updateComplete;
      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  // ── Allow Clear ──

  describe('allow clear', () => {
    it('shows clear button when allow-clear and has selection', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${'Beta'}
          allow-clear
        ></p-select>
      `);
      const btn = el.shadowRoot!.querySelector('.clear-btn');
      expect(btn).not.toBeNull();
    });

    it('clears selection on clear button click', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${'Beta'}
          allow-clear
          @p-change=${changeSpy}
        ></p-select>
      `);
      const btn = el.shadowRoot!.querySelector<HTMLElement>('.clear-btn')!;
      await click(btn);
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail.selected).toBeUndefined();
    });

    it('does not show clear button when nothing selected', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} allow-clear></p-select>
      `);
      const btn = el.shadowRoot!.querySelector('.clear-btn');
      expect(btn).toBeNull();
    });
  });

  // ── Search ──

  describe('search', () => {
    it('filters options by search text', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          search-enabled
          search-debounce="0"
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const input = searchInput(el)!;
      expect(input).not.toBeNull();

      await type(input, 'al');
      await el.updateComplete;

      const opts = options(el);
      expect(opts.length).toBe(1);
      expect(opts[0].textContent).toContain('Alpha');
    });

    it('filters object options by searchField', async () => {
      const el = await fixture(html`
        <p-select
          .options=${OBJECT_OPTIONS}
          label-field="name"
          search-field="role"
          search-enabled
          search-debounce="0"
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await type(searchInput(el)!, 'admin');
      await el.updateComplete;

      const opts = options(el);
      expect(opts.length).toBe(1);
      expect(opts[0].textContent).toContain('Alice');
    });

    it('shows no matches message when filter returns empty', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          search-enabled
          search-debounce="0"
          no-matches-message="Nothing here"
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      await type(searchInput(el)!, 'zzzzz');
      await el.updateComplete;

      const msg = el.shadowRoot!.querySelector('.option--message');
      expect(msg?.textContent).toContain('Nothing here');
    });

    it('is diacritics-insensitive', async () => {
      const accented = ['Café', 'Naïve', 'Résumé'];
      const el = await fixture(html`
        <p-select
          .options=${accented}
          search-enabled
          search-debounce="0"
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      await type(searchInput(el)!, 'cafe');
      await el.updateComplete;

      const opts = options(el);
      expect(opts.length).toBe(1);
      expect(opts[0].textContent).toContain('Café');
    });

    it('dispatches p-search event', async () => {
      const searchSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          search-enabled
          search-debounce="0"
          @p-search=${searchSpy}
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      await type(searchInput(el)!, 'ga');
      await el.updateComplete;

      expect(searchSpy).toHaveBeenCalledTimes(1);
      const detail = searchSpy.mock.calls[0][0].detail;
      expect(detail.term).toBe('ga');
      expect(detail.results.length).toBe(1);
    });
  });

  // ── Async Search ──

  describe('async search', () => {
    it('calls search function and displays results', async () => {
      const searchFn = vi.fn().mockResolvedValue(['Result A', 'Result B']);
      const el = await fixture(html`
        <p-select .options=${[]} .search=${searchFn} search-enabled></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      // Should show searchMessage before typing
      const msg = el.shadowRoot!.querySelector('.option--message');
      expect(msg?.textContent).toContain('Type to search');

      await type(searchInput(el)!, 'test');
      // Wait for async
      await new Promise((r) => setTimeout(r, 10));
      await el.updateComplete;

      expect(searchFn).toHaveBeenCalledWith('test');
      const opts = options(el);
      expect(opts.length).toBe(2);
    });

    it('shows loading message while searching', async () => {
      let resolveSearch: (value: string[]) => void;
      const searchFn = vi.fn().mockImplementation(
        () =>
          new Promise<string[]>((r) => {
            resolveSearch = r;
          }),
      );
      const el = await fixture(html`
        <p-select
          .options=${[]}
          .search=${searchFn}
          search-enabled
          loading-message="Searching..."
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await type(searchInput(el)!, 'test');
      await el.updateComplete;

      // Should show loading
      const msg = el.shadowRoot!.querySelector('.option--message');
      expect(msg?.textContent).toContain('Searching...');

      resolveSearch!(['Found']);
      await new Promise((r) => setTimeout(r, 10));
      await el.updateComplete;

      const opts = options(el);
      expect(opts.length).toBe(1);
    });

    it('cancels stale searches', async () => {
      let callCount = 0;
      const searchFn = vi.fn().mockImplementation((term: string) => {
        callCount++;
        const myCall = callCount;
        return new Promise<string[]>((resolve) => {
          setTimeout(
            () => {
              resolve([`Result for ${term} (call ${myCall})`]);
            },
            myCall === 1 ? 50 : 10,
          ); // First call slower
        });
      });

      const el = await fixture(html`
        <p-select .options=${[]} .search=${searchFn} search-enabled></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await type(searchInput(el)!, 'first');
      await type(searchInput(el)!, 'second');

      // Wait for both to resolve
      await new Promise((r) => setTimeout(r, 100));
      await el.updateComplete;

      // Should only show results from the latest search
      const opts = options(el);
      expect(opts.length).toBe(1);
      expect(opts[0].textContent).toContain('second');
    });
  });

  // ── Multiple Select ──

  describe('multiple select', () => {
    it('renders selected items as tags', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${['Alpha', 'Gamma']}
          multiple
        ></p-select>
      `);
      const t = tags(el);
      expect(t.length).toBe(2);
      expect(t[0].textContent).toContain('Alpha');
      expect(t[1].textContent).toContain('Gamma');
    });

    it('adds items to selection on click', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${['Alpha']}
          multiple
          @p-change=${changeSpy}
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await click(options(el)[1]); // Beta
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      const detail = changeSpy.mock.calls[0][0].detail;
      expect(detail.selected).toEqual(['Alpha', 'Beta']);
    });

    it('does not close after selection by default in multiple mode', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${[]}
          multiple
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      await click(options(el)[0]);
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(false);
    });

    it('removes item via tag remove button', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${['Alpha', 'Beta']}
          multiple
          @p-change=${changeSpy}
        ></p-select>
      `);
      const removeBtn =
        el.shadowRoot!.querySelector<HTMLElement>('.tag__remove')!;
      await click(removeBtn);
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail.selected).toEqual(['Beta']);
    });

    it('allows typing spaces in the search input', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${[]}
          multiple
          search-enabled
        ></p-select>
      `);
      const input = triggerSearchInput(el)!;
      input.focus();
      await el.updateComplete;

      // Simulate typing "hello world" — the space should NOT trigger selection
      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      // Press space — should be allowed through (not intercepted)
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        composed: true,
        cancelable: true,
      });
      input.dispatchEvent(spaceEvent);
      expect(spaceEvent.defaultPrevented).toBe(false);
    });

    it('shows search input in trigger for multiple mode', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${[]}
          multiple
          search-enabled
        ></p-select>
      `);
      const input = triggerSearchInput(el);
      expect(input).not.toBeNull();
    });
  });

  // ── Keyboard Navigation ──

  describe('keyboard navigation', () => {
    it('opens on ArrowDown and highlights first option', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;

      expect(dropdown(el).hidden).toBe(false);
      const highlighted = el.shadowRoot!.querySelector('.option--highlighted');
      expect(highlighted?.textContent).toContain('Alpha');
    });

    it('navigates options with arrow keys', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;

      const highlighted = el.shadowRoot!.querySelector('.option--highlighted');
      // Should be on Gamma (Alpha->Beta->Gamma) since it starts on Alpha then moves 2
      expect(highlighted?.textContent).toContain('Gamma');
    });

    it('selects highlighted option with Enter', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} @p-change=${changeSpy}></p-select>
      `);
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;
      await keydown(trigger(el), 'Enter');
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail.selected).toBe('Beta');
    });

    it('closes on Escape', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(false);

      await keydown(trigger(el), 'Escape');
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(true);
    });

    it('skips disabled options during navigation', async () => {
      const el = await fixture(html`
        <p-select .options=${OBJECT_OPTIONS} label-field="name"></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      // Navigate: Alice -> Bob -> Charlie -> (skip Diana) -> Alice
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;

      const highlighted = el.shadowRoot!.querySelector('.option--highlighted');
      // Should skip Diana (disabled) and wrap to Alice
      expect(highlighted?.textContent).toContain('Alice');
    });

    it('navigates to first/last with Home/End', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await keydown(trigger(el), 'End');
      await el.updateComplete;
      let highlighted = el.shadowRoot!.querySelector('.option--highlighted');
      expect(highlighted?.textContent).toContain('Delta');

      await keydown(trigger(el), 'Home');
      await el.updateComplete;
      highlighted = el.shadowRoot!.querySelector('.option--highlighted');
      expect(highlighted?.textContent).toContain('Alpha');
    });
  });

  // ── ARIA ──

  describe('accessibility', () => {
    it('has correct ARIA attributes on trigger', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      const trig = trigger(el);
      expect(trig.getAttribute('role')).toBe('combobox');
      expect(trig.getAttribute('aria-haspopup')).toBe('listbox');
      expect(trig.getAttribute('aria-expanded')).toBe('false');
    });

    it('updates aria-expanded when opened', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    });

    it('options have correct roles and aria-selected', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} .selected=${'Beta'}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      expect(opts[0].getAttribute('role')).toBe('option');
      expect(opts[0].getAttribute('aria-selected')).toBe('false');
      expect(opts[1].getAttribute('aria-selected')).toBe('true');
    });

    it('disabled options have aria-disabled', async () => {
      const el = await fixture(html`
        <p-select .options=${OBJECT_OPTIONS} label-field="name"></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      expect(opts[3].getAttribute('aria-disabled')).toBe('true');
    });

    it('listbox has correct role', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const listbox = el.shadowRoot!.querySelector('[role="listbox"]');
      expect(listbox).not.toBeNull();
    });
  });

  // ── Custom Rendering ──

  describe('custom rendering', () => {
    it('uses renderOption callback for option display', async () => {
      const renderer = (opt: (typeof OBJECT_OPTIONS)[0]) =>
        html`<strong>${opt.name}</strong> (${opt.role})`;

      const el = await fixture(html`
        <p-select
          .options=${OBJECT_OPTIONS}
          label-field="name"
          .renderOption=${renderer}
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      const strong = opts[0].querySelector('strong');
      expect(strong?.textContent).toBe('Alice');
      expect(opts[0].textContent).toContain('(Admin)');
    });

    it('uses renderSelectedItem callback in trigger', async () => {
      const renderer = (opt: (typeof OBJECT_OPTIONS)[0]) =>
        html`<em>${opt.name} - ${opt.role}</em>`;

      const el = await fixture(html`
        <p-select
          .options=${OBJECT_OPTIONS}
          .selected=${OBJECT_OPTIONS[0]}
          label-field="name"
          .renderSelectedItem=${renderer}
        ></p-select>
      `);
      const em = trigger(el).querySelector('em');
      expect(em?.textContent).toBe('Alice - Admin');
    });
  });

  // ── Type-Ahead ──

  describe('type-ahead', () => {
    it('selects matching option when typing while closed', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} @p-change=${changeSpy}></p-select>
      `);

      await keydown(trigger(el), 'g');
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail.selected).toBe('Gamma');
    });

    it('accumulates characters for multi-char type-ahead', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${['Delta', 'Dog', 'Donkey']}
          @p-change=${changeSpy}
        ></p-select>
      `);

      await keydown(trigger(el), 'd');
      await keydown(trigger(el), 'o');
      await el.updateComplete;

      const lastCall = changeSpy.mock.calls[changeSpy.mock.calls.length - 1];
      expect(lastCall[0].detail.selected).toBe('Dog');
    });

    it('does not type-ahead when dropdown is open', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} @p-change=${changeSpy}></p-select>
      `);

      await click(trigger(el));
      await el.updateComplete;

      await keydown(trigger(el), 'g');
      await el.updateComplete;

      expect(changeSpy).not.toHaveBeenCalled();
    });

    it('ignores Ctrl/Meta key combos', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} @p-change=${changeSpy}></p-select>
      `);

      trigger(el).dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'a',
          ctrlKey: true,
          bubbles: true,
          composed: true,
        }),
      );
      await el.updateComplete;

      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  // ── Additional Keyboard Navigation ──

  describe('additional keyboard navigation', () => {
    it('opens on ArrowUp', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await keydown(trigger(el), 'ArrowUp');
      await el.updateComplete;

      expect(dropdown(el).hidden).toBe(false);
    });

    it('navigates backward with ArrowUp', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      // Start at Alpha, go down to Beta, then back up to Alpha
      await keydown(trigger(el), 'ArrowDown');
      await el.updateComplete;
      await keydown(trigger(el), 'ArrowUp');
      await el.updateComplete;

      const highlighted = el.shadowRoot!.querySelector('.option--highlighted');
      expect(highlighted?.textContent).toContain('Alpha');
    });

    it('closes on Tab when open', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(false);

      await keydown(trigger(el), 'Tab');
      await el.updateComplete;
      expect(dropdown(el).hidden).toBe(true);
    });

    it('opens with Space key when closed', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS}></p-select>
      `);

      await keydown(trigger(el), ' ');
      await el.updateComplete;

      expect(dropdown(el).hidden).toBe(false);
    });

    it('removes last tag with Backspace in multiple mode', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${['Alpha', 'Beta']}
          multiple
          search-enabled
          @p-change=${changeSpy}
        ></p-select>
      `);

      const input = triggerSearchInput(el)!;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await el.updateComplete;

      await keydown(input, 'Backspace');
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail.selected).toEqual(['Alpha']);
    });

    it('does not remove tag with Backspace when search text exists', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${['Alpha', 'Beta']}
          multiple
          search-enabled
          search-debounce="0"
          @p-change=${changeSpy}
        ></p-select>
      `);

      const input = triggerSearchInput(el)!;
      await type(input, 'something');
      await el.updateComplete;

      await keydown(input, 'Backspace');
      await el.updateComplete;

      expect(changeSpy).not.toHaveBeenCalled();
    });
  });

  // ── Deselection in Multiple Mode ──

  describe('deselection in multiple mode', () => {
    it('deselects an already-selected option on click', async () => {
      const changeSpy = vi.fn();
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          .selected=${['Alpha', 'Beta']}
          multiple
          @p-change=${changeSpy}
        ></p-select>
      `);

      await click(trigger(el));
      await el.updateComplete;

      // Click 'Alpha' which is already selected to deselect it
      const opts = options(el);
      const alphaOpt = opts.find((o) => o.textContent?.includes('Alpha'))!;
      alphaOpt.dispatchEvent(
        new MouseEvent('mouseup', { bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].detail.selected).toEqual(['Beta']);
    });
  });

  // ── Async Search Error Handling ──

  describe('async search error handling', () => {
    it('recovers from a rejected search promise', async () => {
      const searchFn = vi.fn().mockRejectedValue(new Error('Network error'));
      const el = await fixture(html`
        <p-select .options=${[]} .search=${searchFn} search-enabled></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await type(searchInput(el)!, 'test');
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;

      expect(el.loading).toBe(false);
      const opts = options(el);
      expect(opts.length).toBe(0);
    });
  });

  // ── Hover Highlighting ──

  describe('hover highlighting', () => {
    it('highlights option on mouseover when highlightOnHover is true', async () => {
      const el = await fixture(html`
        <p-select .options=${STRING_OPTIONS} highlight-on-hover></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      opts[2].dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(opts[2].classList.contains('option--highlighted')).toBe(true);
    });

    it('does not highlight disabled option on hover', async () => {
      const el = await fixture(html`
        <p-select
          .options=${OBJECT_OPTIONS}
          label-field="name"
          highlight-on-hover
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      const opts = options(el);
      // Diana (index 3) is disabled
      opts[3].dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(opts[3].classList.contains('option--highlighted')).toBe(false);
    });
  });

  // ── Options Update with Active Search ──

  describe('options update with active search', () => {
    it('re-filters when options change while search text exists', async () => {
      const el = await fixture(html`
        <p-select
          .options=${STRING_OPTIONS}
          search-enabled
          search-debounce="0"
        ></p-select>
      `);
      await click(trigger(el));
      await el.updateComplete;

      await type(searchInput(el)!, 'al');
      await el.updateComplete;
      expect(options(el).length).toBe(1);

      // Update options with new data that also matches
      el.options = ['Alpha', 'Alkaline', 'Beta', 'Gamma'];
      await el.updateComplete;
      // Need an extra tick for the debounced re-filter to apply
      await new Promise((r) => setTimeout(r, 10));
      await el.updateComplete;

      const opts = options(el);
      expect(opts.length).toBe(2);
      expect(opts[0].textContent).toContain('Alpha');
      expect(opts[1].textContent).toContain('Alkaline');
    });
  });
});
