"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import useClickOutside from "@/lib/useClickOutside";

const ACTION_LABELS = {
  created: "a creat task-ul",
  status_change: "a schimbat statusul",
  edit: "a editat task-ul",
  archived: "a arhivat task-ul",
  restored: "a restaurat task-ul",
  deleted_permanently: "a sters definitiv task-ul",
};

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLogPanel({ tasksById, profilesById }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useClickOutside(() => setOpen(false), open);

useEffect(() => {
  if (!open) return;
  let active = true;
  async function load() {
    setLoading(true);
    const { data } = await supabase
    .from("task_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
    if (active) {
      setEntries(data || []);
      setLoading(false);
    }
  }
  load();
  return () => {
    active = false;
  };
}, [open]);

  return (
    <div className="relative" ref={ref}>
    <button
  onClick={() => setOpen((o) => !o)}
  title="Audit"
  className="relative text-gray-400 hover:text-gray-200 hover:bg-[#181b24] p-2 rounded-md"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.05 11a9 9 0 1 1 .5 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v5h5" />
    </svg>
    </button>

  {open && (
    <div className="absolute right-0 mt-1 w-96 max-w-[90vw] bg-[#151824] border border-gray-800 rounded-lg shadow-lg z-40 max-h-[28rem] overflow-y-auto">
    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
    <span className="text-xs font-medium text-gray-400">Audit - toate modificarile</span>
    </div>

  {loading ? (
    <div className="text-xs text-gray-600 text-center py-6">Se incarca...</div>
  ) : entries.length === 0 ? (
    <div className="text-xs text-gray-600 text-center py-6">Nu exista inregistrari.</div>
 ) : (
    <div className="p-2 space-y-1.5">
   {entries.map((entry) => {
   const task = tasksById[entry.task_id];
   const author = profilesById[entry.performed_by];
   return (
     <div key={entry.id} className="text-xs text-gray-400 border-l-2 border-gray-800 pl-2 py-0.5">
   <span className="text-gray-600">{formatDateTime(entry.created_at)}</span>{" "}
    <span className="text-gray-300 font-medium">{author?.full_name || "cineva"}</span>{" "}
   {ACTION_LABELS[entry.action] || entry.action}{" "}
   <span className="text-gray-300">{task ? `"${task.title}"` : "(task sters)"}</span>
    </div>
   );
   })}
</div>
)}
   </div>
)}
</div>
);
}
