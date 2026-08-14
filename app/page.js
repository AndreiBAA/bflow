"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import Board from "@/components/Board";
import TaskModal from "@/components/TaskModal";

export default function HomePage() {
  const [statuses, setStatuses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [filterProject, setFilterProject] = useState("");
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

const loadAll = useCallback(async () => {
  setLoading(true);
  setError(null);
  const [{ data: statusData, error: statusErr }, { data: taskData, error: taskErr }] = await Promise.all([
    supabase.from("statuses").select("*").order("position", { ascending: true }),
    supabase.from("tasks").select("*").order("created_at", { ascending: true }),
    ]);
  if (statusErr) setError(statusErr.message);
  if (taskErr) setError(taskErr.message);
  setStatuses(statusData || []);
  setTasks(taskData || []);
  setLoading(false);
}, []);

useEffect(() => {
  loadAll();
}, [loadAll]);

const projects = Array.from(new Set(tasks.map((t) => t.project).filter(Boolean))).sort();

const visibleTasks = tasks.filter((t) => {
  if (filterProject && t.project !== filterProject) return false;
  if (filterUrgentOnly && !t.urgent) return false;
  return true;
});

async function logActivity(taskId, action, detail) {
  await supabase.from("task_activity").insert({ task_id: taskId, action, detail });
}

async function handleMoveTask(task, newStatusId) {
  if (task.status_id === newStatusId) return;
  const oldStatus = statuses.find((s) => s.id === task.status_id);
  const newStatus = statuses.find((s) => s.id === newStatusId);
  const { error: updErr } = await supabase
  .from("tasks")
  .update({ status_id: newStatusId, updated_at: new Date().toISOString() })
  .eq("id", task.id);
  if (updErr) {
    setError(updErr.message);
    return;
  }
  await logActivity(task.id, "status_change", {
    from: oldStatus ? oldStatus.name : null,
    to: newStatus ? newStatus.name : null,
    from_id: task.status_id,
    to_id: newStatusId,
  });
  setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status_id: newStatusId } : t)));
}

async function handleSaveTask(formValues, existingTask) {
  if (existingTask) {
    const changes = [];
    for (const key of ["title", "description", "project", "assignee", "deadline", "urgent", "status_id"]) {
      if (formValues[key] !== existingTask[key]) {
        changes.push({ field: key, from: existingTask[key], to: formValues[key] });
      }
    }
    const { error: updErr } = await supabase
    .from("tasks")
    .update({ ...formValues, updated_at: new Date().toISOString() })
    .eq("id", existingTask.id);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    const statusChange = changes.find((c) => c.field === "status_id");
    if (statusChange) {
      const oldStatus = statuses.find((s) => s.id === statusChange.from);
      const newStatus = statuses.find((s) => s.id === statusChange.to);
      await logActivity(existingTask.id, "status_change", {
        from: oldStatus ? oldStatus.name : null,
        to: newStatus ? newStatus.name : null,
        from_id: statusChange.from,
        to_id: statusChange.to,
      });
    }
    const otherChanges = changes.filter((c) => c.field !== "status_id");
    if (otherChanges.length > 0) {
      await logActivity(existingTask.id, "edit", { changes: otherChanges });
    }
    setTasks((prev) => prev.map((t) => (t.id === existingTask.id ? { ...t, ...formValues } : t)));
  } else {
    const { data, error: insErr } = await supabase.from("tasks").insert(formValues).select().single();
    if (insErr) {
      setError(insErr.message);
      return;
    }
    await logActivity(data.id, "created", { title: data.title });
    setTasks((prev) => [...prev, data]);
  }
  setActiveTask(null);
}

async function handleDeleteTask(task) {
  const { error: delErr } = await supabase.from("tasks").delete().eq("id", task.id);
  if (delErr) {
    setError(delErr.message);
    return;
  }
  setTasks((prev) => prev.filter((t) => t.id !== task.id));
  setActiveTask(null);
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
    setError("Nu se poate sterge o coloana care are task-uri active. Muta-le mai intai.");
    return;
  }
  const { error: delErr } = await supabase.from("statuses").delete().eq("id", statusId);
  if (delErr) {
    setError(delErr.message);
    return;
  }
  setStatuses((prev) => prev.filter((s) => s.id !== statusId));
}

return (
  <main className="min-h-screen flex flex-col">
  <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-800">
  <div className="flex items-center gap-2">
  <span className="text-xl font-semibold text-gray-100">BFlow</span>
  <span className="text-xs text-gray-500">- Blocked. Running. Next.</span>
  </div>
  <div className="flex items-center gap-3">
  <select
  value={filterProject}
  onChange={(e) => setFilterProject(e.target.value)}
  className="bg-[#181b24] border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-300"
  >
    <option value="">Toate proiectele</option>
  {projects.map((p) => (
    <option key={p} value={p}>
    {p}
    </option>
                ))}
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
  <button
    onClick={() => setActiveTask("new")}
  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md"
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

<div className="flex-1 overflow-x-auto p-6">
{loading ? (
  <div className="text-gray-500 text-sm">Se incarca...</div>
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
 onClose={() => setActiveTask(null)}
 onSave={handleSaveTask}
   onDelete={handleDeleteTask}
 />
     )}
     </main>
 );
}
