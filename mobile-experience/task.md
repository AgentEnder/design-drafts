# Mobile Experience Redesign

## Problem

The current app uses the same layout on mobile and desktop, with a hamburger menu replacing the navbar. This creates several issues:

- **Desktop patterns on mobile**: Tab bars, wide tables, and multi-column forms don't work on small screens
- **No task-oriented mobile UX**: Mobile users (especially day-of at events) need quick actions, not full admin views
- **Navigation depth**: Getting to a specific page on mobile requires: hamburger → dropdown group → item → tab
- **Tables are unusable**: Data tables (events list, roster list) are the wrong pattern for mobile

## Goal

Design a dedicated mobile experience that:

1. Prioritizes the most common mobile actions (day-of operations, quick edits, media upload)
2. Uses mobile-native patterns (bottom nav, cards, swipe gestures)
3. Reduces navigation depth to 2 taps max for common tasks
4. Makes media upload (photos/videos) a first-class mobile action
5. Provides a focused day-of experience for live events

## Design Variations

| File | Approach | Key Idea |
|------|----------|----------|
| `layout-idea-1.html` | **Bottom Tab Bar** | iOS-style bottom nav with 4-5 primary sections + FAB for quick actions |
| `layout-idea-2.html` | **Card Stack Home** | Home screen of actionable cards (upcoming event, recent uploads, quick actions) with swipe navigation |
| `layout-idea-3.html` | **Context-Aware Mode** | Auto-switches between "day-of mode" (at event), "planning mode" (between events), and "review mode" (post-event) |
| `layout-idea-4.html` | **Quick Actions Grid** | App-launcher style grid of big tap targets for common tasks, minimal chrome |
| `layout-idea-5.html` | **Split Experience** | Completely separate mobile app shell with only the 8-10 most common mobile actions exposed |

## Considerations

- Photographers and video people will primarily use mobile — upload UX is critical
- Day-of operations (staff check-in, results recording) happen on-site on phones
- Roster members accessing their own profiles will be on mobile
- WiFi at venues may be poor — consider offline-friendly patterns
- Camera integration for photo upload should feel native
