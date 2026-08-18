"use client";
import { useState } from "react";
import TaskCard from "./TaskCard";

export default function Column({ status, tasks, onMoveTask, onOpenTask, onRenameStatus, onDeleteStatus, onReorderColumn }) {
    const [dragOver, setDragOver] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(status.name);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const raw = e.dataTransfer.getData("application/json");
        if (!raw) return;
        const task = JSON.parse(raw);
        onMoveTask(task, status.id);
  }

  function handleHeaderDrop(e) {
        const draggedId = e.dataTransfer.getData("column-id");
        if (draggedId && onReorderColumn) {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                onReorderColumn(draggedId);
        }
  }

  function submitRename() {
        const name = nameValue.trim();
        if (name && name !== status.name) onRenameStatus(status.id, name);
        setEditingName(false);
  }

  function confirmDelete() {
        setConfirmingDelete(false);
        onDeleteStatus(status.id);
  }

  return (
        <div
        onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`w-72 shrink-0 rounded-lg border max-h-[calc(100vh-220px)] ${
                dragOver ? "border-blue-500 bg-[#151824]" : "border-gray-800 bg-[#12141c]"
      } flex flex-col`}
    >
      <div
        draggable={!editingName}
        onDragStart={(e) => e.dataTransfer.setData("column-id", status.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleHeaderDrop}
        className={`flex items-center justify-between px-3 py-2 border-b border-gray-800 cursor-move sticky top-0 z-10 rounded-t-lg ${
                    dragOver ? "bg-[#151824]" : "bg-[#12141c]"
        }`}
      >
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
            onClick={() => setConfirmingDelete(true)}
            title="Sterge coloana"
            className="text-xs text-gray-600 hover:text-red-400"
          >
                          X
              </button>
               </div>
              </div>

{confirmingDelete && (
          <div className="px-3 py-2 bg-red-950 border-b border-red-800 text-xs text-red-300 space-y-2">
            <div>
{tasks.length > 0
               ? `Coloana are ${tasks.length} task-uri. Nu poti sterge o coloana cu task-uri active - muta-le mai intai.`
                : "Sigur vrei sa stergi aceasta coloana? Actiunea nu poate fi anulata."}
</div>
          <div className="flex gap-2">
{tasks.length === 0 && (
                <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded-md"
              >
                                  Sterge
                  </button>
            )}
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-gray-400 hover:text-gray-200 px-2 py-1"
            >
                              Anuleaza
                </button>
                </div>
                </div>
      )}

      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
      {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
                ))}
{tasks.length === 0 && <div className="text-xs text-gray-600 text-center py-6">fara task-uri</div>}
  </div>
  </div>
   );
}
