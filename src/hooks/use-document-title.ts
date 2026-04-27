/**
 * Set the page title for the lifetime of a route.
 * ─────────────────────────────────────────────────
 * Without this, every route shows the static <title> from index.html, which
 * hurts SEO, history menus, and screen-reader announcements after navigation.
 *
 * Usage (top of any page component):
 *   useDocumentTitle('Dashboard');
 *
 * The base suffix is appended automatically so titles read e.g.
 *   "Dashboard · ChainTrust"
 * matching standard SEO format. Pass `null` to inherit the index.html title
 * (used on Landing where the static title is the canonical one).
 */
import { useEffect } from 'react';

const BASE = 'ChainTrust';
const SEPARATOR = ' · ';

export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previous = document.title;
    const next = title ? `${title}${SEPARATOR}${BASE}` : 'ChainTrust — Verify Startups Against the Blockchain';
    document.title = next;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
