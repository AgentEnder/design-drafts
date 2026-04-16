# Dashboard & Home Experience

## Problem

The current dashboard shows statistics and lists (upcoming events, current champions) but doesn't guide the user toward their next action. For a non-techy audience managing a wrestling promotion:

- **No task awareness**: The dashboard doesn't know what needs attention
- **Generic overview**: Same dashboard for everyone regardless of what they need to do
- **No quick paths**: Common actions (edit next event, upload videos) require navigating away
- **No lifecycle context**: Doesn't reflect where you are in the event cycle (planning, day-of, post-event)

## Goal

Redesign the home/dashboard experience to:

1. Surface "what needs attention" — upcoming events missing details, unreleased media, unfilled roles
2. Provide quick-action paths to the top 3-5 most common tasks
3. Adapt to the user's current context (planning phase vs. event day vs. post-event)
4. Eventually support role-based views (owner sees everything, photographer sees upload queue)

## Design Variations

| File | Approach | Key Idea |
|------|----------|----------|
| `layout-idea-1.html` | **Task-Driven Home** | "Here's what needs your attention" — prioritized task list with inline actions |
| `layout-idea-2.html` | **Event-Centric Timeline** | Home organized around the event timeline: past → current → upcoming, with contextual actions per event |
| `layout-idea-3.html` | **Kanban Overview** | Columns for event lifecycle stages (Planning, Ready, Live, Wrap-Up) with event cards you can act on |
| `layout-idea-4.html` | **Command Center** | Minimal dashboard with a prominent search/action bar and recent activity feed |
| `layout-idea-5.html` | **Role-Aware Panels** | Configurable panels/widgets that show different content based on user role and current priorities |

## Considerations

- The dashboard should make someone feel oriented, not overwhelmed
- "What's next?" is more valuable than "here are your stats"
- Quick actions should cover: edit event, upload media, record results, manage roster
- Future role-based access means the dashboard needs to be composable
- Should work well on both desktop and mobile
