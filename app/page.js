"use client";
import RoadmapView from "@/components/RoadmapView";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Board from "@/components/Board";
import GanttView from "@/components/GanttView";
import TaskModal from "@/components/TaskModal";
import ApprovalsPanel from "@/components/ApprovalsPanel";
import NotificationsBell from "@/components/NotificationsBell";
import ProjectsPanel from "@/components/ProjectsPanel";
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
        const [showProjects, setShowProjects] = useState(false);

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
        const isPending = profile?.role === "pending";

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
        if (authReady && user && !isPending) loadAll();
}, [authReady, user, isPending, loadAll]);

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
                if (
                        filterMineOnly &&
                        myFullName &&
                        !(t.assignee || "")
                        .split(",")
                        .map((s) => s.trim())
                        .includes(myFullName)
                        )
                        return false;
                return true;
        })
        .map((t) => ({
                ...t,
                project_name: t.project_id ? projectsById[t.project_id]?.name : null,
                project_color: t.project_id ? projectsById[t.project_id]?.color || null : null,
        }));

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

async function notifyAssignee(assigneeNames, message, taskId) {
        if (!assigneeNames) return;
        const names = assigneeNames
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
        for (const name of names) {
                const assigneeProfile = profilesAll.find(
                        (p) => (p.full_name || "").trim().toLowerCase() === name.toLowerCase()
                        );
                if (!assigneeProfile || assigneeProfile.id === user.id) continue;
                await supabase.from("notifications").insert({ user_id: assigneeProfile.id, task_id: taskId, message });
        }
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

	async function handleUpdateStatusColor(statusId, color) {
			const { error: updErr } = await supabase.from("statuses").update({ color }).eq("id", statusId);
			if (updErr) {
						setError(updErr.message);
						return;
			}
			setStatuses((prev) => prev.map((s) => (s.id === statusId ? { ...s, color } : s)));
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

async function handleReorderStatuses(orderedIds) {
        setStatuses((prev) => {
                const byId = Object.fromEntries(prev.map((s) => [s.id, s]));
                return orderedIds.map((id, idx) => ({ ...byId[id], position: idx }));
        });
        await Promise.all(
                orderedIds.map((id, idx) => supabase.from("statuses").update({ position: idx }).eq("id", id))
                );
}

async function handleCreateProject({ name, parent_id, color }) {
        const position = projects.length;
        const { data, error: insErr } = await supabase
        .from("projects")
        .insert({ name, parent_id: parent_id || null, color, position })
        .select()
        .single();
        if (insErr) {
                throw new Error(insErr.message);
        }
        setProjects((prev) => [...prev, data]);
}

async function handleUpdateProjectColor(projectId, color) {
        const idsToUpdate = getDescendantProjectIds(projectId);
		const { error: updErr } = await supabase.from("projects").update({ color }).in("id", idsToUpdate); 
		if (updErr) {
                setError(updErr.message);
                return;
        }
		setProjects((prev) => prev.map((p) => (idsToUpdate.includes(p.id) ? { ...p, color } : p)));
}

async function handleDeleteProject(project) {
        const idsToDelete = getDescendantProjectIds(project.id);
        const { error: taskDelErr } = await supabase.from("tasks").delete().in("project_id", idsToDelete);
        if (taskDelErr) {
                throw new Error(taskDelErr.message);
        }
        const depthById = Object.fromEntries(projectOptions.map((o) => [o.id, o.depth]));
        const orderedIds = [...idsToDelete].sort((a, b) => (depthById[b] || 0) - (depthById[a] || 0));
        for (const id of orderedIds) {
                const { error: delErr } = await supabase.from("projects").delete().eq("id", id);
                if (delErr) {
                        throw new Error(delErr.message);
                }
        }
        setProjects((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
        setTasks((prev) => prev.filter((t) => !idsToDelete.includes(t.project_id)));
        if (filterProject && idsToDelete.includes(filterProject)) {
                setFilterProject("");
        }
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

if (isPending) {
        return (
                <main className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-sm text-center space-y-3">
                <img src="/brn-logo.png" alt="BRN" className="h-10 w-auto mx-auto" />
                <h2 className="text-gray-100 font-semibold">Cont in asteptare de aprobare</h2>
        <p className="text-sm text-gray-400">
                Contul tau a fost creat, dar un admin trebuie sa iti aprobe accesul inainte sa poti folosi aplicatia.
                </p>
        <button onClick={handleLogout} className="text-sm text-blue-400 hover:text-blue-300">
                Delogare
                </button>
                </div>
                </main>
        );
}

return (
        <main className="h-screen flex flex-col overflow-hidden">
        <header className="flex flex-col border-b border-gray-800">
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3">
        <div className="flex flex-col items-start gap-0.5 min-w-0">
        <img src="/brn-logo.png" alt="BRN" className="h-7 sm:h-8 w-auto" />
        <span className="hidden sm:block text-[9px] uppercase tracking-[0.15em] text-gray-500 leading-none">Blocked &middot; Running &middot; Next</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
{isPrivileged && (
        <button
        onClick={() => setShowApprovals(true)}
        title="Aprobari"
        className="relative text-gray-400 hover:text-gray-200 p-1.5"
        >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 14 2 2 4-4" />
                </svg>
        {myPendingRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center">
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

        <div className="relative pl-2 border-l border-gray-800">
        <button
onClick={() => setShowUserMenu((v) => !v)}
className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
>
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold uppercase overflow-hidden shrink-0">
{profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
                (profile?.full_name || user?.email || "?").slice(0, 1)
)}
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
{isPrivileged && (
        <button
 onClick={() => {
         setShowUserMenu(false);
         setShowProjects(true);
 }}
 className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#232733]"
 >
         Proiecte
         </button>
 )}
{profile?.role === "admin" && (
        <Link
 href="/admin"
 onClick={() => setShowUserMenu(false)}
 className="block px-3 py-2 text-sm text-gray-300 hover:bg-[#232733]"
 >
         Admin
         </Link>
 )}
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
        </div>

<div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2.5">
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
	<button onClick={() => setViewMode("roadmap")} className={`px-2.5 py-1 rounded-md ${viewMode === "roadmap" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>Roadmap</button>
        </div>

<button
onClick={() => setFilterUrgentOnly((v) => !v)}
className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm border ${
        filterUrgentOnly
        ? "bg-red-600/20 border-red-600 text-red-300"
        : "bg-[#181b24] border-gray-700 text-gray-400 hover:text-gray-200"
}`}
>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
Urgente
        </button>

<button
onClick={() => setFilterMineOnly((v) => !v)}
className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm border ${
        filterMineOnly
        ? "bg-blue-600/20 border-blue-600 text-blue-300"
        : "bg-[#181b24] border-gray-700 text-gray-400 hover:text-gray-200"
}`}
>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
        </svg>
Ale mele
        </button>

<select
value={filterProject}
onChange={(e) => setFilterProject(e.target.value)}
className="bg-[#181b24] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-300"
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
{" " + c.name}
        </option>
))}
        </optgroup>
 );
        })}
</select>

        <button
onClick={() => setActiveTask("new")}
        className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md"
>
                + Task nou
                </button>
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

<div className="flex-1 overflow-auto p-6 min-h-0">
{loading ? (
        <div className="text-gray-500 text-sm">Se incarca...</div>
        ) : viewMode === "gantt" ? (
        <GanttView
        projectOptions={projectOptions}
tasks={visibleTasks}
statuses={statuses}
onOpenTask={(t) => setActiveTask(t)}
/>
) : viewMode === "roadmap" ? (
	<RoadmapView tasks={visibleTasks} statuses={statuses} projects={projects} />
	
) : (
                <Board
statuses={statuses}
tasks={visibleTasks}
onMoveTask={handleMoveTask}
onOpenTask={(t) => setActiveTask(t)}
onAddStatus={handleAddStatus}
onRenameStatus={handleRenameStatus}
onDeleteStatus={handleDeleteStatus}
onUpdateStatusColor={handleUpdateStatusColor}
onReorderStatuses={handleReorderStatuses}
/>
        )}
        </div>

{activeTask && (
        <TaskModal
 task={activeTask === "new" ? null : activeTask}
         statuses={statuses}
 projectOptions={projectOptions}
 profilesAll={profilesAll}
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

{showProjects && (
        <ProjectsPanel
 projects={projects}
 projectOptions={projectOptions}
 tasks={tasks}
 onClose={() => setShowProjects(false)}
 onCreateProject={handleCreateProject}
 onUpdateProjectColor={handleUpdateProjectColor}
 onDeleteProject={handleDeleteProject}
 />
         )}
</main>
 );
}
