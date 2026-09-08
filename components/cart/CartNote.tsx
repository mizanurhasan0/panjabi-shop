import { useState } from "react";
import { useCart } from "@/lib/store/cart";

export function CartNote() {
  const { note, setNote } = useCart();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="mb-4">
      <button
        type="button"
        aria-label="Order special instructions"
        aria-expanded={editing}
        aria-controls="cart-note-editor"
        className="mx-auto flex h-[58px] w-[90px] items-center justify-center border border-ylw-border"
        onClick={() => {
          setDraft(note);
          setEditing((current) => !current);
        }}
      >
        <svg
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          aria-hidden="true"
        >
          <path d="M7 4H3a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4" />
          <path d="M7 3h1V2a2 2 0 0 1 4 0v1h1v3H7Z" />
        </svg>
      </button>
      {editing && (
        <div id="cart-note-editor" className="mt-3">
          <label htmlFor="cart-note" className="mb-2 block">
            Order special instructions
          </label>
          <textarea
            id="cart-note"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full resize-y border border-ylw-border p-2"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="cart-action cart-action-dark"
              onClick={() => {
                setNote(draft);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="cart-action"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
