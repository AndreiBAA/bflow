"use client";
import React, { useRef, useState } from "react";

const PALETTE = ["#3b82f6", "#f97316", "#22c55e", "#ef4444", "#a855f7", "#eab308", "#06b6d4", "#ec4899", "#84cc16", "#6366f1"];

function polarPoint(cx, cy, radius, angleDeg) {
      const rad = ((angleDeg - 90) * Math.PI) / 180;
      return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

function PieChart({ title, data }) {
      const total = data.reduce((sum, d) => sum + d.value, 0);
      const cx = 70;
      const cy = 70;
      const radius = 60;
      let cumulative = 0;
      return (
              <div className="bg-[#151824] border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-200 mb-3">{title}</h3>
    {total === 0 ? (
                <div className="text-xs text-gray-600">Fara date.</div>
              ) : (
                <div className="flex items-center gap-4 flex-wrap">
                  <svg width="140" height="140" viewBox="0 0 140 140">
    {data.length === 1 ? (
                      <circle cx={cx} cy={cy} r={radius} fill={data[0].color} />
                ) : (
                                  data.map((d, i) => {
                                    const startAngle = (cumulative / total) * 360;
                                    cumulative += d.value;
                                    const endAngle = (cumulative / total) * 360;
                                    const [x1, y1] = polarPoint(cx, cy, radius, startAngle);
                                    const [x2, y2] = polarPoint(cx, cy, radius, endAngle);
                                    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                                    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                                    return <path key={i} d={path} fill={d.color} />;
                                        })
                )}
</svg>
          <div className="space-y-1 text-xs max-w-[160px]">
{data.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-300 truncate">{d.label}</span>
                          <span className="text-gray-500 shrink-0">({d.value})</span>
          </div>
                      ))}
</div>
    </div>
      )}
</div>
  );
}

function DistributionList({ title, legend, items }) {
      return (
              <div className="bg-[#151824] border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                  <h3 className="text-sm font-medium text-gray-200">{title}</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
      {legend.map((l) => (
                      <span key={l.id} className="flex items-center gap-1 text-[10px] text-gray-500">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
{l.label}
</span>
          ))}
</div>
    </div>
{items.length === 0 ? (
            <div className="text-xs text-gray-600">Fara date.</div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
{items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 bg-[#0f1117] rounded-md px-2 py-1">
                  <span className="text-xs text-gray-300 truncate flex-1" title={it.label}>{it.label}</span>
                  <span className="text-xs text-gray-500 font-medium shrink-0 w-6 text-right">{it.total}</span>
              <div className="flex items-center gap-1 shrink-0">
{it.segments.map((seg) => (
                      <span
                                     key={seg.id}
                        title={String(seg.value)}
                                                className="min-w-[18px] h-[18px] px-1 rounded text-[10px] font-medium text-white flex items-center justify-center"
                        style={{ backgroundColor: seg.color }}
                                              >
{seg.value}
</span>
                ))}
                    </div>
                    </div>
          ))}
              </div>
      )}
</div>
  );
}

function startOfWeek(date) {
      const d = new Date(date);
      const day = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      return d;
}

function addDays(date, days) {
      const d = new Date(date);
      d.setDate(d.getDate() + days);
      return d;
}

function formatDay(d) {
      return d.toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit" });
}

export default function RoadmapView({ tasks, statuses, projects }) {
      const captureRef = useRef(null);
      const [exporting, setExporting] = useState(false);
      const [copyMsg, setCopyMsg] = useState(null);

  const byStatus = statuses
        .map((s) => ({ label: s.name, color: s.color || "#6b7280", value: tasks.filter((t) => t.status_id === s.id).length }))
        .filter((d) => d.value > 0);

  const statusLegend = byStatus.map((s) => ({ id: s.label, color: s.color, label: s.label }));

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const byProjectMap = {};
      tasks.forEach((t) => {
              const key = t.project_id || "none";
              if (!byProjectMap[key]) {
                        byProjectMap[key] = {
                                    id: key,
                                    label: key === "none" ? "Fara proiect" : projectMap[key]?.name || "?",
                                    total: 0,
                                    statusCounts: {},
                        };
              }
              byProjectMap[key].total += 1;
              byProjectMap[key].statusCounts[t.status_id] = (byProjectMap[key].statusCounts[t.status_id] || 0) + 1;
      });
      const byProject = Object.values(byProjectMap)
        .map((p) => ({
                  ...p,
                  segments: statuses
                    .map((s) => ({ id: s.id, color: s.color || "#6b7280", value: p.statusCounts[s.id] || 0 }))
                    .filter((s) => s.value > 0),
        }))
        .sort((a, b) => b.total - a.total);

  const byAssigneeMap = {};
      tasks.forEach((t) => {
              const names = (t.assignee || "").split(",").map((s) => s.trim()).filter(Boolean);
              if (names.length === 0) names.push("Neasignat");
              names.forEach((n) => {
                        if (!byAssigneeMap[n]) {
                                    byAssigneeMap[n] = { id: n, label: n, total: 0, statusCounts: {} };
                        }
                        byAssigneeMap[n].total += 1;
                        byAssigneeMap[n].statusCounts[t.status_id] = (byAssigneeMap[n].statusCounts[t.status_id] || 0) + 1;
              });
      });
      const byAssignee = Object.values(byAssigneeMap)
        .map((a) => ({
                  ...a,
                  segments: statuses
                    .map((s) => ({ id: s.id, color: s.color || "#6b7280", value: a.statusCounts[s.id] || 0 }))
                    .filter((s) => s.value > 0),
        }))
        .sort((a, b) => b.total - a.total);

  const ganttTasks = tasks.filter((t) => t.start_date && t.deadline);
    let weeks = [];
    if (ganttTasks.length > 0) {
        const minStart = new Date(Math.min(...ganttTasks.map((t) => new Date(t.start_date).getTime())));
        const maxEnd = new Date(Math.max(...ganttTasks.map((t) => new Date(t.deadline).getTime())));
        let cursor = startOfWeek(minStart);
        const last = startOfWeek(maxEnd);
        while (cursor <= last) {
            weeks.push(cursor);
            cursor = addDays(cursor, 7);
        }
    }

function weekIndexOf(date) {
    const d = startOfWeek(date);
    return weeks.findIndex((w) => w.getTime() === d.getTime());
}

const statusById = Object.fromEntries(statuses.map((s) => [s.id, s]));

async function loadExportLibs() {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    return { html2canvas, jsPDF };
}

async function captureCanvas() {
    const { html2canvas } = await loadExportLibs();
    return html2canvas(captureRef.current, { backgroundColor: "#0f1117", scale: 2 });
}

async function handleExportPNG() {
    setExporting(true);
    try {
        const canvas = await captureCanvas();
        const link = document.createElement("a");
        link.download = `roadmap-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (e) {
        alert("Eroare la export PNG: " + e.message);
    } finally {
        setExporting(false);
    }
}

async function handleExportPDF() {
    setExporting(true);
    try {
        const canvas = await captureCanvas();
        const { jsPDF } = await loadExportLibs();
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`roadmap-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
        alert("Eroare la export PDF: " + e.message);
    } finally {
        setExporting(false);
    }
}

async function handleCopyImage() {
    setExporting(true);
    setCopyMsg(null);
    try {
        const canvas = await captureCanvas();
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopyMsg("Copiat! Poti face paste in PowerPoint.");
    } catch (e) {
        setCopyMsg("Copierea in clipboard nu e suportata in acest browser.");
    } finally {
        setExporting(false);
        setTimeout(() => setCopyMsg(null), 4000);
    }
}

  return (
      <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
      <h2 className="text-sm font-medium text-gray-300">Roadmap</h2>
    <div className="flex items-center gap-2">
  {copyMsg && <span className="text-xs text-gray-400">{copyMsg}</span>}
    <button disabled={exporting} onClick={handleCopyImage} className="text-xs bg-[#181b24] border border-gray-700 hover:border-gray-500 text-gray-300 px-2.5 py-1.5 rounded-md disabled:opacity-50">Copiaza imagine</button>
    <button disabled={exporting} onClick={handleExportPNG} className="text-xs bg-[#181b24] border border-gray-700 hover:border-gray-500 text-gray-300 px-2.5 py-1.5 rounded-md disabled:opacity-50">Export PNG</button>
    <button disabled={exporting} onClick={handleExportPDF} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50">Export PDF</button>
      </div>
      </div>

<div ref={captureRef} className="space-y-4 bg-[#0f1117] p-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <PieChart title="Task-uri pe status" data={byStatus} />
      <DistributionList title="Task-uri pe proiect" legend={statusLegend} items={byProject} />
      <DistributionList title="Task-uri pe responsabil" legend={statusLegend} items={byAssignee} />
      </div>

<div className="bg-[#151824] border border-gray-800 rounded-lg p-4 overflow-x-auto">
      <h3 className="text-sm font-medium text-gray-200 mb-3">Gantt saptamanal</h3>
    {weeks.length === 0 ? (
        <div className="text-xs text-gray-600">Niciun task cu data de start si deadline setate.</div>
     ) : (
         <div style={{ minWidth: weeks.length * 70 + 160 }}>
         <div className="grid gap-1" style={{ gridTemplateColumns: `160px repeat(${weeks.length}, 1fr)` }}>
<div />
    {weeks.map((w, i) => (
        <div key={i} className="text-[10px] text-gray-500 text-center pb-1 border-b border-gray-800">{formatDay(w)}</div>
               ))}
{ganttTasks.map((t, gi) => {
    const startIdx = weekIndexOf(new Date(t.start_date));
    const endIdx = weekIndexOf(new Date(t.deadline));
    const color = statusById[t.status_id]?.color || "#3b82f6";
    return (
        <React.Fragment key={t.id}>
                <div style={{ gridRow: gi + 2 }} className="text-xs text-gray-400 truncate py-1 pr-2">{t.title}</div>
<div style={{ gridColumn: `${startIdx + 2} / ${endIdx + 3}`, gridRow: gi + 2, backgroundColor: color }} className="h-4 rounded-md self-center" title={t.title} />
    </React.Fragment>
);
})}
</div>
    </div>
)}
</div>
    </div>
    </div>
);
}
