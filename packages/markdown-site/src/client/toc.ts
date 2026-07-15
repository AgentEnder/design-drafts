// Scroll-spy: the active section is the last heading above the reading line
// (20% down the viewport). Recomputed whenever any heading crosses that line —
// intersection against a root shrunk to the top 20% fires exactly then — so a
// jump that skips headings entirely still lands on the right entry.
export function initToc(): void {
  const tocLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.toc a')
  );
  const linkById = new Map(
    tocLinks.map((link) => [
      (link.getAttribute('href') ?? '').slice(1),
      link,
    ])
  );
  const tocHeadings = Array.from(linkById.keys())
    .map((id) => document.getElementById(id))
    .filter((heading): heading is HTMLElement => heading !== null);
  let activeLink: HTMLAnchorElement | null = null;
  // A clicked entry stays active until the reader scrolls again — the last
  // sections of a page can never reach the reading line, so the computed
  // answer would immediately contradict the click.
  let lockedLink: HTMLAnchorElement | null = null;
  const setActive = (link: HTMLAnchorElement | null): void => {
    if (link === activeLink) return;
    if (activeLink) activeLink.removeAttribute('aria-current');
    activeLink = link;
    if (activeLink) activeLink.setAttribute('aria-current', 'true');
  };
  const updateActive = (): void => {
    if (lockedLink) {
      setActive(lockedLink);
      return;
    }
    // Skip headings inside a collapsed section so the spy tracks what the
    // reader can actually see. checkVisibility (not getClientRects) is
    // required: closed <details> content keeps layout boxes in Chrome for
    // find-in-page, so rects alone report hidden headings as visible.
    const visible = tocHeadings.filter((heading) =>
      heading.checkVisibility
        ? heading.checkVisibility()
        : heading.getClientRects().length > 0
    );
    if (!visible.length) {
      setActive(null);
      return;
    }
    const doc = document.documentElement;
    const atBottom =
      window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
    const line = window.innerHeight * 0.2;
    let current = atBottom ? visible[visible.length - 1] : visible[0];
    if (!atBottom) {
      for (const heading of visible) {
        if (heading.getBoundingClientRect().top > line) break;
        current = heading;
      }
    }
    setActive(linkById.get(current.id) ?? null);
  };
  for (const link of tocLinks) {
    link.addEventListener('click', () => {
      lockedLink = link;
      updateActive();
    });
  }
  const unlock = (): void => {
    lockedLink = null;
  };
  window.addEventListener('wheel', unlock, { passive: true });
  window.addEventListener('touchmove', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
  const observer = new IntersectionObserver(updateActive, {
    rootMargin: '0px 0px -80% 0px',
  });
  tocHeadings.forEach((heading) => observer.observe(heading));
  updateActive();
}
