# Event Workflow Simplification

## Problem

Events are the core object in the app, and the current EventDetailPage has **10 tabs**:
Info, Timeline, Roster, Schedule, Equipment, Personnel, Financials, Results, Media, Social Preview.

This creates several issues:

- **Overwhelming first impression**: A new user sees 10 tabs and doesn't know where to start
- **No guided flow**: Creating an event requires visiting multiple tabs in no particular order
- **Context switching**: Editing an event means jumping between tabs, losing context each time
- **Common task buried**: The #1 between-events activity (editing upcoming events, uploading videos to recent events) requires navigating to the right tab

## Goal

Redesign the event management experience to:

1. Guide users through event setup with clear progression
2. Surface the most common actions (edit details, upload media) without tab-hunting
3. Reduce the number of distinct views/tabs for a single event
4. Make the event lifecycle visible (draft → scheduled → live → completed → archived)

## Design Variations

| File | Approach | Key Idea |
|------|----------|----------|
| `layout-idea-1.html` | **Wizard + Summary** | Step-by-step creation wizard, then a single summary page with inline editing sections |
| `layout-idea-2.html` | **Timeline View** | Event as a vertical timeline from creation to post-event, with sections expanding at the right lifecycle phase |
| `layout-idea-3.html` | **Card Dashboard** | Event detail as a dashboard of cards (like Trello board), each card is a concern (roster, schedule, etc.) |
| `layout-idea-4.html` | **Consolidated Tabs (3 max)** | Collapse 10 tabs into 3: Setup (info/timeline/roster/equipment), Show (schedule/personnel), Post-Event (results/media/financials) |
| `layout-idea-5.html` | **Sidebar Sections** | Keep everything on one scrollable page with a sticky sidebar TOC (like a docs page) |

## Considerations

- Event editing (not just creation) is the primary use case — design for iteration, not just initial setup
- "Upload videos after the event" is a top-3 workflow and should be frictionless
- Day-of dashboard is a separate mode and should remain distinct
- Events have a lifecycle — the UI should reflect what's relevant at each stage
