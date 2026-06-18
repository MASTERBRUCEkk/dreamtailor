"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    router.push("/onboarding");
  }

  return (
    <main className="max-w-md mx-auto px-6 py-20">
      <h1 className="text-2xl font-serif mb-6">Create your account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-amber-400 text-slate-950 font-semibold py-3 rounded-full"
        >
          {loading ? "Creating account..." : "Continue"}
        </button>
      </form>
      <p className="text-slate-400 text-sm mt-4">
        Already have an account? <a href="/login" className="text-amber-400 underline">Log in</a>
      </p>
    </main>
  );
}
