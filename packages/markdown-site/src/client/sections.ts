// Landing on a #anchor inside a collapsed section would scroll nowhere —
// expand every ancestor section first, then bring the target into view.
export function initSections(): void {
  const expandToHash = (): void => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    let section = target.closest('details');
    let opened = false;
    while (section) {
      if (!section.open) {
        section.open = true;
        opened = true;
      }
      section = section.parentElement
        ? section.parentElement.closest('details')
        : null;
    }
    if (opened) target.scrollIntoView();
  };
  window.addEventListener('hashchange', expandToHash);
  expandToHash();
}
