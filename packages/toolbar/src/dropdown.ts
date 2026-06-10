/**
 * A small custom listbox dropdown for one axis.
 *
 * We use a custom popover rather than a native `<select>` because each choice
 * may carry a secondary "also sets …" hint (for sparse, auto-routed
 * combinations) that a native option can't render. The cost is re-implementing
 * the keyboard/focus/ARIA behaviour a `<select>` gives for free — done here
 * with the `aria-activedescendant` pattern: the listbox holds DOM focus while
 * an `aria-activedescendant` pointer tracks the highlighted option.
 */

export interface DropdownChoice {
  /** The axis choice name (stable id). */
  value: string;
  /** Short human label shown as the option's primary text. */
  label: string;
  /** Secondary line, e.g. "also sets Theme → Calm". */
  hint?: string;
  /** Longer description, surfaced as a tooltip. */
  title?: string;
  /** Destination URL. Undefined → the choice is unreachable (disabled). */
  href?: string;
  /** Whether this is the current selection. */
  selected: boolean;
}

export interface AxisControlOptions {
  /** Axis name; written to `data-axis` so the post-route highlight can find it. */
  axisName: string;
  axisLabel: string;
  axisTitle?: string;
  /** True when the current page sits on this axis (drives the accent underline). */
  active: boolean;
  /** Current choice's label, or null when the page sits off this axis. */
  valueLabel: string | null;
  choices: DropdownChoice[];
  /** Called when the user commits a selectable, non-current choice. */
  onSelect: (choice: DropdownChoice) => void;
}

let uid = 0;
/** Only one dropdown is open at a time; opening one closes the other. */
let openController: { close: () => void } | null = null;

const CHEVRON_SVG = `<svg class="chevron" viewBox="0 0 12 12" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M2.5 4.5 L6 8 L9.5 4.5"/></svg>`;
const CHECK_SVG = `<svg class="check" viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3.5 8.5 L6.5 11.5 L12.5 4.5"/></svg>`;

export function renderAxisControl(opts: AxisControlOptions): HTMLElement {
  const id = ++uid;
  const menuId = `dd-menu-${id}`;

  const group = document.createElement('div');
  group.className = 'group';
  group.dataset.axis = opts.axisName;
  if (opts.active) group.dataset.active = 'true';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);
  if (opts.axisTitle) trigger.title = opts.axisTitle;

  const labelEl = document.createElement('span');
  labelEl.className = 'trigger-label';
  labelEl.textContent = opts.axisLabel;

  const valueEl = document.createElement('span');
  valueEl.className = 'trigger-value';
  if (opts.valueLabel === null) {
    valueEl.classList.add('is-empty');
    valueEl.textContent = '—';
  } else {
    valueEl.textContent = opts.valueLabel;
  }
  valueEl.insertAdjacentHTML('beforeend', CHEVRON_SVG);

  trigger.append(labelEl, valueEl);

  const menu = document.createElement('ul');
  menu.className = 'menu';
  menu.id = menuId;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', opts.axisLabel);
  menu.setAttribute('tabindex', '-1');
  menu.hidden = true;

  // Index of options eligible for keyboard navigation (selectable ones).
  const optionEls: HTMLLIElement[] = [];
  const selectableIndexes: number[] = [];

  opts.choices.forEach((choice, index) => {
    const option = document.createElement('li');
    option.className = 'option';
    option.id = `${menuId}-opt-${index}`;
    option.setAttribute('role', 'option');
    option.dataset.value = choice.value;
    option.setAttribute('aria-selected', choice.selected ? 'true' : 'false');

    const disabled = choice.href === undefined && !choice.selected;
    if (disabled) option.setAttribute('aria-disabled', 'true');
    if (choice.title) option.title = choice.title;

    const main = document.createElement('span');
    main.className = 'option-main';
    main.insertAdjacentHTML('beforeend', CHECK_SVG);
    const text = document.createElement('span');
    text.className = 'option-label';
    text.textContent = choice.label;
    main.appendChild(text);
    option.appendChild(main);

    if (choice.hint) {
      const hint = document.createElement('span');
      hint.className = 'option-hint';
      hint.textContent = choice.hint;
      option.appendChild(hint);
    }

    if (!disabled) {
      selectableIndexes.push(index);
      option.addEventListener('click', () => commit(index));
    }

    optionEls.push(option);
    menu.appendChild(option);
  });

  group.append(trigger, menu);

  let activeIndex = -1;

  function setActive(index: number): void {
    if (activeIndex >= 0) optionEls[activeIndex]?.classList.remove('active-option');
    activeIndex = index;
    if (index >= 0) {
      const el = optionEls[index];
      el.classList.add('active-option');
      menu.setAttribute('aria-activedescendant', el.id);
      el.scrollIntoView({ block: 'nearest' });
    } else {
      menu.removeAttribute('aria-activedescendant');
    }
  }

  function isOpen(): boolean {
    return !menu.hidden;
  }

  function open(): void {
    if (isOpen()) return;
    openController?.close();
    openController = { close };
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    // Start on the selected option, else the first selectable one.
    const selectedIdx = opts.choices.findIndex((c) => c.selected);
    setActive(selectedIdx >= 0 ? selectedIdx : selectableIndexes[0] ?? -1);
    menu.focus();
    document.addEventListener('pointerdown', onOutsidePointer, true);
  }

  function close(): void {
    if (!isOpen()) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    setActive(-1);
    document.removeEventListener('pointerdown', onOutsidePointer, true);
    if (openController?.close === close) openController = null;
  }

  function commit(index: number): void {
    const choice = opts.choices[index];
    close();
    trigger.focus();
    if (!choice || choice.selected || choice.href === undefined) return;
    opts.onSelect(choice);
  }

  function moveActive(delta: number): void {
    if (selectableIndexes.length === 0) return;
    const pos = selectableIndexes.indexOf(activeIndex);
    let next = pos + delta;
    if (next < 0) next = selectableIndexes.length - 1;
    if (next >= selectableIndexes.length) next = 0;
    setActive(selectableIndexes[next]);
  }

  const onOutsidePointer = (event: Event): void => {
    // The toolbar lives in a shadow root, so a document-level event's `target`
    // is retargeted to the shadow host — `group.contains(target)` would always
    // be false and close the menu before an option's click lands. composedPath()
    // includes nodes inside the shadow tree, so it correctly sees inside clicks.
    if (!event.composedPath().includes(group)) close();
  };

  trigger.addEventListener('click', () => {
    if (isOpen()) close();
    else open();
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  });

  let typeahead = '';
  let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  menu.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        return;
      case 'Home':
        event.preventDefault();
        if (selectableIndexes.length) setActive(selectableIndexes[0]);
        return;
      case 'End':
        event.preventDefault();
        if (selectableIndexes.length) setActive(selectableIndexes[selectableIndexes.length - 1]);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0) commit(activeIndex);
        return;
      case 'Escape':
        event.preventDefault();
        close();
        trigger.focus();
        return;
      case 'Tab':
        close();
        return;
      default:
        break;
    }

    // Type-ahead: jump to the next selectable option whose label starts with
    // the typed prefix.
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      typeahead += event.key.toLowerCase();
      clearTimeout(typeaheadTimer);
      typeaheadTimer = setTimeout(() => (typeahead = ''), 600);
      const match = selectableIndexes.find((i) =>
        opts.choices[i].label.toLowerCase().startsWith(typeahead)
      );
      if (match !== undefined) setActive(match);
    }
  });

  return group;
}
