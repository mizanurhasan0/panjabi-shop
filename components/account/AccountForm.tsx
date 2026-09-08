"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCatalog } from "@/lib/store/catalog";

const accountModes = {
  login: {
    title: "Sign In",
    submitLabel: "Sign In",
    successMessage: "Welcome back! (Demo login successful)",
    successHref: "/",
    successLabel: "Continue shopping",
    alternatePrompt: "Don't have an account?",
    alternateHref: "/account/register",
    alternateLabel: "Create account",
  },
  register: {
    title: "Create an Account",
    submitLabel: "Create Account",
    successMessage: "Account created! (Demo registration)",
    successHref: "/account/login",
    successLabel: "Sign In",
    alternatePrompt: "Already have an account?",
    alternateHref: "/account/login",
    alternateLabel: "Sign In",
  },
};

interface AccountFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
}

function AccountField({
  label,
  name,
  type = "text",
  autoComplete,
}: AccountFieldProps) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-[12px] uppercase tracking-[0.05em]"
      >
        {label} *
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full border border-ylw-border px-3 py-2.5 text-[14px] outline-none focus:border-ylw-text"
      />
    </div>
  );
}

export function AccountForm({ mode }: { mode: keyof typeof accountModes }) {
  const { settings } = useCatalog();
  const [submitted, setSubmitted] = useState(false);
  const content = accountModes[mode];
  const isRegistration = mode === "register";

  return (
    <div className="container-ylw flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link href="/">
            <Image
              src={settings.logo}
              alt={settings.name}
              width={160}
              height={56}
              className="mx-auto h-12 w-auto"
            />
          </Link>
        </div>

        <h1 className="mb-6 text-center text-[20px] font-normal uppercase tracking-[0.1em]">
          {content.title}
        </h1>

        {submitted ? (
          <div className="rounded border border-ylw-border p-6 text-center">
            <p className="text-[14px]">{content.successMessage}</p>
            <Link
              href={content.successHref}
              className="btn-outline mt-4 inline-flex"
            >
              {content.successLabel}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            {isRegistration && (
              <>
                <AccountField
                  label="First Name"
                  name="firstName"
                  autoComplete="given-name"
                />
                <AccountField
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                />
              </>
            )}
            <AccountField
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
            />
            <AccountField
              label="Password"
              name="password"
              type="password"
              autoComplete={
                isRegistration ? "new-password" : "current-password"
              }
            />
            <button type="submit" className="btn-primary w-full">
              {content.submitLabel}
            </button>
            {!isRegistration && (
              <p className="text-center text-[12px]">
                <Link href="#" className="underline">
                  Forgot your password?
                </Link>
              </p>
            )}
            <p className="text-center text-[12px]">
              {content.alternatePrompt}{" "}
              <Link href={content.alternateHref} className="underline">
                {content.alternateLabel}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
