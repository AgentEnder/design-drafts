# Brief: Artwork studio

> Captured from the existing user discussion and approved canvas-first direction
> on September 18, 2026. This is a review prototype, not a production editor.

## Audience

- **Who:** The user designing wrestling posters and composite artwork in the admin app.
- **Currently using:** The artwork editor reviewed in `../../ui-polish-plan.md`.
- **What they care about:** Aesthetically pleasing controls and less painful menus;
  retaining text, shapes, image editing, per-layer QR destinations, and tracking.

## Intent

- **Primary action:** Edit artwork.
- **Primary outcome:** Reach ordinary edits quickly without giving up canvas space.
- **Secondary action:** Save in-system or download an image.

## Constraints

- **Palette:** Existing semantic design-system colors, supporting light and dark.
- **Typography:** Existing product typography; readable compact controls. Artwork
  fonts remain separate from interface typography.
- **Layout shape:** User approved “Canvas-first studio (recommended)”.
- **Density:** Compact controls, with deeper options revealed when needed.
- **Must include:** Text, image, shape, QR and multi-selection inspectors; grouped
  layer menu; font and fill pickers; desktop/mobile; light/dark; save dropdown.
  Preserve separate content/Layer tabs, recent fonts, image scale percentages,
  independent QR destinations, logo options, and sole-selection menu rules.

## Reference inspiration

See `references/links.md`. The review and user's poster screenshots supply the
domain content and problems to correct, not an approved replacement layout.

## Must-not-look-likes

- The existing tall settings forms, oversized flat context menu, and overflowing toolbar.
- **#9 — Fake browser chrome:** Show the actual proposed workspace, not a tilted
  screenshot inside decorative browser framing.
- **#2 — Glassmorphism and neon glow:** Use opaque working surfaces and clear focus.

Defaults the user is consciously embracing:

- A canvas-first studio with compact controls and progressive disclosure.

## Voice

- **Adjectives:** Clean and compact, from the approved direction. Direct labels
  such as “Layers”, “Text”, “Save poster”, and “Download image” follow the task.
- **Off-limits vocabulary:** No new marketing language in the editor chrome.
- **Reference copy:** “the menu structures and such make it kinda painful to actually use”.

## Open questions

- Do the proposed navigation, density, and menus feel right in the mockups?
- Does the mobile property sheet leave enough usable canvas space?
- These questions are the approval checkpoint, not prerequisites for drawing it.

## Prototype decisions for review

One workflow-state axis: text, image, QR, multiple layers, and shape. Text loads
first. Theme toggling and responsive resizing apply to the same design, not fake
design alternatives. The sample CWA Battle Royal poster uses recreated editable
text and a repository-owned arena image; it is not a claim to have recovered text
from the user's imported bitmap. All document changes stay in memory. No upload,
tracking link, save, or production database calls are made.
