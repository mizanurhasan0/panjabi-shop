"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  id: string;
  label: string;
  open: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  animateExit?: boolean;
}

let openModalCount = 0;
let originalBodyOverflow = "";

/** Native dialog supplies focus trapping, Escape handling and an inert background. */
export function Modal({
  id,
  label,
  open,
  onClose,
  className = "",
  children,
  animateExit = false,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPointerDown = useRef(false);

  const releaseSession = useRef<(() => void) | null>(null);

  const finishClose = useCallback(() => {
    const dialog = ref.current;
    if (dialog?.open) dialog.close();
    releaseSession.current?.();
    releaseSession.current = null;
  }, []);

  // Unmounts must release focus and scrolling even during an interrupted exit.
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
        if (openModalCount === 0)
          originalBodyOverflow = document.body.style.overflow;
        openModalCount += 1;
        document.body.style.overflow = "hidden";
        releaseSession.current = () => {
          openModalCount -= 1;
          if (openModalCount === 0)
            document.body.style.overflow = originalBodyOverflow;
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

    // Keep the native dialog in the top layer until CSS finishes its exit.
    // Reopening cancels this completion, allowing the transition to reverse.
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

  return (
    <dialog
      ref={ref}
      id={id}
      aria-label={label}
      aria-modal="true"
      className={`site-modal ${className}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        backdropPointerDown.current =
          event.target === event.currentTarget &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom);
      }}
      onClick={(event) => {
        if (
          !backdropPointerDown.current ||
          event.target !== event.currentTarget
        )
          return;
        backdropPointerDown.current = false;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      {children}
    </dialog>
  );
}
