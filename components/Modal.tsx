"use client";

import { useRef, type ReactNode } from "react";
import { useModalDialog } from "@/lib/hooks/useModalDialog";

interface ModalProps {
  id: string;
  label: string;
  open: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  animateExit?: boolean;
  unstyled?: boolean;
}

function isBackdropPointer(event: {
  target: EventTarget;
  currentTarget: HTMLDialogElement;
  clientX: number;
  clientY: number;
}) {
  if (event.target !== event.currentTarget) return false;
  const rect = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/** Native dialog supplies focus trapping, Escape handling and an inert background. */
export function Modal({
  id,
  label,
  open,
  onClose,
  className = "",
  children,
  animateExit = false,
  unstyled = false,
}: ModalProps) {
  const ref = useModalDialog(open, animateExit);
  const backdropPointerDown = useRef(false);

  return (
    <dialog
      ref={ref}
      id={id}
      aria-label={label}
      aria-modal="true"
      className={unstyled ? className : `site-modal ${className}`}
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
        backdropPointerDown.current = isBackdropPointer(event);
      }}
      onPointerCancel={() => {
        backdropPointerDown.current = false;
      }}
      onClick={(event) => {
        const startedOnBackdrop = backdropPointerDown.current;
        backdropPointerDown.current = false;
        if (startedOnBackdrop && isBackdropPointer(event)) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
