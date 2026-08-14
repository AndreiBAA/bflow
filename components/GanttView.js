"use client";

const DAY_WIDTH = 26;
const ROW_HEIGHT = 32;

function toDate(str) {
    if (!str) return null;
    const d = new Date(str + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function formatMonth(date) {
    return date.toLocaleDateString("ro-RO", { month: "short", year: "numeric" });
}

export default function GanttView({ projectOptions, tasks, statuses, onOpenTask }) {
    const tasksWithDates = tasks.filter((t) => t.deadline || t.start_date);
    const statusesById = Object.fromEntries(statuses.map((s) => [s.id, s]));

  let minDate = null;
    let maxDate = null;
    tasksWithDates.forEach((t) => {
          const s = toDate(t.start_date) || toDate(t.deadline);
          const e = toDate(t.deadline) || toDate(t.start_date);
          if (s && (!minDate || s < minDate)) minDate = s;
          if (e && (!maxDate || e > maxDate)) maxDate = e;
    });

  const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!minDate) minDate = addDays(today, -7);
    if (!maxDate) maxDate = addDays(today, 30);
    minDate = addDays(minDate, -3);
    maxDate = addDays(maxDate, 5);

  const totalDays = Math.max(1, daysBetween(minDate, maxDate));
    const timelineWidth = totalDays * DAY_WIDTH;

  const months = [];
    let cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cursor <= maxDate) {
          const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
          const start = cursor < minDate ? minDate : cursor;
          const end = next > maxDate ? maxDate : next;
          const offset = daysBetween(minDate, start) * DAY_WIDTH;
          const width = Math.max(1, daysBetween(start, end)) * DAY_WIDTH;
          months.push({ label: formatMonth(cursor), offset, width });
          cursor = next;
    }

  const todayOffset = today >= minDate && today <= maxDate ? daysBetween(minDate, today) * DAY_WIDTH : null;

  const byProject = {};
    const noProject = [];
    tasksWithDates.forEach((t) => {
          if (t.project_id) {
                  if (!byProject[t.project_id]) byProject[t.project_id] = [];
                  byProject[t.project_id].push(t);
          } else {
                  noProject.push(t);
          }
    });

  const rows = [];
    projectOptions.forEach((p) => {
          const projectTasks = byProject[p.id] || [];
          if (projectTasks.length === 0) return;
          rows.push({ type: "project", project: p });
          projectTasks
            .sort((a, b) => (a.start_date || a.deadline || "").localeCompare(b.start_date || b.deadline || ""))
            .forEach((t) => rows.push({ type: "task", task: t, depth: p.depth }));
    });
    if (noProject.length > 0) {
          rows.push({ type: "project", project: { id: "none", name: "Fara proiect", depth: 0 } });
          noProject.forEach((t) => rows.push({ type: "task", task: t, depth: 0 }));
    }

  if (rows.length === 0) {
        return (
                <div className="text-gray-500 text-sm py-10 text-center">
                  Niciun task cu data de start sau deadline inca. Adauga date la task-uri ca sa apara aici.
          </div>
        );
  }

  return (
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div style={{ minWidth: 240 + timelineWidth }}>
          <div className="flex border-b border-gray-800">
              <div className="w-60 shrink-0 px-3 py-2 text-xs font-medium text-gray-500 border-r border-gray-800 sticky left-0 bg-[#12141c] z-10">
                Proiect / Task
  </div>
            <div className="relative bg-[#12141c]" style={{ width: timelineWidth, height: 32 }}>
{months.map((m, i) => (
                  <div
                              key={i}
                   className="absolute top-0 h-full flex items-center px-2 text-xs text-gray-500 border-r border-gray-800"
                   style={{ left: m.offset, width: m.width }}
                >
{m.label}
</div>
              ))}
                </div>
                </div>

{rows.map((row, i) =>
              row.type === "project" ? (
                              <div key={`p-${row.project.id}-${i}`} className="flex bg-[#151824]">
                  <div
                  className="w-60 shrink-0 py-1.5 text-sm font-medium text-gray-200 border-r border-gray-800 sticky left-0 bg-[#151824] truncate z-10"
                  style={{ paddingLeft: 12 + row.project.depth * 14, paddingRight: 12 }}
                >
{row.project.name}
</div>
                <div className="relative" style={{ width: timelineWidth, height: ROW_HEIGHT }}>
{todayOffset !== null && (
                      <div className="absolute top-0 bottom-0 w-px bg-blue-500/40" style={{ left: todayOffset }} />
                  )}
  </div>
  </div>
            ) : (
                            <div key={row.task.id} className="flex border-t border-gray-800/60 hover:bg-[#151824]/60">
                              <div
                  className="w-60 shrink-0 py-1.5 text-xs text-gray-400 border-r border-gray-800 sticky left-0 bg-[#0f1117] truncate z-10"
                  style={{ paddingLeft: 20 + row.depth * 14, paddingRight: 12 }}
                  title={row.task.title}
                >
{row.task.title}
</div>
                <div className="relative" style={{ width: timelineWidth, height: ROW_HEIGHT }}>
{todayOffset !== null && (
                      <div className="absolute top-0 bottom-0 w-px bg-blue-500/40" style={{ left: todayOffset }} />
                  )}
{(() => {
                      const s = toDate(row.task.start_date) || toDate(row.task.deadline);
                      const e = toDate(row.task.deadline) || toDate(row.task.start_date);
                      const offset = daysBetween(minDate, s) * DAY_WIDTH;
                      const width = Math.max(DAY_WIDTH - 4, (daysBetween(s, e) + 1) * DAY_WIDTH - 4);
                      const status = statusesById[row.task.status_id];
                      return (
                                              <button
                          onClick={() => onOpenTask(row.task)}
                          title={row.task.title}
                          className="absolute top-1 rounded-md text-left px-2 text-[11px] text-white font-medium truncate hover:opacity-80"
                         style={{
                                                     left: offset + 2,
                                                     width,
                                                     height: ROW_HEIGHT - 8,
                                                     backgroundColor: status ? status.color : "#64748b",
                         }}
                      >
{row.task.title}
</button>
                    );
})()}
  </div>
  </div>
            )
          )}
              </div>
              </div>
              </div>
  );
}
