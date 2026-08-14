"use client";
import { useState } from "react";
import ActivityLog from "./ActivityLog";

const emptyForm = {
  title: "",
  description: "",
  project: "",
  assignee: "",
  deadline: "",
  urgent: false,
  status_id: "",
};

export default function TaskModal({ task, statuses, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    task
    ? {
      title: task.title || "",
      description: task.description || "",
      project: task.project || "",
      assignee: task.assignee || "",
      deadline: task.deadline || "",
      urgent: !!task.urgent,
      status_id: task.status_id || statuses[0]?.id || "",
    }
    : { ...emptyForm, status_id: statuses[0]?.id || "" }
    );

function update(field, value) {
  setForm((prev) => ({ ...prev, [field]: value }));
}

function handleSubmit(e) {
  e.preventDefault();
  if (!form.title.trim()) return;
  onSave({ ...form, deadline: form.deadline || null }, task);
}

return (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
  <div className="bg-[#151824] border border-gray-800 rounded-lg w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
  <div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-gray-100">{task ? "Editează task" : "Task nou"}</h2>
<button onClick={onClose} className="text-gray-500 hover:text-gray-300">
  ✕
  </button>
  </div>

<form onSubmit={handleSubmit} className="space-y-3">
  <div>
  <label className="text-xs text-gray-500">Titlu</label>
<input
autoFocus
value={form.title}
onChange={(e) => update("title", e.target.value)}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
required
/>
  </div>

<div>
  <label className="text-xs text-gray-500">Descriere</label>
<textarea
value={form.description}
onChange={(e) => update("description", e.target.value)}
rows={3}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
  </div>

<div className="grid grid-cols-2 gap-3">
  <div>
  <label className="text-xs text-gray-500">Proiect</label>
<input
value={form.project}
onChange={(e) => update("project", e.target.value)}
placeholder="ex. Dropshipping"
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
  </div>
<div>
  <label className="text-xs text-gray-500">Responsabil</label>
<input
value={form.assignee}
onChange={(e) => update("assignee", e.target.value)}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
  </div>
  </div>

<div className="grid grid-cols-2 gap-3">
  <div>
  <label className="text-xs text-gray-500">Deadline</label>
<input
type="date"
value={form.deadline || ""}
onChange={(e) => update("deadline", e.target.value)}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
/>
  </div>
<div>
  <label className="text-xs text-gray-500">Status</label>
<select
value={form.status_id}
onChange={(e) => update("status_id", e.target.value)}
className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
>
{statuses.map((s) => (
  <option key={s.id} value={s.id}>
  {s.name}
  </option>
              ))}
</select>
  </div>
  </div>

<label className="flex items-center gap-2 text-sm text-gray-400">
  <input
type="checkbox"
checked={form.urgent}
onChange={(e) => update("urgent", e.target.checked)}
className="accent-red-500"
/>
  Marchează ca urgent
  </label>

<div className="flex items-center justify-between pt-2">
  <div>
{task && (
  <button
type="button"
onClick={() => {
  if (confirm("Ștergi acest task?")) onDelete(task);
}}
className="text-sm text-red-500 hover:text-red-400"
>
  Șterge task
  </button>
)}
</div>
<div className="flex gap-2">
  <button type="button" onClick={onClose} className="text-sm text-gray-400 px-3 py-1.5">
  Anulează
  </button>
<button
type="submit"
className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md"
>
  Salvează
  </button>
  </div>
  </div>
  </form>

{task && (
  <div className="mt-5 pt-4 border-t border-gray-800">
  <h3 className="text-xs font-medium text-gray-500 mb-2">Istoric</h3>
 <ActivityLog taskId={task.id} />
  </div>
 )}
</div>
  </div>
);
}
