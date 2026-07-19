'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LONG_PRESS_MS = 400;
/** Movement past this before the timer fires means the user is scrolling. */
const SCROLL_CANCEL_PX = 8;

/**
 * Row reordering that works with both a mouse and a finger.
 *
 * HTML5 drag-and-drop never fires on touchscreens, so this uses pointer events
 * instead: a mouse drags from the grip handle immediately, while touch requires
 * a long press anywhere on the row. The press-and-hold delay is what lets a
 * normal swipe still scroll the page — we only claim the gesture once the user
 * has held still long enough to clearly mean "pick this up".
 */
export function useRowReorder(onReorder: (sourceId: number, targetId: number) => void) {
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const pendingIdRef = useRef<number | null>(null);
  const startYRef = useRef(0);
  const lastTargetRef = useRef<number | null>(null);
  // Kept in a ref too: the pointermove listener is bound once and would
  // otherwise close over a stale draggingId.
  const draggingRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingIdRef.current = null;
  }, []);

  const begin = useCallback((id: number) => {
    clearTimer();
    // A held input would otherwise keep focus and raise the mobile keyboard
    // and selection handles mid-drag.
    (document.activeElement as HTMLElement | null)?.blur?.();
    window.getSelection?.()?.removeAllRanges?.();
    draggingRef.current = id;
    lastTargetRef.current = id;
    setDraggingId(id);
    // Confirms the row was picked up, since there's no cursor on touch.
    navigator.vibrate?.(25);
  }, [clearTimer]);

  const end = useCallback(() => {
    clearTimer();
    draggingRef.current = null;
    lastTargetRef.current = null;
    setDraggingId(null);
  }, [clearTimer]);

  /** Grip handle: mouse picks up immediately, touch still long-presses. */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, id: number) => {
      if (e.pointerType === 'mouse') {
        e.preventDefault();
        begin(id);
        return;
      }
      pendingIdRef.current = id;
      startYRef.current = e.clientY;
      timerRef.current = window.setTimeout(() => begin(id), LONG_PRESS_MS);
    },
    [begin],
  );

  /** Anywhere on the row: touch-only long press, so mouse clicks stay normal. */
  const rowPointerDown = useCallback(
    (e: React.PointerEvent, id: number) => {
      if (e.pointerType === 'mouse') return;
      // Text inputs are deliberately NOT excluded: on a phone the row is mostly
      // inline-edit fields, so excluding them would leave almost nothing to
      // press. A tap still focuses the field; only a deliberate hold drags.
      // Buttons, selects and toggles are excluded — a hold on those is
      // ambiguous with pressing them.
      if ((e.target as HTMLElement).closest('button,select,a,textarea,[role="switch"]')) return;
      pendingIdRef.current = id;
      startYRef.current = e.clientY;
      timerRef.current = window.setTimeout(() => begin(id), LONG_PRESS_MS);
    },
    [begin],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Still waiting on the long press: a real move means they're scrolling.
      if (pendingIdRef.current !== null && draggingRef.current === null) {
        if (Math.abs(e.clientY - startYRef.current) > SCROLL_CANCEL_PX) clearTimer();
        return;
      }

      const dragging = draggingRef.current;
      if (dragging === null) return;

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const row = el?.closest<HTMLElement>('[data-company-id]');
      if (!row) return;

      const targetId = Number(row.dataset.companyId);
      if (!Number.isFinite(targetId)) return;
      if (targetId === dragging || targetId === lastTargetRef.current) return;

      lastTargetRef.current = targetId;
      onReorder(dragging, targetId);
    };

    const onUp = () => {
      if (draggingRef.current !== null) end();
      else clearTimer();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [onReorder, clearTimer, end]);

  // While a row is held, swallow touchmove so the page doesn't scroll under it.
  // Must be non-passive, which rules out doing this via React's onTouchMove.
  useEffect(() => {
    if (draggingId === null) return;
    const block = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', block, { passive: false });
    return () => document.removeEventListener('touchmove', block);
  }, [draggingId]);

  return { draggingId, handlePointerDown, rowPointerDown };
}
