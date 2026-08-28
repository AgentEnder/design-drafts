# Fleet Ops Console — Brief

## Audience

On-call SREs at a mid-size infrastructure team. They live in this tool during
incidents and ignore it the rest of the time. The console is open in a browser
tab next to their terminal; it does not need to be the prettiest thing on
their screen, but it cannot waste their attention.

## Job to be done

When a page fires, the SRE wants to know, in this order:

1. Which incident is paging? Is it still active?
2. Which hosts are involved?
3. What changed recently (deploys, config flips)?

When no page is active, the same console is used for spot checks: "is fleet
healthy", "did the last deploy land cleanly", "what's the build queue
looking like".

## Open questions for this draft

- **Density vs. focus.** Is the right default a wide host table (everything
  at once) or an incident-first card view (today's drama only)? Existing
  users skew toward the table; new hires skew toward the cards.
- **Sidebar vs. top nav.** Sidebar gives us a place to pin tenant context,
  but on small laptop screens the rail eats horizontal space the host table
  could use.
- **Theme.** Light-by-default or dark-by-default? On-call work is
  disproportionately at night.

## Out of scope

- Account/billing screens
- Mobile layout (this tool is desktop-only by policy)
- Editing incidents — this draft is read-only
