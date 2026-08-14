"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
        setError("Email sau parola gresita.");
        return;
    }
    router.push("/");
    router.refresh();
}

return (
    <main className="min-h-screen flex items-center justify-center px-4">
    <form
    onSubmit={handleSubmit}
    className="w-full max-w-sm bg-[#151824] border border-gray-800 rounded-lg p-6 space-y-4"
    >
        <div className="text-center mb-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Blocked &middot; Running &middot; Next</div>
    <div className="flex items-center justify-center gap-2">
        <img src="/ruris-logo.png" alt="Ruris" className="h-9 w-auto" />
        <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">BRN</span>
        </div>
    <div className="text-xs text-gray-500 mt-1">Ruris</div>
        </div>

    {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-md">
    {error}
        </div>
     )}

<div>
    <label className="text-xs text-gray-500">Email</label>
    <input
    type="email"
    autoFocus
    required
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
    />
        </div>

<div>
        <label className="text-xs text-gray-500">Parola</label>
    <input
    type="password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
    />
        </div>

<button
    type="submit"
    disabled={loading}
    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-md"
    >
    {loading ? "Se conecteaza..." : "Conectare"}
</button>

<p className="text-xs text-gray-600 text-center">
    Nu ai cont? Cere unui admin sa te creeze din ecranul de administrare.
    </p>
    </form>
    </main>
);
}
