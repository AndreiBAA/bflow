"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const ROLE_LABELS = { admin: "Admin", manager: "Manager", member: "Membru" };

export default function AdminPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [allowed, setAllowed] = useState(false);

const [profiles, setProfiles] = useState([]);
    const [projects, setProjects] = useState([]);
    const [projectManagers, setProjectManagers] = useState([]);
    const [taskCount, setTaskCount] = useState(0);
    const [pendingRequestCount, setPendingRequestCount] = useState(0);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [search, setSearch] = useState("");
    const [busyId, setBusyId] = useState(null);

const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "member" });
    const [creating, setCreating] = useState(false);

useEffect(() => {
    async function check() {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) {
            router.push("/login");
            return;
        }
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
        if (!profile || profile.role !== "admin") {
            router.push("/");
            return;
        }
        setAllowed(true);
        setReady(true);
    }
    check();
}, [router]);

const loadData = useCallback(async () => {
    const [
        { data: profilesData },
        { data: projectsData },
        { data: pmData },
        { count: tasksTotal },
        { count: pendingTotal },
        ] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: true }),
        supabase.from("projects").select("*").order("position", { ascending: true }),
        supabase.from("project_managers").select("*"),
        supabase.from("tasks").select("id", { count: "exact", head: true }),
        supabase.from("change_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        ]);
    setProfiles(profilesData || []);
    setProjects(projectsData || []);
    setProjectManagers(pmData || []);
    setTaskCount(tasksTotal || 0);
    setPendingRequestCount(pendingTotal || 0);
}, []);

useEffect(() => {
    if (allowed) loadData();
}, [allowed, loadData]);

const projectOptions = (() => {
    const byParent = {};
    for (const p of projects) {
        const key = p.parent_id || "root";
        if (!byParent[key]) byParent[key] = [];
        byParent[key].push(p);
    }
    Object.values(byParent).forEach((arr) => arr.sort((a, b) => a.position - b.position));
    const out = [];
    function walk(parentKey, depth) {
        for (const p of byParent[parentKey] || []) {
            out.push({ id: p.id, name: p.name, depth });
            walk(p.id, depth + 1);
        }
    }
    walk("root", 0);
    return out;
})();

const pendingUsers = profiles.filter((p) => p.role === "pending");
    const activeUsers = profiles.filter((p) => p.role !== "pending");
    const filteredActiveUsers = activeUsers.filter((p) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (p.full_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
    });

const roleCounts = activeUsers.reduce(
    (acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
    },
    { admin: 0, manager: 0, member: 0 }
    );

async function handleCreateUser(e) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setInfo(null);
    try {
        const res = await fetch("/api/admin/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Eroare la creare user.");
            return;
        }
        setInfo(`User creat: ${form.email}. Trimite-i emailul si parola direct.`);
        setForm({ full_name: "", email: "", password: "", role: "member" });
        await loadData();
    } finally {
        setCreating(false);
    }
}

async function handleRoleChange(profileId, role) {
    await supabase.from("profiles").update({ role }).eq("id", profileId);
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role } : p)));
}

async function handleNameSave(profileId, name) {
    setBusyId(profileId);
    await supabase.from("profiles").update({ full_name: name }).eq("id", profileId);
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, full_name: name } : p)));
    setBusyId(null);
}

async function handleApproveUser(profileId) {
    setBusyId(profileId);
    setError(null);
    await handleRoleChange(profileId, "member");
    setBusyId(null);
    setInfo("Cont aprobat. Userul poate accesa aplicatia ca membru.");
}

async function handleDeleteUser(profileId, label) {
    if (!confirm(`Sigur vrei sa stergi definitiv userul "${label}"? Aceasta actiune nu poate fi anulata.`)) return;
    setBusyId(profileId);
    setError(null);
    try {
        const res = await fetch("/api/admin/delete-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: profileId }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Eroare la stergerea userului.");
            return;
        }
        setProfiles((prev) => prev.filter((p) => p.id !== profileId));
        setProjectManagers((prev) => prev.filter((pm) => pm.user_id !== profileId));
        setInfo(`Userul "${label}" a fost sters.`);
    } finally {
        setBusyId(null);
    }
}

async function toggleProjectManager(profileId, projectId, isManaging) {
    if (isManaging) {
        await supabase.from("project_managers").delete().eq("project_id", projectId).eq("user_id", profileId);
        setProjectManagers((prev) => prev.filter((pm) => !(pm.project_id === projectId && pm.user_id === profileId)));
    } else {
        await supabase.from("project_managers").insert({ project_id: projectId, user_id: profileId });
        setProjectManagers((prev) => [...prev, { project_id: projectId, user_id: profileId }]);
    }
}

if (!ready) {
    return (
        <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Se verifica...</div>
        </main>
    );
}

return (
    <main className="min-h-screen px-6 py-6">
    <div className="flex items-center justify-between mb-6">
    <div>
    <h1 className="text-xl font-semibold text-gray-100">Administrare useri</h1>
    <p className="text-xs text-gray-500 mt-1">Creeaza useri, aproba cereri, seteaza roluri, asigneaza manageri pe proiecte.</p>
    </div>
    <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
    Inapoi la board
    </Link>
    </div>

    {error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-2 rounded-md mb-4">{error}</div>
     )}
    {info && (
        <div className="bg-blue-950 border border-blue-800 text-blue-300 text-sm px-4 py-2 rounded-md mb-4">{info}</div>
     )}

<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
{[
    ["Admini", roleCounts.admin],
    ["Manageri", roleCounts.manager],
    ["Membri", roleCounts.member],
    ["In asteptare", pendingUsers.length],
    ["Proiecte", projects.length],
    ["Task-uri", taskCount],
    ["Cereri aprobare", pendingRequestCount],
    ].map(([label, value]) => (
        <div key={label} className="bg-[#151824] border border-gray-800 rounded-lg px-3 py-2.5">
        <div className="text-xl font-semibold text-gray-100">{value}</div>
          <div className="text-[11px] text-gray-500">{label}</div>
        </div>
          ))}
    </div>

    {pendingUsers.length > 0 && (
        <div className="bg-[#151824] border border-orange-800/60 rounded-lg p-4 mb-6">
        <h2 className="text-sm font-medium text-orange-300 mb-3">
        Cereri de inregistrare in asteptare ({pendingUsers.length})
        </h2>
     <div className="space-y-2">
    {pendingUsers.map((p) => (
        <div
                      key={p.id}
    className="flex items-center justify-between gap-3 border border-gray-800 rounded-md p-3"
    >
        <div>
        <div className="text-sm text-gray-200">{p.full_name || "(fara nume)"}</div>
<div className="text-xs text-gray-500">{p.email}</div>
    </div>
<div className="flex items-center gap-2">
    <button
disabled={busyId === p.id}
    onClick={() => handleApproveUser(p.id)}
className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-md"
>
    Aproba
    </button>
<button
disabled={busyId === p.id}
    onClick={() => handleDeleteUser(p.id, p.full_name || p.email)}
className="text-xs bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-md"
>
    Respinge
    </button>
    </div>
    </div>
))}
    </div>
    </div>
)}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-1">
    <div className="bg-[#151824] border border-gray-800 rounded-lg p-4">
    <h2 className="text-sm font-medium text-gray-200 mb-3">User nou</h2>
<form onSubmit={handleCreateUser} className="space-y-3">
    <div>
    <label className="text-xs text-gray-500">Nume complet</label>
<input
value={form.full_name}
onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
    </div>
<div>
    <label className="text-xs text-gray-500">Email</label>
<input
type="email"
required
value={form.email}
onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
    </div>
<div>
    <label className="text-xs text-gray-500">Parola temporara</label>
<input
required
minLength={6}
value={form.password}
onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
    </div>
<div>
    <label className="text-xs text-gray-500">Rol</label>
<select
value={form.role}
onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
>
    <option value="member">Membru</option>
<option value="manager">Manager</option>
<option value="admin">Admin</option>
    </select>
    </div>
<button
type="submit"
disabled={creating}
className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium px-3 py-2 rounded-md"
>
{creating ? "Se creeaza..." : "Creeaza user"}
</button>
    </form>
    </div>
    </div>

<div className="lg:col-span-2">
    <div className="bg-[#151824] border border-gray-800 rounded-lg p-4">
    <div className="flex items-center justify-between gap-3 mb-3">
    <h2 className="text-sm font-medium text-gray-200">Useri ({filteredActiveUsers.length}/{activeUsers.length})</h2>
<input
value={search}
onChange={(e) => setSearch(e.target.value)}
placeholder="Cauta nume sau email..."
className="bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 w-48"
/>
    </div>
<div className="space-y-3">
{filteredActiveUsers.map((p) => {
    const managed = projectManagers.filter((pm) => pm.user_id === p.id).map((pm) => pm.project_id);
    return (
        <div key={p.id} className="border border-gray-800 rounded-md p-3">
    <div className="flex items-center justify-between gap-3">
    <div className="flex-1 min-w-0">
    <input
defaultValue={p.full_name || ""}
placeholder="(fara nume)"
onBlur={(e) => {
    if (e.target.value !== (p.full_name || "")) handleNameSave(p.id, e.target.value);
}}
className="text-sm text-gray-200 bg-transparent border-b border-transparent hover:border-gray-700 focus:border-gray-500 outline-none w-full"
/>
    <div className="text-xs text-gray-500">{p.email}</div>
    </div>
<select
value={p.role}
onChange={(e) => handleRoleChange(p.id, e.target.value)}
className="bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200"
>
    <option value="member">Membru</option>
<option value="manager">Manager</option>
<option value="admin">Admin</option>
    </select>
<button
disabled={busyId === p.id}
    onClick={() => handleDeleteUser(p.id, p.full_name || p.email)}
title="Sterge user"
className="text-gray-500 hover:text-red-400 disabled:opacity-50 p-1"
>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
    </button>
    </div>

{p.role === "manager" && (
    <div className="mt-2 pt-2 border-t border-gray-800/60">
    <div className="text-xs text-gray-500 mb-1.5">Proiecte gestionate:</div>
 <div className="flex flex-wrap gap-1.5">
{projectOptions.map((proj) => {
    const isManaging = managed.includes(proj.id);
    return (
        <button
    key={proj.id}
                    onClick={() => toggleProjectManager(p.id, proj.id, isManaging)}
 className={`text-[11px] px-2 py-1 rounded-md border ${
     isManaging
     ? "bg-blue-950 border-blue-800 text-blue-300"
     : "bg-[#0f1117] border-gray-700 text-gray-500 hover:text-gray-300"
 }`}
style={{ marginLeft: proj.depth * 8 }}
>
{proj.name}
</button>
);
})}
</div>
    </div>
)}
</div>
);
})}
    {filteredActiveUsers.length === 0 && (
        <div className="text-sm text-gray-500">Niciun user gasit.</div>
     )}
</div>
    </div>
    </div>
    </div>
    </main>
);
}
