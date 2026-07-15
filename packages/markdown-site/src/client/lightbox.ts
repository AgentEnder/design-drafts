// Click a content image to see it full size in an overlay. Delegated, so it
// costs nothing on pages without images and needs no markup baked into the
// rendered markdown.
export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.lightbox');
  const image = dialog?.querySelector<HTMLImageElement>('.lightbox-image');
  const caption = dialog?.querySelector<HTMLElement>('.lightbox-caption');
  const body = document.querySelector('.markdown-body');
  if (!dialog || !image || !caption || !body) return;

  // Only now that the lightbox is wired do images advertise themselves as
  // clickable — a no-JS reader never gets a zoom cursor that does nothing.
  body.classList.add('lightbox-ready');

  const open = (source: HTMLImageElement): void => {
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    caption.textContent = source.alt;
    // An image with no alt gets no caption strip, rather than an empty one.
    caption.hidden = !source.alt;
    dialog.showModal();
  };

  body.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    // An image the author wrapped in a link is a navigation affordance — let
    // the link win rather than hijacking the click.
    if (target.closest('a')) return;
    open(target);
  });

  // Backdrop clicks land on the dialog element itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  // Clicking the enlarged image closes too — the whole overlay is a dismiss
  // target, which is what people expect from a lightbox.
  image.addEventListener('click', () => dialog.close());
  // Freeing the src stops a large image from sitting decoded in memory.
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
  });
}
