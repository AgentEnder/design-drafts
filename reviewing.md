# Reviewing

Every published page carries two single-file scripts. Both are
framework-agnostic and drop in with a `<script>` tag.

## The toolbar

A bar at the bottom of the viewport with one dropdown per axis. It reads the
draft's manifest, shows where the current page sits, and disables any choice
with no page behind it. Picking a different choice navigates to the matching
file and keeps the querystring.

| Action               | How                        |
| -------------------- | -------------------------- |
| Hide for one load    | `?toolbar=0`               |
| Force it to show     | `?toolbar=1`               |
| Hide for the session | Click ×, or `Cmd/Ctrl + .` |

## Annotations

Activate the overlay with `?annotate=1` or the toolbar's toggle. While it is on,
the page underneath is inert: a click picks an element to comment on rather than
following a link.

Click anything to open a composer. Highlight a run of text first and the comment
anchors to those words instead of their container, tinting them once saved.
`Cmd + Enter` (`Ctrl + Enter` off the Mac) saves the note. `Escape` backs out.

The panel lists every annotation across every page of the draft, tabbed by page.
Reveal scrolls to what a note points at. Edit and Delete work per entry, and
Clear takes the whole draft after a confirming second click.

**Export** renders every annotation on every page as one markdown document and
copies it to the clipboard, ready to paste to an agent. Where the clipboard API
is unavailable, such as a preview served over plain HTTP on a LAN address, it
downloads `feedback.md` instead.

Note: annotations are stored in `localStorage`, which any script on the page can
read. Do not capture sensitive feedback through it.

## The index

The index at `/design-drafts/d/` lists every live draft, with a link to the
pull request behind it where there is one. It is rebuilt on every deploy, and the compare
view puts two drafts side by side.
