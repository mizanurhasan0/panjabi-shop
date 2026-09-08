"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/admin/client";
import { AdminIcon, Alert, Button, Field } from "./ui";

export function LoginForm({ needsSetup, setupEnabled, shopName = "Panjabi" }: { needsSetup: boolean; setupEnabled: boolean; shopName?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/auth/${needsSetup ? "setup" : "login"}`, { method: "POST", body });
      router.replace("/admin");
      router.refresh();
    } catch (error) { setError(errorMessage(error)); setBusy(false); }
  }
  return <div className="admin-login-page"><section className="admin-login-story"><Link href="/" className="admin-login-brand"><span className="admin-brand-mark"><AdminIcon name="store" size={26}/></span>{shopName}</Link><div className="admin-login-story-content"><span className="admin-login-eyebrow">YOUR BUSINESS, SIMPLIFIED</span><h1>A little less admin.<br/>A lot more possibility.</h1><p>Your orders, your products, your progress.<br/>One thoughtful space to manage it all.</p><div className="admin-login-features"><span><AdminIcon name="orders"/>Track every order</span><span><AdminIcon name="products"/>Keep stock in check</span><span><AdminIcon name="trend"/>See your business grow</span></div></div><span className="admin-login-story-footer">Built around the way you work.</span><div className="admin-login-orbit admin-login-orbit-one" aria-hidden="true"/><div className="admin-login-orbit admin-login-orbit-two" aria-hidden="true"/></section><section className="admin-login-form-section"><Link className="admin-login-back" href="/"><span aria-hidden="true">←</span> Back to shop</Link><div className="admin-login-form-wrap"><span className="admin-login-lock"><AdminIcon name="shield" size={26}/></span><p className="admin-eyebrow">OWNER ACCESS</p><h2>{needsSetup ? "Make it your workspace" : "Welcome back"}</h2><p className="admin-login-description">{needsSetup ? "Create your owner account to start managing your shop." : "Sign in to see how your shop is doing today."}</p>{needsSetup && !setupEnabled ? <Alert tone="info">Owner setup has not been enabled. Add an ADMIN_SETUP_TOKEN to your server environment, then restart the app to create your account.</Alert> : <form onSubmit={submit} className="admin-stack">{error && <Alert>{error}</Alert>}{needsSetup && <Field label="Your name"><input className="admin-input" name="name" autoComplete="name" maxLength={100} placeholder="Owner name" required disabled={busy}/></Field>}<Field label="Email address"><input className="admin-input" type="email" name="email" autoComplete="username" placeholder="you@yourshop.com" maxLength={254} required disabled={busy}/></Field><Field label="Password" hint={needsSetup ? "Use at least 12 characters with a mix of letters, numbers, and symbols." : undefined}><span className="admin-password-field"><input className="admin-input" type={showPassword ? "text" : "password"} name="password" autoComplete={needsSetup ? "new-password" : "current-password"} placeholder={needsSetup ? "Create a strong password" : "Enter your password"} minLength={needsSetup ? 12 : undefined} maxLength={256} required disabled={busy}/><button type="button" className="admin-password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><AdminIcon name="eye" size={18}/></button></span></Field>{needsSetup && <Field label="Setup token" hint="Enter the setup token from your server environment."><input className="admin-input" name="setupToken" type="password" autoComplete="off" placeholder="Your one-time setup token" required disabled={busy}/></Field>}<Button type="submit" disabled={busy} className="admin-login-submit">{busy ? "Please wait…" : needsSetup ? "Create owner account" : "Sign in"}{!busy && <AdminIcon name="arrow" size={18}/>}</Button></form>}<p className="admin-login-security"><AdminIcon name="shield" size={15}/> Secure access for the store owner</p></div><p className="admin-login-footer">{shopName} · Shop manager</p></section></div>;
}
