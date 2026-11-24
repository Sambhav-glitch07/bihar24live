
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginForm({
  ownerError,
  setupMissing,
}: {
  ownerError: boolean;
  setupMissing: boolean;
}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setStatus("Connecting to secure newsroom login...");

    try {
      const supabase = createClient();

      // Step 1: Authenticate
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        throw new Error("Sign-in failed: " + signInError.message);
      }

      if (!data.user || !data.session) {
        throw new Error("Authentication succeeded without a valid session.");
      }

      setStatus("Verifying owner permissions...");

      // Step 2: Verify the owner's profile
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        throw new Error(
          "Profile verification failed: " + profileError.message
        );
      }

      if (!profile || profile.role !== "owner") {
        await supabase.auth.signOut();
        throw new Error(
          "Owner profile not found or role is not owner."
        );
      }

      setStatus("Owner verified. Opening newsroom...");

      // Step 3: Confirm browser session exists
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          "Login session could not be confirmed. Please try again."
        );
      }

      // Step 4: Navigate to dashboard
      window.location.assign("/admin");

    } catch (e) {
      console.error("BIHAR24LIVE LOGIN ERROR:", e);

      setError(
        e instanceof Error ? e.message : "Unexpected login error."
      );

      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-md items-center px-4 py-12">
      <form
        onSubmit={submit}
        className="w-full border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <p className="text-xs font-bold tracking-widest text-red-700">
          PRIVATE NEWSROOM
        </p>

        <h1 className="mt-2 text-2xl font-black">
          Owner login
        </h1>

        <p className="mt-2 text-sm text-neutral-600">
          Sign in to manage BIHAR 24 LIVE.
        </p>

        {ownerError && (
          <p className="mt-4 bg-red-50 p-3 text-sm text-red-800">
            This account is not authorized.
          </p>
        )}

        {setupMissing && (
          <p className="mt-4 bg-amber-50 p-3 text-sm text-amber-900">
            Supabase environment is not configured.
          </p>
        )}

        <label className="mt-5 block text-sm font-semibold">
          Email
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-neutral-300 p-3"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-neutral-300 p-3"
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 break-words bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        {status && (
          <p
            role="status"
            className="mt-4 text-sm text-neutral-600"
          >
            {status}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full bg-red-700 p-3 font-bold text-white disabled:opacity-60"
        >
          {busy ? "Please wait..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
