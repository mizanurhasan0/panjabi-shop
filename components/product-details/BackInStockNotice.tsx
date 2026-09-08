import { useState } from "react";

export function BackInStockNotice() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="mt-6 border border-ylw-border p-4">
      <p className="mb-2 text-[12px]">
        Leave your email and we will notify as soon as the product / variant
        is back in stock
      </p>
      {subscribed ? (
        <p className="text-[12px] text-green-700">
          Thanks for subscribing!
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSubscribed(true);
          }}
          className="flex gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Insert your email"
            className="flex-1 border border-ylw-border px-3 py-2 text-[12px]"
          />
          <button type="submit" className="btn-primary shrink-0">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
