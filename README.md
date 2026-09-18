# Artwork studio review

Open [the local mockup](http://localhost:4321/). Use the top-left selector for Text, Image, QR slot, Multi-selection, and Shape. The Dark button changes the theme. Resize the browser for the mobile property sheet.

This checkpoint needs approval of the layout, control hierarchy, menus, and mobile behavior. Production implementation has not started.

## Try these

- Select a layer or use the review-state selector. Open its `…` menu; modifier-click adds to the selection.
- On Text, open the font picker, search or filter by source, then try the fill swatch. Advanced effects expand below the basic controls.
- On Image, compare the Image and Layer tabs. The Layer tab shows percentage scaling and opacity/blending.
- On QR slot, review destination/tracking, appearance, and center-artwork settings.
- Open Add, Canvas dimensions, and Save options → Download image.
- On mobile, expand the property sheet using its top handle. Canvas hides it in one tap.

Click **Design review** to reveal the draft toolbar and annotation controls. It starts hidden so it does not cover the editor's navigation.

## Review questions

1. Is the canvas/panel balance and control density right?
2. Are Layers, Add, Canvas settings, and Save/Download where you expect them?
3. Does the inspector expose enough without reopening the long-form problem?
4. Does the mobile sheet feel usable, including its expanded and canvas-only states?

## Prototype scope

Selection, menu navigation, local layer-list actions, theme changes, text/fill previews, font search, and mobile panels are interactive. Other controls demonstrate placement and explain their preview status. They do not simulate the complete rendering or undo engines. Save, upload, download, tracking, image processing, and group/transform operations do not call production services. Reload resets the sample.

The poster is a review composition using the user's CWA Battle Royal content and a repository arena asset. Its QR uses an example.com destination. Web-font examples use local fallback faces; no font files are downloaded. Lucide supplies the icons; its license is in `shared/assets/lucide-LICENSE`.

## Baseline task map

| Task                   | Existing UI friction                                   | Proposed route                                             | Baseline evidence      |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | ---------------------- |
| Style text             | Color follows fonts, path controls, and effects        | Select → Text → Typography / Fill                          | Live review and source |
| Replace/crop an image  | Shadow and crop-policy controls precede common actions | Select → Image → Replace / Crop                            | Source inspection      |
| Configure a QR slot    | Long style form mixes several concerns                 | Select → QR slot → Destination, Appearance, Center artwork | Source inspection      |
| Arrange several layers | Basic alignment competes with advanced commands        | Multi-select → Selection → Align / Distribute              | Source inspection      |
| Reorder a layer        | Tall flat menu with repeated disabled explanations     | Layer menu → Arrange section                               | Live menu review       |
| Save/download          | “Save as” selects a format instead of saving           | Save poster; dropdown → Download image                     | Source inspection      |

Baseline screenshots and the mockup captures are in `output/playwright/artwork-polish-review/`. See [verification](./verification.md) for the checks performed.

## Local preview

From the repository root, restart the preview with:

```sh
design-drafts preview docs/plans/2026-09-17-match-poster-editor/ui-mockups --port 4321 --no-open
```

`prepare-assets.cjs` regenerates the local sample assets. `design-drafts.config.json` declares five standalone pages; `index.html` opens the text state. Nothing was published.

Optional publishing, only after a separate request:

Next: run `design-drafts` from this directory to publish a preview branch.
