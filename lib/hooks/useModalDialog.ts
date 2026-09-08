"use client";

import { useCallback, useEffect, useRef } from "react";

const scrollLocks = new Set<symbol>();
let restoreScrollStyles: (() => void) | null = null;

function preserveStyles(style: CSSStyleDeclaration, properties: string[]) {
  const saved = properties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }));
  return () => {
    saved.forEach(({ property, value, priority }) => {
      if (value) style.setProperty(property, value, priority);
      else style.removeProperty(property);
    });
  };
}

function lockBodyScroll() {
  const token = Symbol("modal");
  if (scrollLocks.size === 0) {
    const root = document.documentElement;
    const before = root.getBoundingClientRect();
    const computed = getComputedStyle(root);
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;
    const paddingRight = parseFloat(computed.paddingRight) || 0;
    const restoreRoot = preserveStyles(root.style, [
      "overflow-x",
      "overflow-y",
      "scrollbar-gutter",
      "padding-left",
      "padding-right",
      "--modal-inset-left",
      "--modal-inset-right",
    ]);
    const restoreBody = preserveStyles(document.body.style, [
      "overflow-x",
      "overflow-y",
    ]);

    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("scrollbar-gutter", "auto", "important");
    document.body.style.setProperty("overflow", "hidden", "important");

    // Padding preserves the content width while keeping the viewport available
    // to the backdrop. A native reserved gutter cannot be covered by a backdrop.
    const after = root.getBoundingClientRect();
    const left = Math.max(0, before.left - after.left);
    const right = Math.max(0, after.right - before.right);
    if (left) {
      root.style.setProperty(
        "padding-left",
        `${paddingLeft + left}px`,
        "important",
      );
    }
    if (right) {
      root.style.setProperty(
        "padding-right",
        `${paddingRight + right}px`,
        "important",
      );
    }
    root.style.setProperty("--modal-inset-left", `${left}px`);
    root.style.setProperty("--modal-inset-right", `${right}px`);
    restoreScrollStyles = () => {
      restoreRoot();
      restoreBody();
    };
  }
  scrollLocks.add(token);

  return () => {
    if (scrollLocks.delete(token) && scrollLocks.size === 0) {
      restoreScrollStyles?.();
      restoreScrollStyles = null;
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
        dialog
          .querySelector<HTMLElement>("[data-autofocus]")
          ?.focus({ preventScroll: true });
        const unlockScroll = lockBodyScroll();
        releaseSession.current = () => {
          unlockScroll();
          if (
            previousFocus instanceof HTMLElement &&
            previousFocus.isConnected
          ) {
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
      Promise.allSettled(
        animations.map((animation) => animation.finished),
      ).then(() => {
        if (!cancelled) finishClose();
      });
    }
    return () => {
      cancelled = true;
    };
  }, [open, animateExit, finishClose]);

  return ref;
}
