/**
 * Force the window document to the top after mobile nav navigations.
 * Next.js experimental scrollRestoration can otherwise reopen routes at an old
 * scroll offset; multiple ticks cover paint and restoration running slightly later.
 */
export function scrollToTopAfterMobileNav(): void {
  const toTop = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  toTop();
  queueMicrotask(toTop);
  requestAnimationFrame(() => {
    toTop();
    requestAnimationFrame(toTop);
  });
  setTimeout(toTop, 0);
  setTimeout(toTop, 100);
  setTimeout(toTop, 280);
}
