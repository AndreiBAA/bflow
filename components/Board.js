"use client";
import { useState } from "react";
import Column from "./Column";

export default function Board({
  statuses,
  tasks,
  onMoveTask,
  onOpenTask,
  onAddStatus,
  onRenameStatus,
  onDeleteStatus,
}) {
  const [addingStatus, setAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");

function submitNewStatus() {
  const name = newStatusName.trim();
  if (!name) return;
  onAddStatus(name);
  setNewStatusName("");
  setAddingStatus(false);
}

return (
  <div className="flex gap-4 min-h-[70vh]">
{statuses.map((status) => (
  <Column
              key={status.id}
status={status}
tasks={tasks.filter((t) => t.status_id === status.id)}
onMoveTask={onMoveTask}
onOpenTask={onOpenTask}
onRenameStatus={onRenameStatus}
onDeleteStatus={onDeleteStatus}
/>
  ))}

  <div className="w-64 shrink-0">
{addingStatus ? (
  <div className="bg-[#181b24] border border-gray-700 rounded-lg p-3">
  <input
  autoFocus
value={newStatusName}
onChange={(e) => setNewStatusName(e.target.value)}
onKeyDown={(e) => e.key === "Enter" && submitNewStatus()}
placeholder="Nume coloană"
className="w-full bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-200 mb-2"
/>
  <div className="flex gap-2">
  <button
onClick={submitNewStatus}
className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md"
>
  Adaugă
  </button>
<button onClick={() => setAddingStatus(false)} className="text-sm text-gray-400 px-2 py-1">
  Anulează
  </button>
  </div>
  </div>
) : (
  <button
  onClick={() => setAddingStatus(true)}
  className="w-full border border-dashed border-gray-700 rounded-lg py-3 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-500"
>
  + Coloană nouă
  </button>
)}
</div>
  </div>
);
}
