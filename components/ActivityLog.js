"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("ro-RO", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ActivityLog({ taskId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  let active = true;
  async function load() {
    setLoading(true);
    const { data } = await supabase
    .from("task_activity")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
    if (active) {
      setEntries(data || []);
      setLoading(false);
    }
  }
  load();
  return () => {
    active = false;
  };
}, [taskId]);

if (loading) return <div className="text-xs text-gray-500">Se încarcă istoricul...</div>;
  if (entries.length === 0) return <div className="text-xs text-gray-600">Fără istoric încă.</div>;

const seenStatuses = new Set();

return (
  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
{entries.map((entry) => {
  let isRevert = false;
  if (entry.action === "status_change") {
    const toName = entry.detail?.to;
    if (toName && seenStatuses.has(toName)) isRevert = true;
    if (entry.detail?.from) seenStatuses.add(entry.detail.from);
  }
  return (
    <div key={entry.id} className="text-xs text-gray-400 border-l-2 border-gray-800 pl-2">
  <span className="text-gray-600">{formatDateTime(entry.created_at)}</span>{" "}
  {entry.action === "created" && <span>task creat</span>}
   {entry.action === "status_change" && (
     <span>
     status: <span className="text-gray-300">{entry.detail?.from || "—"}</span> →{" "}
   <span className="text-gray-300">{entry.detail?.to || "—"}</span>
  {isRevert && <span className="ml-1 text-yellow-500">(revenit la un status anterior)</span>}
    </span>
   )}
  {entry.action === "edit" && (
    <span>editat: {(entry.detail?.changes || []).map((c) => c.field).join(", ")}</span>
   )}
  </div>
  );
})}
</div>
);
}
