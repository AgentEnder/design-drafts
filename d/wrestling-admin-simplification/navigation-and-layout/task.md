# Navigation & Layout Overhaul

## Problem

The current app uses a top navbar with 4 dropdown menus (People, Events, Resources, Settings) plus a permission-gated System dropdown. This creates several issues:

- **Discoverability**: Users must hover/click dropdowns to see what's available
- **No persistent context**: Once you navigate to a page, there's no visual indicator of where you are in the app hierarchy
- **Flat structure**: 20+ top-level links crammed into 4 arbitrary groups
- **Mobile compromise**: The same nav collapses into a hamburger drawer, which is even harder to navigate

## Goal

Replace the current navigation with something that:

1. Shows the user where they are at all times
2. Groups features by workflow (not just entity type)
3. Scales cleanly from 5 to 50 features
4. Separates desktop and mobile navigation patterns
5. Preserves Cmd+K spotlight as the power-user escape hatch

## Design Variations

| File | Approach | Key Idea |
|------|----------|----------|
| `layout-idea-1.html` | **Collapsible Sidebar** | Persistent left sidebar with icon-only collapsed state, grouped by workflow |
| `layout-idea-2.html` | **Activity Rail + Content** | Thin icon rail (like VS Code/Slack) with flyout panels per section |
| `layout-idea-3.html` | **Top Nav + Contextual Sidebar** | Simplified top nav (3-4 items) with page-level sidebar for sub-navigation |
| `layout-idea-4.html` | **Hub & Spoke** | Minimal chrome, dashboard-centric with breadcrumb trails back to hub |
| `layout-idea-5.html` | **Tabbed Workspace** | Browser-like tab bar where each "workspace" (Events, People, etc.) is a persistent tab |

## Considerations

- Cmd+K spotlight must remain accessible from all layouts
- Future role-based access means some nav items will be hidden per user
- The nav should hint at "what to do next" not just "where to go"
- Mobile gets its own treatment (see mobile-experience todo)
