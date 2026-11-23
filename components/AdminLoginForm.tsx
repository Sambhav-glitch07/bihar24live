"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginForm({ ownerError, setupMissing }: { ownerError: boolean; setupMissing: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) throw new Error("Invalid email or password.");
      const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profileError || profile?.role !== "owner") { await supabase.auth.signOut(); throw new Error("This account is not authorized as the site owner."); }
      router.replace("/admin"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Login failed."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto flex min-h-[65vh] max-w-md items-center px-4 py-12"><form onSubmit={submit} className="w-full border border-neutral-200 p-6 shadow-sm"><p className="text-xs font-bold tracking-widest text-red-700">PRIVATE NEWSROOM</p><h1 className="mt-2 text-2xl font-black">Owner login</h1><p className="mt-2 text-sm text-neutral-600">Sign in to manage BIHAR 24 LIVE.</p>{ownerError && <p className="mt-4 bg-red-50 p-3 text-sm text-red-800">This account is not authorized.</p>}{setupMissing && <p className="mt-4 bg-amber-50 p-3 text-sm text-amber-900">Supabase environment is not configured.</p>}<label className="mt-5 block text-sm font-semibold">Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full border border-neutral-300 p-3" /></label><label className="mt-4 block text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border border-neutral-300 p-3" /></label>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={busy} className="mt-6 w-full bg-red-700 p-3 font-bold text-white disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
