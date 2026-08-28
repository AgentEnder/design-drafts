# Entity Page Simplification

## Problem

Every entity type (Roster, Championships, Stables, Venues, Equipment, Match Types, etc.) follows the same pattern: List Page → Detail Page with Tabs. This creates:

- **Repetitive navigation**: Every entity requires leaving the list, going to detail, picking a tab
- **Too many separate pages**: Roster, Championships, Stables, Venues, Equipment, Match Types, Licenses, Sponsorships, Staff Roles — that's 9+ list pages
- **Tab overload on detail pages**: Roster has 3 tabs, Championships 4, Stables 4, etc.
- **Disconnected relationships**: Related entities (Personnel ↔ Roster, Equipment ↔ Events) live on separate pages

## Goal

Simplify how users interact with entity management:

1. Reduce the number of distinct list pages the user needs to visit
2. Allow common edits without leaving the list view
3. Show entity relationships in context (not on separate pages)
4. Make "I just need to change one field" a 1-click action, not a 3-page journey

## Design Variations

| File | Approach | Key Idea |
|------|----------|----------|
| `layout-idea-1.html` | **Master-Detail Split** | List on left, detail panel on right — no page navigation needed |
| `layout-idea-2.html` | **Inline Expansion** | List rows expand in-place to show detail/edit form (accordion style) |
| `layout-idea-3.html` | **Grouped Hub** | Single "People" page with sub-sections for Roster, Staff, Stables — unified search across all |
| `layout-idea-4.html` | **Slide-Over Panels** | List stays visible, detail slides in from the right as an overlay panel |
| `layout-idea-5.html` | **Card Grid + Quick Edit** | Replace tables with card grids, click card for quick-edit modal, "Full Edit" for deep changes |

## Considerations

- Some entities are simple (Venues, Match Types) and some are complex (Personnel, Championships with lineage)
- The pattern should scale from 5-field entities to 30-field entities
- Relationships between entities should be navigable in context
- Bulk operations (assign roster to event) should remain efficient
- Search/filter is critical — the Cmd+K spotlight already handles global search
