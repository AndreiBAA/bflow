"use client";
import { useState } from "react";
import TaskCard from "./TaskCard";

export default function Column({ status, tasks, onMoveTask, onOpenTask, onRenameStatus, onDeleteStatus }) {
  const [dragOver, setDragOver] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(status.name);

function handleDrop(e) {
  e.preventDefault();
  setDragOver(false);
  const raw = e.dataTransfer.getData("application/json");
  if (!raw) return;
  const task = JSON.parse(raw);
  onMoveTask(task, status.id);
}

function submitRename() {
  const name = nameValue.trim();
  if (name && name !== status.name) onRenameStatus(status.id, name);
  setEditingName(false);
}

return (
  <div
  onDragOver={(e) => {
    e.preventDefault();
    setDragOver(true);
  }}
  onDragLeave={() => setDragOver(false)}
onDrop={handleDrop}
className={`w-72 shrink-0 rounded-lg border ${
  dragOver ? "border-blue-500 bg-[#151824]" : "border-gray-800 bg-[#12141c]"
} flex flex-col`}
>
<div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
{editingName ? (
  <input
autoFocus
value={nameValue}
onChange={(e) => setNameValue(e.target.value)}
onBlur={submitRename}
onKeyDown={(e) => e.key === "Enter" && submitRename()}
className="bg-[#0f1117] border border-gray-700 rounded-md px-1 text-sm text-gray-200 w-32"
/>
  ) : (
    <button
    onClick={() => setEditingName(true)}
    className="text-sm font-medium text-gray-200 flex items-center gap-2"
>
  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
{status.name}
</button>
)}
<div className="flex items-center gap-2">
  <span className="text-xs text-gray-500">{tasks.length}</span>
<button
onClick={() => onDeleteStatus(status.id)}
title="Șterge coloana"
className="text-xs text-gray-600 hover:text-red-400"
>
  ✕
  </button>
  </div>
  </div>
<div className="flex-1 p-2 space-y-2 overflow-y-auto">
{tasks.map((task) => (
  <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
  ))}
{tasks.length === 0 && <div className="text-xs text-gray-600 text-center py-6">fără task-uri</div>}
  </div>
  </div>
 );
}
