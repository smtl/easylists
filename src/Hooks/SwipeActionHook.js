import { useRef, useState } from "react";

const MAX_DRAG = 88;
const THRESHOLD = 56;
const AXIS_LOCK_PX = 8;
const LONG_PRESS_MS = 550;

// A one-directional swipe gesture on a list row: dragging past THRESHOLD in
// `direction` (1 = right, -1 = left) fires onCommit; releasing earlier snaps
// back. A small axis lock lets an accidental drag that's mostly vertical
// fall through to the page's normal scroll instead of hijacking it.
//
// When onLongPress is given, holding still (under the axis-lock jitter) for
// LONG_PRESS_MS arms a long press; releasing while armed fires onLongPress
// instead of a swipe. Firing on pointerup rather than on the timer itself
// keeps the call inside a real user gesture, so e.g. window.open isn't
// treated as an unsolicited popup.
export function useSwipeAction(direction, onCommit, onLongPress) {
  const [drag, setDrag] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [pressing, setPressing] = useState(false);
  const pointerId = useRef(null);
  const start = useRef({ x: 0, y: 0 });
  const locked = useRef(null);
  const didSwipe = useRef(false);
  const longPressTimer = useRef(null);
  const armed = useRef(false);

  const clearLongPress = () => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    armed.current = false;
    setPressing(false);
  };

  const reset = () => {
    pointerId.current = null;
    locked.current = null;
    setSwiping(false);
    setDrag(0);
    clearLongPress();
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerId.current = event.pointerId;
    start.current = { x: event.clientX, y: event.clientY };
    locked.current = null;

    if (onLongPress) {
      setPressing(true);
      longPressTimer.current = setTimeout(() => {
        armed.current = true;
      }, LONG_PRESS_MS);
    }
  };

  const onPointerMove = (event) => {
    if (pointerId.current !== event.pointerId) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;

    if (locked.current === null) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      clearLongPress();
      if (Math.abs(dx) <= Math.abs(dy)) {
        pointerId.current = null;
        return;
      }
      locked.current = true;
      didSwipe.current = true;
      event.currentTarget.setPointerCapture(pointerId.current);
      setSwiping(true);
    }

    const clamped =
      direction > 0
        ? Math.max(0, Math.min(dx, MAX_DRAG))
        : Math.min(0, Math.max(dx, -MAX_DRAG));
    setDrag(clamped);
  };

  const onPointerUp = (event) => {
    if (pointerId.current !== event.pointerId) return;
    if (armed.current) {
      didSwipe.current = true;
      onLongPress();
    } else if (locked.current && Math.abs(drag) >= THRESHOLD) {
      onCommit();
    }
    reset();
  };

  const onPointerCancel = () => reset();

  // A drag or long press that acted shouldn't also fire the tap handlers beneath it
  const onClickCapture = (event) => {
    if (didSwipe.current) {
      didSwipe.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  // Suppress the native long-press context menu / text-selection callout
  const onContextMenu = (event) => {
    if (onLongPress) event.preventDefault();
  };

  return {
    drag,
    progress: Math.min(1, Math.abs(drag) / THRESHOLD),
    swiping,
    pressing,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
      onContextMenu,
    },
  };
}
