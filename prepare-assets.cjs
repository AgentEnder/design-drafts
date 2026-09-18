// Generates review-only assets from installed libraries and repository artwork.
// Run from the repository root. No network, database, or app writes.
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const icons = require('lucide-react');
const QRCode = require('qrcode');
const root = __dirname;
const assets = path.join(root, 'shared/assets');
fs.mkdirSync(assets, { recursive: true });
const names = [
  'ArrowLeft',
  'Undo2',
  'Redo2',
  'ChevronDown',
  'ChevronRight',
  'Check',
  'Cloud',
  'Download',
  'Moon',
  'Sun',
  'Layers',
  'Plus',
  'Type',
  'Image',
  'Shapes',
  'QrCode',
  'Eye',
  'EyeOff',
  'Lock',
  'Unlock',
  'Ellipsis',
  'MousePointer2',
  'Hand',
  'Copy',
  'Trash2',
  'Pencil',
  'Search',
  'SlidersHorizontal',
  'AlignLeft',
  'AlignCenter',
  'AlignRight',
  'AlignStartVertical',
  'AlignCenterVertical',
  'AlignEndVertical',
  'AlignStartHorizontal',
  'AlignCenterHorizontal',
  'AlignEndHorizontal',
  'ArrowUpToLine',
  'ArrowUp',
  'ArrowDown',
  'ArrowDownToLine',
  'Group',
  'Ungroup',
  'Crop',
  'FlipHorizontal2',
  'FlipVertical2',
  'WandSparkles',
  'Paintbrush',
  'Replace',
  'ExternalLink',
  'Link',
  'X',
  'Maximize2',
  'Minimize2',
  'Move',
  'Square',
  'Circle',
  'Triangle',
  'Star',
  'Spline',
  'Frame',
  'Upload',
  'CircleHelp',
  'GripVertical',
  'Settings2',
  'ScanLine',
  'SquareDashedMousePointer',
  'Grid2X2',
  'Minus',
];
const rules = names.map((name) => {
  if (!icons[name]) throw new Error(`Missing Lucide icon: ${name}`);
  const svg = renderToStaticMarkup(
    React.createElement(icons[name], { size: 20, strokeWidth: 1.7 })
  );
  return `.i-${name} { --icon: url("data:image/svg+xml,${encodeURIComponent(
    svg
  )}"); }`;
});
fs.writeFileSync(
  path.join(root, 'shared/styles/icons.css'),
  rules.join('\n') + '\n'
);
fs.copyFileSync(
  'packages/marketing/public/venues/arena.png',
  path.join(assets, 'arena.png')
);
fs.copyFileSync(
  'packages/brand-guidelines/icons/tile/48-dark.png',
  path.join(assets, 'turnbuckle.png')
);
fs.copyFileSync(
  'node_modules/lucide-react/LICENSE',
  path.join(assets, 'lucide-LICENSE')
);
QRCode.toFile(
  path.join(assets, 'sample-qr.png'),
  'https://example.com/cwa/tickets',
  {
    width: 220,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#100d0c', light: '#f7efdf' },
  }
);
