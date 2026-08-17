"use client";

function formatDeadline(deadline) {
      if (!deadline) return null;
      const d = new Date(deadline);
      return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
}

function isOverdue(deadline) {
      if (!deadline) return false;
      const d = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d < today;
}

export default function TaskCard({ task, onOpen }) {
      function handleDragStart(e) {
              e.dataTransfer.setData("application/json", JSON.stringify(task));
      }

  const overdue = isOverdue(task.deadline);
      const projectColor = task.project_color || null;
      const projectBadgeClass = projectColor
        ? "text-[11px] px-1.5 py-0.5 rounded-md"
              : "text-[11px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-md";
      const projectBadgeStyle = projectColor
        ? { backgroundColor: projectColor + "26", color: projectColor, border: `1px solid ${projectColor}55` }
              : undefined;

  return (
          <div
          draggable
          onDragStart={handleDragStart}
          onClick={() => onOpen(task)}
          className="bg-[#181b24] border border-gray-800 hover:border-gray-600 rounded-md p-2.5 cursor-pointer transition-colors"
        >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-100 font-medium leading-snug">{task.title}</span>
    {task.urgent && (
                  <span title="Urgent" className="text-red-500 text-xs shrink-0">
                    *
        </span>
             )}
    </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
    {task.project_name && (
                  <span className={projectBadgeClass} style={projectBadgeStyle}>
    {task.project_name}
        </span>
            )}
{task.assignee && <span className="text-[11px] text-gray-500">{task.assignee}</span>}
 {task.deadline && (
               <span
              className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                                overdue ? "bg-red-950 text-red-400" : "bg-gray-800 text-gray-400"
}`}
           >
 {formatDeadline(task.deadline)}
 </span>
         )}
</div>
    </div>
  );
}
