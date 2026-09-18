/* Review prototype: all edits are in-memory; no backend requests or persistence. */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const icon = (name) => `<i class="icon i-${name}" aria-hidden="true"></i>`;
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[char])
    );
  const button = (label, action, symbol, cls = '') =>
    `<button class="${cls}" data-action="${action}">${
      symbol ? icon(symbol) : ''
    }${label}</button>`;
  const ib = (label, action, symbol, cls = '') =>
    `<button class="icon-button ${cls}" aria-label="${label}" title="${label}" data-action="${action}">${icon(
      symbol
    )}</button>`;
  const field = (label, value, type = 'text', attr = '') =>
    `<label class="field">${label}<input type="${type}" value="${escape(
      value
    )}" ${attr}></label>`;
  const select = (label, values, attr = '') =>
    `<label class="field">${label}<select ${attr}>${values
      .map((x) => `<option>${x}</option>`)
      .join('')}</select></label>`;
  const section = (title, body) =>
    `<section class="property-section"><h3>${title}</h3>${body}</section>`;
  const detail = (title, summary, body) =>
    `<details class="disclosure"><summary>${title}<small>${summary}</small></summary><div class="detail-body">${body}</div></details>`;
  const affix = (label, value, unit = '', attr = '') =>
    `<div class="input-affix"><span>${label}</span><input aria-label="${label}" type="number" value="${value}" step="0.01" ${attr}><span>${unit}</span></div>`;
  const asset = document.body.dataset.assets || 'shared/assets/';
  const workspace = $('#workspace');
  const popover = $('#popover');
  const state = {
    selected: ['title'],
    tab: 'content',
    panel: 'properties',
    expanded: false,
    left: 'layers',
    mode: 'select',
    font: 'Impact',
    fill: '#f7efdf',
    theme: 'light',
    menuTarget: 'title',
    zoom: 50,
    browseFonts: false,
    menuPrevious: [],
  };
  let layers = [
    { id: 'tickets', name: 'Tickets · QR', type: 'qr', icon: 'QrCode' },
    {
      id: 'caption',
      name: 'Tickets & ringside seating',
      type: 'text',
      icon: 'Type',
    },
    { id: 'date', name: 'October 14, 2026', type: 'text', icon: 'Type' },
    { id: 'venue', name: 'Doors & bell time', type: 'text', icon: 'Type' },
    { id: 'title', name: 'Battle Royal 2026', type: 'text', icon: 'Type' },
    { id: 'rule', name: 'Gold accent', type: 'shape', icon: 'Minus' },
    { id: 'presents', name: 'Presents', type: 'text', icon: 'Type' },
    { id: 'brand', name: 'CWA', type: 'text', icon: 'Type' },
    {
      id: 'arena',
      name: 'Arena · warm overhead lights',
      type: 'image',
      icon: 'Image',
    },
    {
      id: 'background',
      name: 'Background',
      type: 'shape',
      icon: 'Square',
      locked: true,
    },
  ];
  const initialLayers = structuredClone(layers);
  const bounds = {
    title: [7, 27.5, 86, 24],
    date: [9, 61.5, 82, 6],
    tickets: [69, 76.5, 20, 15.5],
    arena: [0, 0, 100, 100],
    rule: [9.5, 53.5, 81, 2],
    brand: [9, 7.5, 82, 9],
    caption: [10, 78, 55, 13],
    venue: [9, 68, 82, 5],
    presents: [10, 17, 80, 5],
    background: [0, 0, 100, 100],
  };
  let toastTimer;
  let returnFocus;
  function notify(message) {
    $('#toast').textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      $('#toast').textContent = '';
    }, 4200);
  }
  function closePopover(focus = true) {
    popover.hidden = true;
    popover.innerHTML = '';
    if (focus && returnFocus?.isConnected) returnFocus.focus();
  }
  function openPopover(html, anchor, name, width = 286) {
    if (popover.contains(anchor)) anchor = returnFocus;
    closePopover(false);
    returnFocus = anchor;
    popover.innerHTML = html;
    popover.hidden = false;
    popover.dataset.kind = name;
    popover.style.width = `${width}px`;
    popover.setAttribute('aria-label', name);
    popover.setAttribute(
      'role',
      name === 'Layer actions' || name === 'Save options' ? 'menu' : 'dialog'
    );
    const r = anchor.getBoundingClientRect();
    const p = popover.getBoundingClientRect();
    let left = r.right - p.width;
    let top = r.bottom + 7;
    if (name === 'Layer actions') {
      left = r.right + 7;
      top = r.top - 35;
    }
    if (innerWidth < 901) {
      left = (innerWidth - p.width) / 2;
      top = Math.min(top, innerHeight - p.height - 65);
    }
    popover.style.left = `${Math.max(
      12,
      Math.min(left, innerWidth - p.width - 12)
    )}px`;
    popover.style.top = `${Math.max(
      48,
      Math.min(top, innerHeight - p.height - 12)
    )}px`;
    popover.querySelector('input:not([type=radio]), button, select')?.focus();
  }
  function popHeading(title) {
    return `<div class="popover-heading"><h2>${title}</h2>${ib(
      'Close panel',
      'close-popover',
      'X'
    )}</div>`;
  }
  function current() {
    return layers.find((x) => x.id === state.selected[0]) || layers[0];
  }
  function choose(ids, showPanel = false) {
    state.selected = ids.length ? ids : [current().id];
    state.tab = 'content';
    state.mode = 'select';
    closePopover(false);
    if (showPanel) state.panel = 'properties';
    render();
  }
  function selectLayer(id, toggle = false) {
    choose(
      toggle
        ? state.selected.includes(id)
          ? state.selected.filter((x) => x !== id)
          : [...state.selected, id]
        : [id]
    );
  }
  function renderLayers() {
    $('#left-content').innerHTML =
      state.left === 'add'
        ? `<div class="add-palette">
      <h3>Start with</h3>${button(
        'Text',
        'add-text',
        'Type',
        'outline full'
      )}${button('Image library', 'library', 'Image', 'outline full')}${button(
            'Upload image',
            'upload',
            'Upload',
            'outline full'
          )}${button('QR slot', 'add-qr', 'QrCode', 'outline full')}
      <h3>Shapes & paths</h3><div class="add-grid">${[
        ['Rectangle', 'Square'],
        ['Ellipse', 'Circle'],
        ['Triangle', 'Triangle'],
        ['Star', 'Star'],
        ['Line', 'Minus'],
        ['Spline', 'Spline'],
      ]
        .map(([label, symbol]) => button(label, 'add-shape', symbol))
        .join('')}</div>
      <h3>Image frame</h3>${button(
        'Place image in a shape',
        'frame',
        'Frame',
        'outline full'
      )}<p class="hint">Choose a shape, then click to place or drag to draw.</p></div>`
        : `<div class="layer-heading"><span>${
            layers.length
          } layers</span><span>Front to back</span></div>${layers
            .map(
              (layer) => `<div class="layer-row ${
                state.selected.includes(layer.id) ? 'selected' : ''
              } ${layer.hidden ? 'hidden-layer' : ''}" data-layer="${
                layer.id
              }" data-annotate-id="layer-${layer.id}">
      <button class="layer-name" data-select="${
        layer.id
      }" aria-pressed="${state.selected.includes(layer.id)}" title="${escape(
                layer.name
              )}"><span class="thumb">${
                layer.type === 'image'
                  ? `<img src="${asset}arena.png" alt="">`
                  : icon(layer.icon)
              }</span><span class="truncate">${escape(
                layer.name
              )}</span></button>
      ${ib(
        layer.locked
          ? `Unlock ${escape(layer.name)}`
          : `${layer.hidden ? 'Show' : 'Hide'} ${escape(layer.name)}`,
        `visibility:${layer.id}`,
        layer.locked ? 'Lock' : layer.hidden ? 'EyeOff' : 'Eye',
        layer.locked ? '' : 'visibility'
      )}
      ${ib(
        `Actions for ${escape(layer.name)}`,
        `menu:${layer.id}`,
        'Ellipsis'
      )}</div>`
            )
            .join('')}`;
    $$('.panel-tabs button').forEach((x) =>
      x.classList.toggle('active', x.dataset.action === `left-${state.left}`)
    );
  }
  const fillControl = () =>
    `<button class="fill-trigger" data-action="fill"><span class="swatch" style="--swatch:${
      state.fill
    }"></span><span class="grow">${state.fill.toUpperCase()}</span><small>100%</small>${icon(
      'ChevronDown'
    )}</button>`;
  function textProperties() {
    const text =
      current().id === 'title' ? 'BATTLE ROYAL\n2026' : current().name;
    return (
      section(
        'Content',
        `<label class="sr-only" for="text-content">Text content</label><textarea id="text-content" data-edit="text">${escape(
          text
        )}</textarea>`
      ) +
      section(
        'Typography',
        `<button class="font-trigger" data-action="font"><span class="font-value">${escape(
          state.font
        )}</span>${icon(
          'ChevronDown'
        )}</button><div class="field-pair">${select('Style', [
          'Regular',
          'Bold',
          'Italic',
        ])}${field(
          'Size',
          '112',
          'number',
          'data-edit="size"'
        )}</div><div class="segmented" aria-label="Text alignment">${ib(
          'Align text left',
          'align-left',
          'AlignLeft'
        )}${ib(
          'Align text center',
          'align-center',
          'AlignCenter',
          'active'
        )}${ib('Align text right', 'align-right', 'AlignRight')}</div>`
      ) +
      section('Fill', fillControl()) +
      detail(
        'Spacing',
        'Auto height',
        `<div class="field-pair">${field(
          'Line height',
          '1.02',
          'number'
        )}${field('Letter spacing', '-2', 'number')}</div>${select(
          'Text sizing',
          ['Auto height · fixed max width', 'Auto width']
        )}`
      ) +
      detail(
        'Text path',
        'Straight',
        `${select('Path', ['Straight', 'Arc', 'Spline with handles'])}${button(
          'Edit path on canvas',
          'path-mode',
          'Spline',
          'outline full'
        )}`
      ) +
      detail(
        'Outline',
        'None',
        `<div class="field-pair">${field('Width', '0', 'number')}${field(
          'Color',
          '#100d0c',
          'color'
        )}</div>`
      ) +
      detail(
        'Shadow',
        'Off',
        `<label class="check-row"><input type="checkbox">Enable shadow</label><div class="field-pair">${field(
          'Blur',
          '8',
          'number'
        )}${field('Opacity', '35', 'number')}</div>`
      )
    );
  }
  function imageProperties() {
    return (
      section(
        'Source image',
        `<img class="image-preview" src="${asset}arena.png" alt="Wrestling ring under warm arena lights"><div class="image-name">Arena · warm overhead lights</div><p class="hint">1,600 × 900 px · Saved in image library</p>${button(
          'Replace image',
          'replace-image',
          'Replace',
          'outline full'
        )}`
      ) +
      section(
        'Framing',
        `<div class="row">${button(
          'Crop',
          'crop-mode',
          'Crop',
          'outline grow'
        )}${button('Fit', 'fit-image', null, 'outline')}${button(
          'Fill',
          'fill-image',
          null,
          'outline'
        )}</div><div class="row">${button(
          'Flip horizontal',
          'flip-image',
          'FlipHorizontal2',
          'grow'
        )}${ib('Flip vertical', 'flip-image', 'FlipVertical2')}</div>`
      ) +
      section(
        'Background',
        `${button(
          'Remove background',
          'remove-background',
          'WandSparkles',
          'outline full'
        )}${button(
          'Refine mask',
          'mask-mode',
          'Paintbrush',
          'inline-link'
        )}<p class="hint">The original stays in your library.</p>`
      ) +
      detail(
        'Removal settings',
        'Automatic',
        `${select('Model', ['Automatic', 'General foreground'])}${field(
          'Edge softness',
          '2',
          'number'
        )}`
      ) +
      detail(
        'Crop & source details',
        'Fill canvas',
        `<div class="field-pair">${field('X offset', '-60', 'number')}${field(
          'Y offset',
          '0',
          'number'
        )}</div>`
      ) +
      detail(
        'Shadow',
        'Off',
        '<p class="hint">Enable a shadow for cutout images.</p>'
      )
    );
  }
  function qrProperties() {
    return (
      section(
        'Destination & tracking',
        `${field('Layer name', 'Tickets · QR')}${field(
          'Destination URL',
          'https://example.com/cwa/tickets',
          'url'
        )}<p class="tracking-note">${icon(
          'ScanLine'
        )}<span>Tracked separately for this QR slot.<br>Unique links are created with each print run.</span></p>`
      ) +
      section(
        'Appearance',
        `<div class="field-pair">${select('Dots', [
          'Square',
          'Rounded',
          'Dots',
        ])}${select('Corners', [
          'Square',
          'Rounded',
        ])}</div><div class="row"><span class="swatch" style="--swatch:#100d0c"></span><span class="grow">Code color</span><small>#100D0C</small></div><div class="row"><span class="swatch"></span><span class="grow">Background</span><small>#F7EFDF</small></div>`
      ) +
      section(
        'Center artwork',
        `<div class="row"><div class="logo-preview">CWA</div><div class="grow"><div class="image-name">CWA mark</div><small>Transparent PNG</small></div>${button(
          'Replace',
          'replace-logo'
        )}</div><label class="check-row"><input type="checkbox" checked data-edit="logo-margin">Follow artwork silhouette</label><p class="hint">Clear a margin around the visible artwork, not its rectangular bounds.</p><div class="field-pair">${field(
          'Logo size (%)',
          '22',
          'number'
        )}${field('Margin', '2', 'number')}</div>`
      ) +
      detail(
        'Scan safety',
        'High correction',
        `${select('Error correction', [
          'High · recommended with a logo',
          'Medium',
        ])}${field(
          'Quiet zone',
          '4',
          'number'
        )}<p class="hint">Test a printed sample before ordering a run.</p>`
      )
    );
  }
  function shapeProperties() {
    return (
      section(
        'Shape',
        `${select('Type', [
          'Rectangle',
          'Ellipse',
          'Triangle',
          'Star',
          'Path',
        ])}<div class="field-pair">${field(
          'Corner radius',
          '0',
          'number'
        )}${field('Rotation', '0', 'number')}</div>`
      ) +
      section(
        'Fill',
        `<button class="fill-trigger" data-action="gradient"><span class="swatch gradient"></span><span class="grow">Linear gradient</span>${icon(
          'ChevronDown'
        )}</button>`
      ) +
      section(
        'Stroke',
        `<div class="row"><span class="swatch" style="--swatch:transparent"></span><span class="grow">None</span>${button(
          'Add stroke',
          'stroke'
        )}</div>`
      ) +
      detail(
        'Stroke details',
        'Solid',
        `${select('Style', ['Solid', 'Dashed', 'Dotted'])}${select('Join', [
          'Miter',
          'Round',
          'Bevel',
        ])}`
      ) +
      detail(
        'Path',
        'Rectangle',
        `${button('Edit nodes', 'path-mode', 'Spline', 'outline full')}`
      ) +
      detail(
        'Shadow',
        'Off',
        '<label class="check-row"><input type="checkbox">Enable shadow</label>'
      ) +
      section(
        'Image frame',
        `${button('Place image in shape', 'frame', 'Frame', 'outline full')}`
      )
    );
  }
  function layerProperties() {
    const image = current().type === 'image';
    return (
      section(
        'Transform',
        `<div class="field-pair">${affix('X', image ? -60 : 96, 'px')}${affix(
          'Y',
          image ? 0 : 368,
          'px'
        )}</div><div class="field-pair">${affix(
          image ? 'Scale X' : 'Width',
          image ? 125 : 1008,
          image ? '%' : 'px'
        )}${affix(
          image ? 'Scale Y' : 'Height',
          image ? 125 : 280,
          image ? '%' : 'px'
        )}</div><div class="field-pair">${affix('Rotation', 0, '°')}${button(
          'Ratio locked',
          'ratio',
          'Link',
          'outline'
        )}</div>`
      ) +
      section(
        'Align to canvas',
        `<div class="row between"><div class="align-grid">${[
          'Top left',
          'Top center',
          'Top right',
          'Middle left',
          'Center',
          'Middle right',
          'Bottom left',
          'Bottom center',
          'Bottom right',
        ]
          .map(
            (x, i) =>
              `<button aria-label="${x}" title="${x}" data-action="position-${i}"><span class="position-mark" aria-hidden="true" style="--position-x:${
                ['flex-start', 'center', 'flex-end'][i % 3]
              };--position-y:${
                ['flex-start', 'center', 'flex-end'][Math.floor(i / 3)]
              }"></span></button>`
          )
          .join(
            ''
          )}</div><p class="hint">Position the layer<br>within the canvas.</p></div>`
      ) +
      section(
        'Appearance',
        `<div class="row"><label class="grow" for="layer-opacity">Opacity</label><small id="opacity-value">100%</small></div><input id="layer-opacity" type="range" min="0" max="100" value="100" data-edit="opacity">${select(
          'Blend mode',
          ['Normal', 'Multiply', 'Screen', 'Overlay', 'Color burn', 'Subtract']
        )}`
      ) +
      section(
        'Layer',
        `${field(
          'Name',
          current().name,
          'text',
          'data-edit="name"'
        )}<label class="check-row"><input type="checkbox" ${
          current().locked ? 'checked' : ''
        }>Lock layer</label><label class="check-row"><input type="checkbox" checked>Visible</label>`
      )
    );
  }
  function multiProperties() {
    return (
      section(
        'Selection',
        `<p class="hint">${state.selected
          .map((id) => escape(layers.find((x) => x.id === id)?.name || id))
          .join(' · ')}</p>${button(
          'Group selection',
          'group',
          'Group',
          'outline full'
        )}`
      ) +
      section(
        'Align',
        `<div class="arrange-grid">${[
          ['Left edges', 'AlignStartVertical'],
          ['Horizontal centers', 'AlignCenterVertical'],
          ['Right edges', 'AlignEndVertical'],
          ['Top edges', 'AlignStartHorizontal'],
          ['Vertical centers', 'AlignCenterHorizontal'],
          ['Bottom edges', 'AlignEndHorizontal'],
        ]
          .map(([label, symbol]) => ib(label, 'align-selection', symbol))
          .join('')}</div>${select('Relative to', [
          'Selection bounds',
          'Canvas',
        ])}`
      ) +
      section(
        'Distribute',
        `<div class="row">${button(
          'Horizontal',
          'distribute',
          'AlignCenterVertical',
          'outline grow'
        )}${button(
          'Vertical',
          'distribute',
          'AlignCenterHorizontal',
          'outline grow'
        )}</div>`
      ) +
      section(
        'Actions',
        `${button(
          'Duplicate selection',
          'duplicate',
          'Copy',
          'outline full'
        )}${button('Lock selection', 'lock', 'Lock', 'full')}`
      ) +
      detail(
        'Selection details',
        `${state.selected.length} objects`,
        '<p class="hint">Each object keeps its own position, fill, and effects. Use the Layer tab on one object to edit its appearance.</p>'
      )
    );
  }
  function renderInspector() {
    const multiple = state.selected.length > 1;
    const layer = current();
    const type = multiple
      ? 'Selection'
      : { text: 'Text', image: 'Image', qr: 'QR slot', shape: 'Shape' }[
          layer.type
        ];
    $('#selection-heading').textContent = multiple
      ? `${state.selected.length} layers selected`
      : layer.name;
    $('#selection-type').innerHTML = icon(multiple ? 'Layers' : layer.icon);
    $('#inspector-tabs').innerHTML = multiple
      ? `<button class="active">Selection</button>`
      : `<button data-action="tab-content" class="${
          state.tab === 'content' ? 'active' : ''
        }">${type}</button><button data-action="tab-layer" class="${
          state.tab === 'layer' ? 'active' : ''
        }">Layer</button>`;
    $('#properties').innerHTML = multiple
      ? multiProperties()
      : state.tab === 'layer'
      ? layerProperties()
      : {
          text: textProperties,
          image: imageProperties,
          qr: qrProperties,
          shape: shapeProperties,
        }[layer.type]();
  }
  function renderSelection() {
    const rects = state.selected.map((id) => bounds[id] || bounds.title);
    const draw = (r, name, member = false) =>
      `<div class="selection ${member ? 'member' : ''}" style="left:${
        r[0]
      }%;top:${r[1]}%;width:${r[2]}%;height:${r[3]}%">${
        member
          ? ''
          : `<span class="selection-tag">${escape(
              name
            )}</span>${'<span class="handle"></span>'.repeat(4)}`
      }</div>`;
    let html = '';
    if (rects.length > 1) {
      html = rects.map((r) => draw(r, '', true)).join('');
      const x = Math.min(...rects.map((r) => r[0]));
      const y = Math.min(...rects.map((r) => r[1]));
      html += draw(
        [
          x,
          y,
          Math.max(...rects.map((r) => r[0] + r[2])) - x,
          Math.max(...rects.map((r) => r[1] + r[3])) - y,
        ],
        `${rects.length} layers`
      );
    } else html = draw(rects[0], current().name);
    $('#selection-outlines').innerHTML = html;
    $('#crop-overlay').hidden = state.mode !== 'crop';
  }
  function renderTools() {
    const editing = state.mode !== 'select';
    $('#tool-bar').innerHTML = editing
      ? `<div class="row">${icon(
          { crop: 'Crop', text: 'Type', path: 'Spline', mask: 'Paintbrush' }[
            state.mode
          ]
        )}<strong>${
          {
            crop: 'Crop image',
            text: 'Edit text',
            path: 'Edit path',
            mask: 'Refine mask',
          }[state.mode]
        }</strong></div><div class="row">${button(
          'Cancel',
          'end-mode'
        )}${button('Done', 'end-mode', 'Check', 'primary')}</div>`
      : `<div class="row">${ib(
          'Select tool',
          'select-tool',
          'MousePointer2',
          'active'
        )}${ib(
          'Pan canvas',
          'pan-tool',
          'Hand'
        )}<span class="divider"></span><span class="mode-label">${
          state.selected.length > 1
            ? `${state.selected.length} selected`
            : current().type === 'text'
            ? 'Double-click text to edit'
            : 'Drag to position'
        }</span></div><div class="row">${
          current().type === 'text' && state.selected.length === 1
            ? button('Edit text', 'text-mode', 'Pencil')
            : ''
        }${ib('Duplicate selection', 'duplicate', 'Copy')}</div>`;
  }
  function render() {
    renderLayers();
    renderInspector();
    renderSelection();
    renderTools();
    workspace.dataset.panel = state.panel;
    workspace.dataset.expanded = state.expanded;
    $$('.mobile-nav button').forEach((b) =>
      b.classList.toggle('active', b.dataset.action === `panel-${state.panel}`)
    );
  }
  function layerMenu(anchor, id) {
    state.menuTarget = id;
    state.menuPrevious = [...state.selected];
    const outsideSelection = !state.selected.includes(id);
    if (outsideSelection) {
      state.selected = [id];
      render();
      anchor = $(`[data-action="menu:${id}"]`) || anchor;
    }
    const multi = state.selected.length > 1;
    const locked = state.selected.some(
      (x) => layers.find((l) => l.id === x)?.locked
    );
    const action = (
      label,
      name,
      symbol,
      key = '',
      cls = '',
      disabled = false
    ) =>
      `<button data-action="${name}" class="${cls}" ${
        disabled ? 'disabled title="Unlock the layer first"' : ''
      }>${icon(symbol)}${label}${key ? `<kbd>${key}</kbd>` : ''}</button>`;
    openPopover(
      `<div class="menu-label">${
        multi
          ? `${state.selected.length} selected layers`
          : escape(current().name)
      }</div>
      ${
        multi
          ? action(
              'Remove from selection',
              'remove-selection',
              'SquareDashedMousePointer'
            ) + '<hr>'
          : outsideSelection
          ? action(
              'Add to selection',
              'add-selection',
              'SquareDashedMousePointer'
            ) + '<hr>'
          : ''
      }
      ${action(
        multi ? 'Duplicate selection' : 'Duplicate',
        'duplicate',
        'Copy',
        '⌘D',
        '',
        locked
      )}${!multi ? action('Rename', 'rename', 'Pencil') : ''}<hr>
      ${action(
        'Bring to front',
        'front',
        'ArrowUpToLine',
        '',
        '',
        locked
      )}${action('Move forward', 'forward', 'ArrowUp', '', '', locked)}${action(
        'Move backward',
        'backward',
        'ArrowDown',
        '',
        '',
        locked
      )}${action('Send to back', 'back', 'ArrowDownToLine', '', '', locked)}<hr>
      ${multi ? action('Group selection', 'group', 'Group', '⌘G') : ''}${action(
        locked ? 'Unlock' : 'Lock',
        'lock',
        locked ? 'Unlock' : 'Lock'
      )}${action('Hide', 'hide', 'EyeOff')}<hr>${action(
        multi ? 'Delete selection' : 'Delete',
        'delete',
        'Trash2',
        '⌫',
        'danger',
        locked
      )}`,
      anchor,
      'Layer actions',
      228
    );
    popover.classList.add('menu');
  }
  const fonts = [
    ['Impact', 'System', 'Impact, sans-serif'],
    ['Georgia', 'System', 'Georgia, serif'],
    ['Arial', 'System', 'Arial, sans-serif'],
    ['Anton', 'Google Fonts', 'Impact, sans-serif'],
    ['Bebas Neue', 'Bunny Fonts', "'Arial Narrow', sans-serif"],
    ['Roboto Slab', 'Bunny Fonts', 'Georgia, serif'],
  ];
  function fontResults() {
    const query = ($('#font-search')?.value || '').toLowerCase();
    const provider = $('#font-provider')?.value || 'All sources';
    const source =
      state.browseFonts || query || provider !== 'All sources'
        ? fonts
        : [fonts[0], fonts[3], fonts[4]];
    const matches = source.filter(
      (f) =>
        f[0].toLowerCase().includes(query) &&
        (provider === 'All sources' || f[1] === provider)
    );
    $('#font-results').innerHTML = matches.length
      ? matches
          .map(
            (f) =>
              `<button class="font-option" data-font="${f[0]}"><span style="font-family:${f[2]}">${f[0]}</span><small>${f[1]}</small></button>`
          )
          .join('')
      : '<p class="hint">No matches in this sample catalog.</p>';
  }
  function openFonts(anchor) {
    state.browseFonts = false;
    openPopover(
      `${popHeading('Choose font')}<div class="search">${icon(
        'Search'
      )}<input id="font-search" aria-label="Search fonts" placeholder="Search fonts…"></div><div class="font-filter"><span id="font-list-label">Recently used</span><select id="font-provider" aria-label="Font source"><option>All sources</option><option>System</option><option>Google Fonts</option><option>Bunny Fonts</option></select></div><div id="font-results"></div>${button(
        'Browse all fonts',
        'browse-fonts',
        null,
        'inline-link'
      )}<p class="hint">Sample catalog. Web-font previews use local fallback faces in this draft.</p>`,
      anchor,
      'Choose font'
    );
    fontResults();
  }
  function openFill(anchor, gradient = false) {
    openPopover(
      `${popHeading('Fill')}<div class="segmented">${button(
        'Solid',
        'fill-solid',
        null,
        gradient ? '' : 'active'
      )}${button(
        'Gradient',
        'fill-gradient',
        null,
        gradient ? 'active' : ''
      )}${button('Texture', 'fill-texture')}</div>${
        gradient
          ? `<div class="property-section">${select('Type', [
              'Linear',
              'Radial',
            ])}<div class="gradient-ramp" aria-label="Red to gold gradient"></div><div class="field-pair">${field(
              'Angle',
              '0',
              'number'
            )}${field('Opacity (%)', '100', 'number')}</div></div>`
          : `<div class="color-area" aria-hidden="true"></div><div class="field-pair">${field(
              'Hex',
              state.fill,
              'text',
              'data-edit="fill-hex"'
            )}${field('Opacity (%)', '100', 'number')}</div>`
      }<div class="property-section"><h3>Document colors</h3><div class="swatches">${[
        '#f7efdf',
        '#e3a341',
        '#ad332c',
        '#100d0c',
        '#ffffff',
      ]
        .map(
          (color) =>
            `<button aria-label="Use ${color}" data-color="${color}"><span class="swatch" style="--swatch:${color}"></span></button>`
        )
        .join('')}</div></div>`,
      anchor,
      'Fill'
    );
  }
  function setScenario(value) {
    const selections = {
      text: ['title'],
      image: ['arena'],
      qr: ['tickets'],
      multi: ['title', 'date', 'rule'],
      shape: ['rule'],
    };
    choose(selections[value] || ['title'], true);
    $('#scenario').value = value;
  }
  function action(name, el) {
    popover.classList.remove('menu');
    if (name.startsWith('menu:')) return layerMenu(el, name.slice(5));
    if (name.startsWith('visibility:')) {
      const layer = layers.find((x) => x.id === name.slice(11));
      if (layer.locked) layer.locked = false;
      else layer.hidden = !layer.hidden;
      renderLayers();
      const art = $(`[data-object="${layer.id}"]`);
      if (art) art.style.visibility = layer.hidden ? 'hidden' : '';
      return;
    }
    if (name.startsWith('left-')) {
      state.left = name.slice(5);
      renderLayers();
      return;
    }
    if (name.startsWith('panel-')) {
      state.panel = name.slice(6);
      state.expanded = false;
      if (['add', 'layers'].includes(state.panel)) state.left = state.panel;
      closePopover(false);
      render();
      return;
    }
    if (name.startsWith('tab-')) {
      state.tab = name.slice(4);
      closePopover(false);
      renderInspector();
      return;
    }
    if (name.startsWith('position-')) {
      notify(
        'Alignment location selected. Geometry changes are outside this mockup.'
      );
      return;
    }
    if (name.startsWith('align-') && !name.endsWith('selection')) {
      const alignment = name.slice(6);
      $('.art-title').style.textAlign = alignment;
      $$('.segmented [data-action^="align-"]').forEach((b) =>
        b.classList.toggle('active', b === el)
      );
      return;
    }
    switch (name) {
      case 'review-tools':
        document.body.dataset.reviewTools =
          document.body.dataset.reviewTools === 'true' ? 'false' : 'true';
        $('dd-toolbar')?.removeAttribute('data-tucked');
        break;
      case 'theme':
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = state.theme;
        el.innerHTML =
          icon(state.theme === 'light' ? 'Moon' : 'Sun') +
          (state.theme === 'light' ? 'Dark' : 'Light');
        break;
      case 'sheet-expand':
        state.expanded = !state.expanded;
        workspace.dataset.expanded = state.expanded;
        el.setAttribute(
          'aria-label',
          state.expanded ? 'Collapse properties' : 'Expand properties'
        );
        break;
      case 'close-popover':
        closePopover();
        break;
      case 'font':
        openFonts(el);
        break;
      case 'browse-fonts':
        state.browseFonts = true;
        $('#font-list-label').textContent = 'All fonts';
        el.hidden = true;
        fontResults();
        break;
      case 'fill':
      case 'fill-solid':
        openFill(el, false);
        break;
      case 'gradient':
      case 'fill-gradient':
        openFill(el, true);
        break;
      case 'fill-texture':
        openPopover(
          `${popHeading('Texture fill')}${select('Pattern', [
            'Grain',
            'Distressed',
            'Halftone',
            'Image texture',
          ])}<div class="property-section">${field(
            'Density',
            '35',
            'number'
          )}${field(
            'Scale',
            '1',
            'number'
          )}</div><p class="hint">Texture settings use the same fill editor.</p>`,
          el,
          'Texture fill'
        );
        break;
      case 'save-menu':
        openPopover(
          `<div class="menu-label">Poster artwork</div>${button(
            'Save poster',
            'save',
            'Check'
          )}<hr>${button(
            'Download image…',
            'download',
            'Download'
          )}<hr><p class="hint" style="padding:6px 9px">Tracked PDFs stay in the poster’s print-run workflow.</p>`,
          el,
          'Save options',
          248
        );
        popover.classList.add('menu');
        break;
      case 'download':
        openPopover(
          `${popHeading('Download image')}${field(
            'File name',
            'cwa-battle-royal-2026'
          )}<div class="property-section"><div class="field-pair">${select(
            'Format',
            ['PNG', 'WebP']
          )}${select('Output size', [
            '1× · 1200 × 1600',
            '2× · 2400 × 3200',
          ])}</div></div><p class="hint">Canvas bounds only. Selection handles and off-canvas artwork are excluded.</p><div class="property-section">${button(
            'Download image',
            'download-demo',
            'Download',
            'primary full'
          )}</div>`,
          el,
          'Download image'
        );
        break;
      case 'download-demo':
        notify(
          'Review only: no file exported. This previews the download controls.'
        );
        closePopover();
        break;
      case 'save':
        notify(
          'Review only: no poster saved. Production save behavior is unchanged.'
        );
        closePopover();
        break;
      case 'canvas':
        openPopover(
          `${popHeading('Canvas')}<div class="row">${icon(
            'Lock'
          )}<strong>Poster · 3:4</strong></div><div class="property-section"><div class="field-pair">${field(
            'Width',
            '1200',
            'number',
            'disabled'
          )}${field(
            'Height',
            '1600',
            'number',
            'disabled'
          )}</div><p class="hint">Poster dimensions are fixed. General artwork can use a custom size.</p></div><div class="property-section"><h3>Background</h3>${fillControl()}</div>`,
          el,
          'Canvas settings'
        );
        break;
      case 'text-mode':
      case 'crop-mode':
      case 'path-mode':
      case 'mask-mode':
        state.mode = name.split('-')[0];
        closePopover(false);
        renderTools();
        renderSelection();
        if (state.mode === 'text') {
          $('.art-title').contentEditable = 'true';
          $('.art-title').focus();
        }
        if (['path', 'mask'].includes(state.mode))
          notify(
            'Mode layout preview. The production path and mask tools will be retained.'
          );
        break;
      case 'end-mode':
        state.mode = 'select';
        $('.art-title').contentEditable = 'false';
        renderTools();
        renderSelection();
        break;
      case 'duplicate': {
        const copies = state.selected.map((id) => {
          const original = layers.find((x) => x.id === id);
          return {
            ...original,
            id: `${id}-copy-${layers.length}`,
            name: `${original.name} copy`,
          };
        });
        layers = [...copies, ...layers];
        choose(copies.map((x) => x.id));
        notify('Duplicated in this review session only.');
        break;
      }
      case 'delete':
        layers = layers.filter((x) => !state.selected.includes(x.id));
        choose([layers[0]?.id || 'title']);
        notify('Removed from the draft layer list. Reload to reset.');
        break;
      case 'remove-selection':
        choose(state.selected.filter((x) => x !== state.menuTarget));
        break;
      case 'add-selection':
        choose([...new Set([...state.menuPrevious, state.menuTarget])]);
        break;
      case 'rename':
        state.tab = 'layer';
        closePopover(false);
        renderInspector();
        $('[data-edit=name]')?.focus();
        break;
      case 'lock':
        state.selected.forEach((id) => {
          const layer = layers.find((x) => x.id === id);
          layer.locked = !layer.locked;
        });
        closePopover(false);
        render();
        break;
      case 'hide':
        state.selected.forEach((id) => {
          const layer = layers.find((x) => x.id === id);
          layer.hidden = true;
          const art = $(`[data-object="${id}"]`);
          if (art) art.style.visibility = 'hidden';
        });
        closePopover(false);
        render();
        break;
      case 'front':
      case 'back':
      case 'forward':
      case 'backward': {
        const selection = layers.filter((x) => state.selected.includes(x.id));
        const rest = layers.filter((x) => !state.selected.includes(x.id));
        const start = layers.findIndex((x) => state.selected.includes(x.id));
        const position =
          name === 'front'
            ? 0
            : name === 'back'
            ? rest.length
            : Math.max(
                0,
                Math.min(rest.length, start + (name === 'forward' ? -1 : 1))
              );
        rest.splice(position, 0, ...selection);
        layers = rest;
        closePopover(false);
        renderLayers();
        notify('Layer order preview updated.');
        break;
      }
      case 'group':
        closePopover();
        notify(
          `${state.selected.length} layers grouped in the proposed workflow. This draft does not mutate group geometry.`
        );
        break;
      case 'add-text':
        setScenario('text');
        notify(
          'Text insertion entry point. Existing text selected for this review.'
        );
        break;
      case 'add-qr':
        setScenario('qr');
        notify('Each QR slot gets its own destination and tracking.');
        break;
      case 'add-shape':
        setScenario('shape');
        notify(
          'Shape insertion entry point. Choose click-to-place or drag-to-draw in the final editor.'
        );
        break;
      case 'replace-image':
      case 'library':
      case 'upload':
      case 'frame':
        openPopover(
          `${popHeading(
            name === 'frame' ? 'Image frame' : 'Choose image'
          )}<img class="image-preview" src="${asset}arena.png" alt="Arena sample"><h3>Arena · warm overhead lights</h3><p class="hint">Saved library image · 1,600 × 900</p><div class="property-section">${button(
            'Use this image',
            'use-image',
            'Image',
            'primary full'
          )}</div><p class="hint">Sample picker only. No files are uploaded.</p>`,
          el,
          'Choose image'
        );
        break;
      case 'use-image':
        setScenario('image');
        break;
      case 'replace-logo':
        notify(
          'Logo library entry point. CWA mark remains selected in this draft.'
        );
        break;
      case 'fit':
        state.zoom = 50;
        $('#zoom-value').textContent = '50%';
        $('.poster').style.transform = '';
        break;
      case 'zoom-100':
        state.zoom = 100;
        $('#zoom-value').textContent = '100%';
        $('.poster').style.transform = 'scale(1.35)';
        break;
      case 'reset':
        layers = structuredClone(initialLayers);
        location.reload();
        break;
      case 'close-editor':
        notify(
          'Review preview stays open. The production Close action will retain discard protection.'
        );
        break;
      case 'undo':
      case 'redo':
        notify(
          'Undo/redo placement preview. Document history is not simulated.'
        );
        break;
      case 'pan-tool':
      case 'select-tool':
        $$('#tool-bar .icon-button').forEach((b) =>
          b.classList.toggle('active', b === el)
        );
        notify(
          name === 'pan-tool'
            ? 'Pan tool selected. Canvas movement is not simulated.'
            : 'Select tool active.'
        );
        break;
      default:
        notify(
          'Control placement preview; the existing editor behavior will be retained.'
        );
    }
  }
  document.addEventListener('click', (event) => {
    if (event.target.closest('[contenteditable=true]')) return;
    const target = event.target.closest('button');
    if (target?.dataset.select) {
      selectLayer(
        target.dataset.select,
        event.metaKey || event.ctrlKey || event.altKey
      );
      return;
    }
    if (target?.dataset.font) {
      state.font = target.dataset.font;
      $('.art-title').style.fontFamily = fonts.find(
        (x) => x[0] === state.font
      )[2];
      closePopover();
      renderInspector();
      return;
    }
    if (target?.dataset.color) {
      state.fill = target.dataset.color;
      $('.art-title').style.color = state.fill;
      closePopover();
      renderInspector();
      return;
    }
    if (target?.dataset.action) {
      action(target.dataset.action, target);
      return;
    }
    const object = event.target.closest('[data-object]');
    if (object) {
      selectLayer(
        object.dataset.object,
        event.metaKey || event.ctrlKey || event.altKey
      );
      return;
    }
    if (!popover.hidden && !popover.contains(event.target)) closePopover(false);
  });
  document.addEventListener('contextmenu', (event) => {
    const row = event.target.closest('[data-layer]');
    const object = event.target.closest('[data-object]');
    if (!row && !object) return;
    event.preventDefault();
    layerMenu(row || object, row?.dataset.layer || object.dataset.object);
  });
  $('.art-title').addEventListener('dblclick', () =>
    action('text-mode', $('#tool-bar'))
  );
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!popover.hidden) closePopover();
      else if (state.mode !== 'select') action('end-mode', $('#tool-bar'));
    }
    if (
      !popover.hidden &&
      ['ArrowDown', 'ArrowUp'].includes(event.key) &&
      popover.getAttribute('role') === 'menu'
    ) {
      event.preventDefault();
      const buttons = $$('button:not(:disabled)', popover);
      const index = buttons.indexOf(document.activeElement);
      buttons[
        (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) %
          buttons.length
      ]?.focus();
    }
  });
  document.addEventListener('input', (event) => {
    const el = event.target;
    if (el.id === 'font-search') fontResults();
    if (el.dataset.edit === 'text' && current().id === 'title')
      $('.art-title').innerHTML = escape(el.value).replace(/\n/g, '<br>');
    if (el.dataset.edit === 'size')
      $('.art-title').style.fontSize = `${Math.max(
        2,
        Math.min(25, Number(el.value) / 8.6)
      )}cqw`;
    if (el.dataset.edit === 'fill-hex' && /^#[\da-f]{6}$/i.test(el.value)) {
      state.fill = el.value;
      $('.art-title').style.color = state.fill;
    }
    if (el.dataset.edit === 'opacity') {
      $('#opacity-value').textContent = `${el.value}%`;
      const art = $(`[data-object="${current().id}"]`);
      if (art) art.style.opacity = Number(el.value) / 100;
    }
    if (el.dataset.edit === 'name') {
      current().name = el.value;
      $('#selection-heading').textContent = el.value;
      renderLayers();
    }
    if (el.id === 'zoom-range') {
      $('#zoom-value').textContent = `${el.value}%`;
      $('.poster').style.transform = `scale(${Number(el.value) / 50})`;
    }
  });
  document.addEventListener('change', (event) => {
    if (event.target.id === 'font-provider') fontResults();
    if (event.target.id === 'scenario') setScenario(event.target.value);
    if (event.target.dataset.edit === 'logo-margin')
      $('.art-qr-logo').style.borderRadius = event.target.checked ? '45%' : '0';
  });
  window.addEventListener('resize', () => closePopover(false));
  const initial = document.body.dataset.state || 'text';
  const theme = new URLSearchParams(location.search).get('theme');
  if (theme === 'dark') {
    state.theme = 'dark';
    document.documentElement.dataset.theme = 'dark';
    $('[data-action=theme]').innerHTML = icon('Sun') + 'Light';
  }
  setScenario(initial);
})();
