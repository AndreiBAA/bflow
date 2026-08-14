"use client";

const FIELD_LABELS = {
    title: "Titlu",
    description: "Descriere",
    project_id: "Proiect",
    assignee: "Responsabil",
    start_date: "Start",
    deadline: "Deadline",
    urgent: "Urgent",
};

export default function ApprovalsPanel({ requests, tasksById, profilesById, onApprove, onReject, onClose }) {
    return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-[#151824] border border-gray-800 rounded-lg w-full max-w-2xl p-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Cereri de aprobare</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
                  X
      </button>
      </div>

  {requests.length === 0 && (
              <div className="text-sm text-gray-500 py-6 text-center">Nu ai cereri in asteptare.</div>
           )}

        <div className="space-y-3">
        {requests.map((r) => {
                      const task = tasksById[r.task_id];
                      const requester = profilesById[r.requested_by];
                      return (
                                      <div key={r.id} className="border border-gray-800 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-gray-200 font-medium">
        {task ? task.title : "(task sters)"}
</span>
                    <span
                      className={`ml-2 text-[11px] px-1.5 py-0.5 rounded-md ${
                                                r.type === "delete" ? "bg-red-950 text-red-400" : "bg-blue-950 text-blue-400"
                      }`}
                    >
{r.type === "delete" ? "cerere stergere" : "cerere editare"}
</span>
  </div>
                  <span className="text-xs text-gray-500">{requester?.full_name || "membru"}</span>
  </div>

{r.type === "edit" && r.payload && (
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
{Object.entries(r.payload).map(([field, value]) => (
                        <div key={field}>
                          <span className="text-gray-500">{FIELD_LABELS[field] || field}:</span>{" "}
                        <span className="text-gray-300">{value === null || value === "" ? "-" : String(value)}</span>
                               </div>
                                                   ))}
</div>
                )}

                <div className="flex gap-2 mt-3">
                                    <button
                    onClick={() => onApprove(r)}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-md"
                  >
                                          Aproba
                      </button>
                  <button
                    onClick={() => onReject(r)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2.5 py-1 rounded-md"
                  >
                                          Respinge
                      </button>
                      </div>
                      </div>
            );
})}
</div>
  </div>
  </div>
  );
}
