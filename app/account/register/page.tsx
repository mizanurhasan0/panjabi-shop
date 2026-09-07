"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="container-ylw flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link href="/">
            <Image
              src="/images/logo.jpg"
              alt="YELLOW"
              width={160}
              height={56}
              className="mx-auto h-12 w-auto"
            />
          </Link>
        </div>

        <h1 className="mb-6 text-center text-[20px] font-normal uppercase tracking-[0.1em]">
          Create an Account
        </h1>

        {submitted ? (
          <div className="rounded border border-ylw-border p-6 text-center">
            <p className="text-[14px]">Account created! (Demo registration)</p>
            <Link href="/account/login" className="btn-outline mt-4 inline-flex">
              Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-[12px] uppercase tracking-[0.05em]">
                First Name *
              </label>
              <input
                type="text"
                required
                className="w-full border border-ylw-border px-3 py-2.5 text-[14px] outline-none focus:border-ylw-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] uppercase tracking-[0.05em]">
                Last Name *
              </label>
              <input
                type="text"
                required
                className="w-full border border-ylw-border px-3 py-2.5 text-[14px] outline-none focus:border-ylw-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] uppercase tracking-[0.05em]">
                Email Address *
              </label>
              <input
                type="email"
                required
                className="w-full border border-ylw-border px-3 py-2.5 text-[14px] outline-none focus:border-ylw-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] uppercase tracking-[0.05em]">
                Password *
              </label>
              <input
                type="password"
                required
                className="w-full border border-ylw-border px-3 py-2.5 text-[14px] outline-none focus:border-ylw-text"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Create Account
            </button>
            <p className="text-center text-[12px]">
              Already have an account?{" "}
              <Link href="/account/login" className="underline">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
