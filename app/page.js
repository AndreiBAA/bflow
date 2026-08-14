"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Board from "@/components/Board";
import GanttView from "@/components/GanttView";
import TaskModal from "@/components/TaskModal";
import ApprovalsPanel from "@/components/ApprovalsPanel";
import NotificationsBell from "@/components/NotificationsBell";
export default function HomePage() {
        const router = useRouter();
        
        const [authReady, setAuthReady] = useState(false);
        const [user, setUser] = useState(null);
        const [profile, setProfile] = useState(null);
        
        const [statuses, setStatuses] = useState([]);
        const [tasks, setTasks] = useState([]);
        const [projects, setProjects] = useState([]);
        const [profilesAll, setProfilesAll] = useState([]);
        const [myManagedProjectIds, setMyManagedProjectIds] = useState([]);
        const [changeRequests, setChangeRequests] = useState([]);
        const [notifications, setNotifications] = useState([]);
        
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [info, setInfo] = useState(null);
        const [activeTask, setActiveTask] = useState(null);
        const [filterProject, setFilterProject] = useState("");
        const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);
        const [filterMineOnly, setFilterMineOnly] = useState(false);
const [viewMode, setViewMode] = useState("board");
const [showApprovals, setShowApprovals] = useState(false);
const [showUserMenu, setShowUserMenu] = useState(false);

// verificare autentificare
useEffect(() => {
        let active = true;
        async function checkAuth() {
                const { data } = await supabase.auth.getUser();
                if (!active) return;
                if (!data?.user) {
                        router.push("/login");
                        return;
                }
                setUser(data.user);
                const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
                if (!active) return;
                setProfile(profileRow || { id: data.user.id, role: "member", full_name: null });
                setAuthReady(true);
        }
        checkAuth();
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
                if (event === "SIGNED_OUT") router.push("/login");
        });
        return () => {
                active = false;
                sub?.subscription?.unsubscribe();
        };
}, [router]);

const isPrivileged = profile?.role === "admin" || profile?.role === "manager";

const loadAll = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        const [
                { data: statusData, error: statusErr },
                { data: taskData, error: taskErr },
                { data: projectData, error: projectErr },
                { data: profilesData },
                { data: myManaged },
                { data: notifData },
                ] = await Promise.all([
                supabase.from("statuses").select("*").order("position", { ascending: true }),
                supabase.from("tasks").select("*").order("created_at", { ascending: true }),
                supabase.from("projects").select("*").order("position", { ascending: true }),
                supabase.from("profiles").select("*"),
                supabase.from("project_managers").select("project_id").eq("user_id", user.id),
                supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
                ]);
        if (statusErr) setError(statusErr.message);
        if (taskErr) setError(taskErr.message);
        if (projectErr) setError(projectErr.message);
        setStatuses(statusData || []);
        setTasks(taskData || []);
        setProjects(projectData || []);
        setProfilesAll(profilesData || []);
        setMyManagedProjectIds((myManaged || []).map((m) => m.project_id));
        setNotifications(notifData || []);

                            const { data: crData } = await supabase.from("change_requests").select("*").eq("status", "pending");
        setChangeRequests(crData || []);

                            setLoading(false);
}, [user]);

useEffect(() => {
        if (authReady && user) loadAll();
}, [authReady, user, loadAll]);

// lista aplatizata pentru dropdown: proiect parinte, apoi subproiectele lui, cu adancime pentru indentare
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
                        out.push({ id: p.id, name: p.name, depth, parentId: p.parent_id || null });
                        walk(p.id, depth + 1);
                }
        }
        walk("root", 0);
        return out;
})();

// pentru un id de proiect, toate id-urile din subarborele lui (inclusiv el insusi) - folosit la filtrare
function getDescendantProjectIds(projectId) {
        const ids = [projectId];
        const children = projects.filter((p) => p.parent_id === projectId);
        for (const c of children) {
                ids.push(...getDescendantProjectIds(c.id));
        }
        return ids;
}

const filterProjectIds = filterProject ? getDescendantProjectIds(filterProject) : null;

const projectsById = Object.fromEntries(projects.map((p) => [p.id, p]));
const profilesById = Object.fromEntries(profilesAll.map((p) => [p.id, p]));
const tasksById = Object.fromEntries(tasks.map((t) => [t.id, t]));

const myFullName = profile?.full_name || null;

const visibleTasks = tasks
.filter((t) => {
        if (filterProjectIds && !filterProjectIds.includes(t.project_id)) return false;
        if (filterUrgentOnly && !t.urgent) return false;
        if (filterMineOnly && myFullName && t.assignee !== myFullName) return false;
        return true;
})
.map((t) => ({ ...t, project_name: t.project_id ? projectsById[t.project_id]?.name : null }));

const myPendingRequests = changeRequests.filter((r) => {
        if (profile?.role === "admin") return true;
        if (profile?.role === "manager") {
                const task = tasksById[r.task_id];
                return task && myManagedProjectIds.includes(task.project_id);
        }
        return false;
});

async function logActivity(taskId, action, detail) {
        await supabase.from("task_activity").insert({ task_id: taskId, action, detail });
}

async function notifyManagers(projectId, message, taskId) {
        if (!projectId) return;
        const { data: managers } = await supabase
        .from("project_managers")
        .select("user_id")
        .eq("project_id", projectId);
        if (!managers || managers.length === 0) return;
        const rows = managers
        .filter((m) => m.user_id !== user.id)
        .map((m) => ({ user_id: m.user_id, task_id: taskId, message }));
        if (rows.length > 0) await supabase.from("notifications").insert(rows);
}

async function notifyAssignee(assigneeName, message, taskId) {
        if (!assigneeName) return;
        const assigneeProfile = profilesAll.find(
                (p) => (p.full_name || "").trim().toLowerCase() === assigneeName.trim().toLowerCase()
                );
        if (!assigneeProfile || assigneeProfile.id === user.id) return;
        await supabase.from("notifications").insert({ user_id: assigneeProfile.id, task_id: taskId, message });
}

async function applyStatusChange(task, newStatusId) {
        const oldStatus = statuses.find((s) => s.id === task.status_id);
        const newStatus = statuses.find((s) => s.id === newStatusId);
        const { error: updErr } = await supabase
        .from("tasks")
        .update({ status_id: newStatusId, updated_at: new Date().toISOString() })
        .eq("id", task.id);
        if (updErr) {
                setError(updErr.message);
                return false;
        }
        await logActivity(task.id, "status_change", {
                from: oldStatus ? oldStatus.name : null,
                to: newStatus ? newStatus.name : null,
                from_id: task.status_id,
                to_id: newStatusId,
        });
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status_id: newStatusId } : t)));
        if (profile?.role === "member" && task.project_id) {
                await notifyManagers(
                        task.project_id,
                        `${profile.full_name || "Un membru"} a schimbat statusul la "${task.title}" in "${newStatus ? newStatus.name : ""}".`,
                        task.id
                        );
        }
        return true;
}

async function handleMoveTask(task, newStatusId) {
        if (task.status_id === newStatusId) return;
        await applyStatusChange(task, newStatusId);
}

async function handleSaveTask(formValues, existingTask) {
        if (existingTask) {
                const changes = [];
                for (const key of ["title", "description", "project_id", "assignee", "start_date", "deadline", "urgent", "status_id"]) {
                        if (formValues[key] !== existingTask[key]) {
                                changes.push({ field: key, from: existingTask[key], to: formValues[key] });
                        }
                }
                const statusChange = changes.find((c) => c.field === "status_id");
                const assigneeChange = changes.find((c) => c.field === "assignee");
                const contentChanges = changes.filter((c) => c.field !== "status_id");

        if (profile?.role === "member" && contentChanges.length > 0) {
                // continutul necesita aprobare - se trimite cerere, NU se aplica direct
                const payload = Object.fromEntries(contentChanges.map((c) => [c.field, c.to]));
                const { error: crErr } = await supabase.from("change_requests").insert({
                        task_id: existingTask.id,
                        requested_by: user.id,
                        type: "edit",
                        payload,
                });
                if (crErr) {
                        setError(crErr.message);
                        return;
                }
                setInfo("Modificarile de continut au fost trimise spre aprobare managerului.");
        }

        if (statusChange) {
                await applyStatusChange(existingTask, statusChange.to);
        } else if (profile?.role !== "member" && contentChanges.length > 0) {
                // admin/manager: aplica direct
                const { error: updErr } = await supabase
                .from("tasks")
                .update({ ...formValues, updated_at: new Date().toISOString() })
                .eq("id", existingTask.id);
                if (updErr) {
                        setError(updErr.message);
                        return;
                }
                await logActivity(existingTask.id, "edit", { changes: contentChanges });
                setTasks((prev) => prev.map((t) => (t.id === existingTask.id ? { ...t, ...formValues } : t)));
                if (assigneeChange && assigneeChange.to) {
                        await notifyAssignee(
                                assigneeChange.to,
                                `Ti-a fost asignat task-ul "${existingTask.title}".`,
                                existingTask.id
                                );
                }
        } else if (profile?.role === "member" && contentChanges.length === 0 && !statusChange) {
                // nimic de facut
        } else if (profile?.role !== "member" && contentChanges.length === 0 && statusChange) {
                // deja aplicat mai sus
        }
        } else {
                const { data, error: insErr } = await supabase.from("tasks").insert(formValues).select().single();
                if (insErr) {
                        setError(insErr.message);
                        return;
                }
                await logActivity(data.id, "created", { title: data.title });
                setTasks((prev) => [...prev, data]);
                if (data.assignee) {
                        await notifyAssignee(data.assignee, `Ti-a fost asignat task-ul nou "${data.title}".`, data.id);
                }
        }
        setActiveTask(null);
}

async function handleDeleteTask(task) {
        if (profile?.role === "member") {
                const { error: crErr } = await supabase.from("change_requests").insert({
                        task_id: task.id,
                        requested_by: user.id,
                        type: "delete",
                        payload: null,
                });
                if (crErr) {
                        setError(crErr.message);
                        return;
                }
                setInfo("Cererea de stergere a fost trimisa spre aprobare managerului.");
                setActiveTask(null);
                return;
        }
        const { error: delErr } = await supabase.from("tasks").delete().eq("id", task.id);
        if (delErr) {
                setError(delErr.message);
                return;
        }
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setActiveTask(null);
}

async function handleApproveRequest(request) {
        const task = tasksById[request.task_id];
        if (request.type === "delete") {
                if (task) {
                        await supabase.from("tasks").delete().eq("id", task.id);
                        setTasks((prev) => prev.filter((t) => t.id !== task.id));
                }
        } else if (request.type === "edit" && task) {
                await supabase
                .from("tasks")
                .update({ ...request.payload, updated_at: new Date().toISOString() })
                .eq("id", task.id);
                await logActivity(task.id, "edit", {
                        changes: Object.entries(request.payload).map(([field, to]) => ({ field, from: task[field], to })),
                });
                setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...request.payload } : t)));
                if (request.payload.assignee) {
                        await notifyAssignee(request.payload.assignee, `Ti-a fost asignat task-ul "${task.title}".`, task.id);
                }
        }
        await supabase
        .from("change_requests")
        .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", request.id);
        await supabase.from("notifications").insert({
                user_id: request.requested_by,
                task_id: request.task_id,
                message: `Cererea ta pentru "${task ? task.title : "un task"}" a fost aprobata.`,
        });
        setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));
}

async function handleRejectRequest(request) {
        const task = tasksById[request.task_id];
        await supabase
        .from("change_requests")
        .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", request.id);
        await supabase.from("notifications").insert({
                user_id: request.requested_by,
                task_id: request.task_id,
                message: `Cererea ta pentru "${task ? task.title : "un task"}" a fost respinsa.`,
        });
        setChangeRequests((prev) => prev.filter((r) => r.id !== request.id));
}

async function handleMarkNotificationRead(n) {
        if (!n.read) {
                await supabase.from("notifications").update({ read: true }).eq("id", n.id);
                setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        }
}

async function handleMarkAllNotificationsRead() {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
}

async function handleAddStatus(name) {
        const position = statuses.length;
        const { data, error: insErr } = await supabase
        .from("statuses")
        .insert({ name, position, color: "#6b7280" })
        .select()
        .single();
        if (insErr) {
                setError(insErr.message);
                return;
        }
        setStatuses((prev) => [...prev, data]);
}

async function handleRenameStatus(statusId, name) {
        const { error: updErr } = await supabase.from("statuses").update({ name }).eq("id", statusId);
        if (updErr) {
                setError(updErr.message);
                return;
        }
        setStatuses((prev) => prev.map((s) => (s.id === statusId ? { ...s, name } : s)));
}

async function handleDeleteStatus(statusId) {
        const hasTasks = tasks.some((t) => t.status_id === statusId);
        if (hasTasks) {
                setError("Nu poti sterge o coloana care are task-uri active. Muta-le mai intai.");
                return;
        }
        const { error: delErr } = await supabase.from("statuses").delete().eq("id", statusId);
        if (delErr) {
                setError(delErr.message);
                return;
        }
        setStatuses((prev) => prev.filter((s) => s.id !== statusId));
}

async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/login");
}

if (!authReady) {
        return (
                <main className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500 text-sm">Se verifica autentificarea...</div>
                </main>
        );
}

return (
        <main className="min-h-screen flex flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-800">
        <img src="/brn-logo.png" alt="BRN" className="h-8 w-auto" />
        <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500 leading-none">Blocked &middot; Running &middot; Next</span>
        </div>
<div className="flex items-center gap-3">
        <div className="flex items-center bg-[#181b24] border border-gray-700 rounded-md p-0.5 text-sm">
        <button
onClick={() => setViewMode("board")}
className={`px-2.5 py-1 rounded-md ${
        viewMode === "board" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
}`}
>
Board
        </button>
<button
onClick={() => setViewMode("gantt")}
className={`px-2.5 py-1 rounded-md ${
        viewMode === "gantt" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"
}`}
>
Gantt
        </button>
        </div>
<select
value={filterProject}
onChange={(e) => setFilterProject(e.target.value)}
className="bg-[#181b24] border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-300"
>
        <option value="">Toate proiectele</option>
{projectOptions
 .filter((p) => p.depth === 0)
 .map((top) => {
         const children = projectOptions.filter((c) => c.parentId === top.id);
         if (children.length === 0) {
                 return (
                         <option key={top.id} value={top.id}>
      {top.name}
      </option>
      );
}
return (
        <optgroup key={top.id} label={top.name}>
<option value={top.id}>Tot proiectul ({top.name})</option>
{children.map((c) => (
        <option key={c.id} value={c.id}>
{"    " + c.name}
        </option>
))}
</optgroup>
);
})}
</select>
<label className="flex items-center gap-1 text-sm text-gray-400">
        <input
type="checkbox"
checked={filterUrgentOnly}
onChange={(e) => setFilterUrgentOnly(e.target.checked)}
className="accent-red-500"
/>
        Doar urgente
        </label>
<label className="flex items-center gap-1 text-sm text-gray-400">
        <input
type="checkbox"
checked={filterMineOnly}
onChange={(e) => setFilterMineOnly(e.target.checked)}
className="accent-blue-500"
/>
        Doar ale mele
        </label>
<button
onClick={() => setActiveTask("new")}
className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md"
>
        + Task nou
        </button>

{isPrivileged && (
        <button
 onClick={() => setShowApprovals(true)}
 className="relative text-sm text-gray-400 hover:text-gray-200 px-2 py-1.5"
 >
         Aprobari
 {myPendingRequests.length > 0 && (
         <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
 {myPendingRequests.length > 9 ? "9+" : myPendingRequests.length}
 </span>
 )}
</button>
)}

<NotificationsBell
notifications={notifications}
onMarkRead={handleMarkNotificationRead}
onMarkAllRead={handleMarkAllNotificationsRead}
/>

{profile?.role === "admin" && (
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-200">
        Admin
        </Link>
 )}

<div className="relative pl-2 border-l border-gray-800">
        <button
onClick={() => setShowUserMenu((v) => !v)}
className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
>
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold uppercase">
{(profile?.full_name || user?.email || "?").slice(0, 1)}
</span>
<span className="hidden sm:inline max-w-[140px] truncate">
{profile?.full_name || user?.email}
</span>
        </button>
{showUserMenu && (
        <div className="absolute right-0 top-10 z-20 w-56 bg-[#181b24] border border-gray-700 rounded-md shadow-lg py-1">
        <div className="px-3 py-2 border-b border-gray-800">
        <div className="text-sm text-gray-200 truncate">{profile?.full_name || "Fara nume"}</div>
<div className="text-xs text-gray-500 truncate">{user?.email}</div>
<div className="text-xs text-gray-500 mt-0.5 capitalize">{profile?.role || "member"}</div>
        </div>
<Link
href="/account"
onClick={() => setShowUserMenu(false)}
className="block px-3 py-2 text-sm text-gray-300 hover:bg-[#232733]"
>
        Contul meu
        </Link>
<button
onClick={() => {
        setShowUserMenu(false);
        handleLogout();
}}
className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#232733]"
>
        Delogare
        </button>
        </div>
)}
</div>
        </div>
        </header>

{error && (
        <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-2">
{error}
 <button className="ml-3 underline" onClick={() => setError(null)}>
ascunde
        </button>
        </div>
)}

{info && (
        <div className="bg-blue-950 border border-blue-800 text-blue-300 text-sm px-4 py-2">
{info}
 <button className="ml-3 underline" onClick={() => setInfo(null)}>
ascunde
        </button>
        </div>
)}

<div className="flex-1 overflow-x-auto p-6">
{loading ? (
        <div className="text-gray-500 text-sm">Se incarca...</div>
        ) : viewMode === "gantt" ? (
        <GanttView
        projectOptions={projectOptions}
tasks={visibleTasks}
statuses={statuses}
onOpenTask={(t) => setActiveTask(t)}
/>
        ) : (
                <Board
statuses={statuses}
tasks={visibleTasks}
onMoveTask={handleMoveTask}
onOpenTask={(t) => setActiveTask(t)}
onAddStatus={handleAddStatus}
onRenameStatus={handleRenameStatus}
onDeleteStatus={handleDeleteStatus}
/>
        )}
        </div>

{activeTask && (
        <TaskModal
 task={activeTask === "new" ? null : activeTask}
         statuses={statuses}
 projectOptions={projectOptions}
 onClose={() => setActiveTask(null)}
 onSave={handleSaveTask}
 onDelete={handleDeleteTask}
 />
         )}

{showApprovals && (
        <ApprovalsPanel
 requests={myPendingRequests}
 tasksById={tasksById}
 profilesById={profilesById}
 onApprove={handleApproveRequest}
 onReject={handleRejectRequest}
 onClose={() => setShowApprovals(false)}
 />
         )}
</main>
);
}
