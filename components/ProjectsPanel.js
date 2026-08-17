"use client";
import { useState } from "react";

const DEFAULT_COLOR = "#3b82f6";

export default function ProjectsPanel({
    projects,
    projectOptions,
    tasks,
    onClose,
    onCreateProject,
    onUpdateProjectColor,
    onDeleteProject,
}) {
    const [newName, setNewName] = useState("");
    const [newParentId, setNewParentId] = useState("");
    const [newColor, setNewColor] = useState(DEFAULT_COLOR);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [localError, setLocalError] = useState(null);

  function getDescendantProjectIds(projectId) {
        const ids = [projectId];
        const children = projects.filter((p) => p.parent_id === projectId);
        for (const c of children) {
                ids.push(...getDescendantProjectIds(c.id));
        }
        return ids;
  }

  function taskCountFor(projectId) {
        const ids = getDescendantProjectIds(projectId);
        return tasks.filter((t) => ids.includes(t.project_id)).length;
  }

  async function handleCreate(e) {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        setLocalError(null);
        try {
                await onCreateProject({
                          name: newName.trim(),
                          parent_id: newParentId || null,
                          color: newColor,
                });
                setNewName("");
                setNewParentId("");
                setNewColor(DEFAULT_COLOR);
        } catch (err) {
                setLocalError(err.message || "Nu am putut crea proiectul.");
        } finally {
                setSaving(false);
        }
  }

  function handleColorChange(project, color) {
        onUpdateProjectColor(project.id, color);
  }

  async function handleConfirmDelete(project) {
        setSaving(true);
        setLocalError(null);
        try {
                await onDeleteProject(project);
                setConfirmDeleteId(null);
        } catch (err) {
                setLocalError(err.message || "Nu am putut sterge proiectul.");
        } finally {
                setSaving(false);
        }
  }

  return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-[#181b24] border border-gray-700 rounded-md shadow-lg w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-gray-200">Proiecte</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">
                Inchide
    </button>
    </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
  {localError && (
                <div className="mb-3 text-xs text-red-400 bg-red-950 border border-red-800 rounded-md px-3 py-2">
  {localError}
    </div>
            )}

          <div className="space-y-1">
          {projectOptions.length === 0 && (
                          <div className="text-sm text-gray-500">Nu exista niciun proiect inca.</div>
            )}
{projectOptions.map((opt) => {
                const project = projects.find((p) => p.id === opt.id);
                if (!project) return null;
                const count = taskCountFor(project.id);
                const isConfirming = confirmDeleteId === project.id;
                return (
                                  <div key={project.id} className="rounded-md hover:bg-[#1f2330]">
                    <div
                     className="flex items-center gap-2 px-2 py-1.5"
                     style={{ paddingLeft: 8 + opt.depth * 16 }}
                  >
                    <input
                      type="color"
                                  defaultValue={project.color || DEFAULT_COLOR}
                      onChange={(e) => handleColorChange(project, e.target.value)}
                      title="Culoare proiect"
                      className="w-6 h-6 rounded border border-gray-700 bg-transparent cursor-pointer shrink-0"
                    />
                                            <span className="text-sm text-gray-200 flex-1 truncate">{project.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {count} {count === 1 ? "task" : "task-uri"}
</span>
                    <button
                      onClick={() => setConfirmDeleteId(project.id)}
                      title="Sterge proiect"
                      className="text-gray-500 hover:text-red-400 shrink-0 p-1"
                    >
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                        </svg>
                        </button>
                        </div>
{isConfirming && (
                      <div className="mx-2 mb-2 px-3 py-2 bg-red-950 border border-red-800 rounded-md text-xs text-red-300">
                        <div className="mb-2">
                          Sigur vrei sa stergi proiectul <strong>{project.name}</strong>? Contine{" "}
                         <strong>
{count} {count === 1 ? "task" : "task-uri"}
 </strong>{" "}
                         (inclusiv subproiecte), care vor fi sterse definitiv.
   </div>
                       <div className="flex items-center gap-2">
                           <button
                           disabled={saving}
                           onClick={() => handleConfirmDelete(project)}
                           className="bg-red-700 hover:bg-red-600 text-white px-2.5 py-1 rounded-md disabled:opacity-50"
                         >
                                                       Sterge definitiv
                             </button>
                         <button
                           disabled={saving}
                           onClick={() => setConfirmDeleteId(null)}
                           className="text-gray-400 hover:text-gray-200 px-2.5 py-1"
                         >
                                                       Anuleaza
                             </button>
                             </div>
                             </div>
                   )}
</div>
              );
})}
</div>
  </div>

        <form onSubmit={handleCreate} className="border-t border-gray-800 px-4 py-3 space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Proiect nou</div>
          <div className="flex items-center gap-2">
              <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              title="Culoare proiect"
              className="w-8 h-8 rounded border border-gray-700 bg-transparent cursor-pointer shrink-0"
            />
                            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nume proiect"
              className="flex-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
            />
                </div>
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            className="w-full bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-300"
          >
                          <option value="">Fara proiect parinte</option>
{projectOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
{"  ".repeat(opt.depth)}
{opt.name}
</option>
            ))}
              </select>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-1.5 rounded-md disabled:opacity-50"
          >
                          Adauga proiect
              </button>
              </form>
              </div>
              </div>
  );
}
