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
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

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
        const [{ data: profilesData }, { data: projectsData }, { data: pmData }] = await Promise.all([
                supabase.from("profiles").select("*").order("created_at", { ascending: true }),
                supabase.from("projects").select("*").order("position", { ascending: true }),
                supabase.from("project_managers").select("*"),
              ]);
        setProfiles(profilesData || []);
        setProjects(projectsData || []);
        setProjectManagers(pmData || []);
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
            <p className="text-xs text-gray-500 mt-1">Creeaza useri, seteaza roluri, asigneaza manageri pe proiecte.</p>
    </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-200">
              <- Inapoi la board
    </Link>
    </div>

  {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-2 rounded-md mb-4">{error}</div>
         )}
  {info && (
            <div className="bg-blue-950 border border-blue-800 text-blue-300 text-sm px-4 py-2 rounded-md mb-4">{info}</div>
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
              <h2 className="text-sm font-medium text-gray-200 mb-3">Useri ({profiles.length})</h2>
            <div className="space-y-3">
{profiles.map((p) => {
                  const managed = projectManagers.filter((pm) => pm.user_id === p.id).map((pm) => pm.project_id);
                  return (
                                      <div key={p.id} className="border border-gray-800 rounded-md p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-gray-200">{p.full_name || "(fara nume)"}</div>
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
</div>
  </div>
  </div>
  </div>
  </main>
  );
}
