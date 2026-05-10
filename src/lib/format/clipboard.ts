/**
 * Clipboard helper — single source of truth for "copy text" UX.
 * ────────────────────────────────────────────────────────────────
 * `navigator.clipboard.writeText` can throw when the document is not
 * focused (Safari), or when the page is loaded from `file://`, or in
 * iframes without permission. This wrapper:
 *   - returns `boolean` instead of throwing, so callers can branch safely
 *   - falls back to a hidden `<textarea>` + `document.execCommand('copy')`
 *     for legacy environments where `navigator.clipboard` is unavailable
 *
 * Pair with the `useCopy` hook for "Copied!" UI feedback.
 */
import { useCallback, useState } from 'react';

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  // Modern path
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy */ }

  // Legacy path — works without the async clipboard permission, useful in
  // browsers that don't expose `navigator.clipboard` (e.g. older Safari or
  // file:// previews of the build).
  if (typeof document === 'undefined') return false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * `useCopy(timeoutMs)` — pair `copy(text)` with a `copied` boolean that
 * auto-clears after `timeoutMs` (default 1500ms). Same shape used in
 * EntityDossier, RiskAnalysisButton, LiveTestnetDemo so we can collapse
 * those one-offs onto this single hook later.
 */
export function useCopy(timeoutMs = 1500) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      if (ok) {
        setCopied(true);
        window.setTimeout(() => setCopied(false), timeoutMs);
      }
      return ok;
    },
    [timeoutMs],
  );

  return { copied, copy };
}
