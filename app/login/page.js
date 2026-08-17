"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [signupDone, setSignupDone] = useState(false);

async function handleLogin(e) {
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

async function handleSignup(e) {
    e.preventDefault();
    if (!fullName.trim()) {
        setError("Introdu numele complet.");
        return;
    }
    setLoading(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);
    if (signUpError) {
        setError(signUpError.message);
        return;
    }
    setSignupDone(true);
}

function switchMode(next) {
    setMode(next);
    setError(null);
    setSignupDone(false);
}

if (signupDone) {
    return (
        <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#151824] border border-gray-800 rounded-lg p-6 space-y-4 text-center">
        <img src="/brn-logo.png" alt="BRN" className="h-16 w-auto mx-auto" />
        <h2 className="text-gray-100 font-semibold">Cont creat</h2>
    <p className="text-sm text-gray-400">
        Verifica-ti emailul ({email}) pentru a confirma contul. Dupa confirmare, un admin trebuie sa iti aprobe
    accesul inainte sa te poti conecta in aplicatie.
        </p>
    <button
    onClick={() => switchMode("login")}
    className="text-sm text-blue-400 hover:text-blue-300"
    >
        Inapoi la conectare
        </button>
        </div>
        </main>
    );
}

return (
    <main className="min-h-screen flex items-center justify-center px-4">
    <form
    onSubmit={mode === "login" ? handleLogin : handleSignup}
        className="w-full max-w-sm bg-[#151824] border border-gray-800 rounded-lg p-6 space-y-4"
    >
        <div className="text-center mb-4 flex flex-col items-center gap-2">
        <img src="/brn-logo.png" alt="BRN" className="h-16 w-auto" />
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Blocked &middot; Running &middot; Next</div>
        </div>

<div className="flex items-center bg-[#0f1117] border border-gray-700 rounded-md p-0.5 text-sm">
        <button
    type="button"
    onClick={() => switchMode("login")}
    className={`flex-1 px-2.5 py-1 rounded-md ${
        mode === "login" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
    }`}
>
Conectare
    </button>
<button
type="button"
onClick={() => switchMode("signup")}
className={`flex-1 px-2.5 py-1 rounded-md ${
    mode === "signup" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
}`}
>
Creeaza cont
    </button>
    </div>

{error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-md">
{error}
    </div>
 )}

{mode === "signup" && (
    <div>
    <label className="text-xs text-gray-500">Nume complet</label>
 <input
 type="text"
 autoFocus
 required
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
 />
     </div>
 )}

    <div>
<label className="text-xs text-gray-500">Email</label>
<input
type="email"
     autoFocus={mode === "login"}
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
minLength={mode === "signup" ? 6 : undefined}
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
{loading ? "Se proceseaza..." : mode === "login" ? "Conectare" : "Creeaza cont"}
</button>

{mode === "signup" && (
    <p className="text-xs text-gray-600 text-center">
    Contul tau va fi in asteptare pana cand un admin il aproba.
    </p>
 )}
</form>
    </main>
);
}
