"use client";

import { useCallback, useEffect, useRef } from "react";

const scrollLocks = new Set<symbol>();
let originalBodyOverflow = "";

function lockBodyScroll() {
  const token = Symbol("modal");
  if (scrollLocks.size === 0) {
    originalBodyOverflow = document.body.style.overflow;
  }
  scrollLocks.add(token);
  document.body.style.overflow = "hidden";

  return () => {
    if (scrollLocks.delete(token) && scrollLocks.size === 0) {
      document.body.style.overflow = originalBodyOverflow;
    }
  };
}

/** Keeps native focus management and scroll locking active through exit animations. */
export function useModalDialog(open: boolean, animateExit: boolean) {
  const ref = useRef<HTMLDialogElement>(null);
  const releaseSession = useRef<(() => void) | null>(null);

  const finishClose = useCallback(() => {
    const dialog = ref.current;
    if (dialog?.open) dialog.close();
    releaseSession.current?.();
    releaseSession.current = null;
  }, []);

  // Unmounting during an exit must release the same session as a normal close.
  useEffect(() => () => finishClose(), [finishClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        const previousFocus = document.activeElement;
        dialog.dataset.state = "closed";
        dialog.showModal();
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
        const unlockScroll = lockBodyScroll();
        releaseSession.current = () => {
          unlockScroll();
          if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
            previousFocus.focus({ preventScroll: true });
          }
        };
        // Establish the offscreen position before starting the CSS transition.
        if (animateExit) dialog.getBoundingClientRect();
      }
      dialog.dataset.state = "open";
      return;
    }

    if (!dialog.open) return;
    dialog.dataset.state = "closing";
    if (!animateExit) {
      finishClose();
      return;
    }

    // Reopening cancels completion, allowing the transition to reverse.
    let cancelled = false;
    const animations = dialog.getAnimations();
    if (animations.length === 0) {
      finishClose();
    } else {
      Promise.allSettled(animations.map((animation) => animation.finished)).then(
        () => {
          if (!cancelled) finishClose();
        },
      );
    }
    return () => {
      cancelled = true;
    };
  }, [open, animateExit, finishClose]);

  return ref;
}
