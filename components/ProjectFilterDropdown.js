"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// statusuri considerate "finale" - un proiect/subproiect e "done" doar daca toate task-urile lui sunt in aceste statusuri
const DONE_STATUS_NAMES = ["Finalizat", "Anulat"];

export default function ProjectFilterDropdown({ projects, tasks, statuses, value, onChange }) {
  	const [open, setOpen] = useState(false);
  	const [search, setSearch] = useState("");
  	const rootRef = useRef(null);

	useEffect(() => {
    		function handleClick(e) {
          			if (rootRef.current && !rootRef.current.contains(e.target)) {
                  				setOpen(false);
                  				setSearch("");
                }
        }
    		document.addEventListener("mousedown", handleClick);
    		return () => document.removeEventListener("mousedown", handleClick);
  }, []);

	const statusById = useMemo(() => Object.fromEntries((statuses || []).map((s) => [s.id, s])), [statuses]);

	// lista aplatizata: proiect parinte, apoi subproiectele lui, cu adancime pentru indentare (aceeasi logica ca inainte)
	const flat = useMemo(() => {
    		const byParent = {};
    		for (const p of projects || []) {
          			const key = p.parent_id || "root";
          			if (!byParent[key]) byParent[key] = [];
          			byParent[key].push(p);
        }
    		Object.values(byParent).forEach((arr) => arr.sort((a, b) => a.position - b.position));
    		const out = [];
    		function walk(parentKey, depth) {
          			for (const p of byParent[parentKey] || []) {
                  				out.push({ ...p, depth });
                  				walk(p.id, depth + 1);
                }
        }
    		walk("root", 0);
    		return out;
  }, [projects]);

	function descendantIds(projectId) {
    		const ids = [projectId];
    		const children = (projects || []).filter((p) => p.parent_id === projectId);
    		for (const c of children) ids.push(...descendantIds(c.id));
    		return ids;
  }

	const statsById = useMemo(() => {
    		const map = {};
    		for (const p of flat) {
          			const ids = descendantIds(p.id);
          			const projectTasks = (tasks || []).filter((t) => ids.includes(t.project_id));
          			const counts = {};
          			for (const t of projectTasks) {
                  				if (!t.status_id) continue;
                  				counts[t.status_id] = (counts[t.status_id] || 0) + 1;
                }
          			const segments = (statuses || [])
          				.filter((s) => counts[s.id])
          				.sort((a, b) => a.position - b.position)
          				.map((s) => ({ id: s.id, color: s.color, count: counts[s.id] }));
          			const total = projectTasks.length;
          			const done =
                  				total > 0 &&
                  				projectTasks.every((t) => {
                            					const s = statusById[t.status_id];
                            					return s && DONE_STATUS_NAMES.includes(s.name);
                          });
          			map[p.id] = { total, segments, done };
        }
    		return map;
    		// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat, tasks, statuses, statusById]);

	const hasChildren = (id) => (projects || []).some((p) => p.parent_id === id);

	function labelFor(p) {
    		if (p.depth === 0 && hasChildren(p.id)) return `Tot proiectul (${p.name})`;
    		return p.name;
  }

	const selected = flat.find((p) => p.id === value);
  	const selectedLabel = value && selected ? labelFor(selected) : "Toate proiectele";

	const filtered = search.trim()
  		? flat.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    		: flat;

	function select(id) {
    		onChange(id);
    		setOpen(false);
    		setSearch("");
  }

	return (
    		<div className="relative" ref={rootRef}>
    			<button
  				type="button"
  				onClick={() => setOpen((o) => !o)}
  				className="flex items-center gap-2 bg-[#181b24] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-300 min-w-[190px] max-w-[280px] hover:border-gray-600"
  			>
            				<span className="truncate flex-1 text-left">{selectedLabel}</span>
  				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 shrink-0 text-gray-500">
            					<path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
            </button>

  {open && (
    				<div className="absolute left-0 mt-1 z-40 w-max min-w-[300px] max-w-[min(92vw,680px)] bg-[#151824] border border-gray-800 rounded-lg shadow-lg overflow-hidden">
    					<div className="p-2 border-b border-gray-800">
    						<input
   							autoFocus
   							value={search}
   							onChange={(e) => setSearch(e.target.value)}
   							placeholder="Cauta proiect..."
   							className="w-full bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-600"
   						/>
                  </div>
   					<div className="max-h-[420px] overflow-y-auto py-1">
                  						<button
   							type="button"
   							onClick={() => select("")}
   							className={`w-full flex items-center px-3 py-1.5 text-sm text-left hover:bg-[#181b24] whitespace-nowrap ${
                  								!value ? "text-blue-400" : "text-gray-300"
                }`}
  						>
							Toate proiectele
                </button>
  {filtered.length === 0 ? (
    							<div className="px-3 py-3 text-xs text-gray-600">Niciun proiect gasit.</div>
   						) : (
                							filtered.map((p) => {
                								const isTop = p.depth === 0;
                								const label = labelFor(p);
                								const stat = statsById[p.id] || { total: 0, segments: [], done: false };
                								return (
                                  									<button
                										type="button"
                										key={p.id}
                                           										onClick={() => select(p.id)}
   										title={label}
   										style={{ paddingLeft: `${12 + p.depth * 14}px` }}
  										className={`w-full flex items-center gap-2 pr-3 py-1.5 text-sm text-left whitespace-nowrap hover:bg-[#181b24] ${
                        											value === p.id ? "bg-[#181b24]" : ""
                      } ${isTop ? "font-medium text-gray-200" : "text-gray-300"}`}
									>
										<span className="truncate flex-1 min-w-0">{label}</span>
{stat.total > 0 && (
  											<span className="flex items-center gap-1 shrink-0">
{stat.segments.map((seg) => (
  													<span
                   														key={seg.id}
														title={String(seg.count)}
														className="min-w-[16px] h-[16px] px-1 rounded text-[9px] font-medium text-white flex items-center justify-center"
														style={{ backgroundColor: seg.color }}
													>
{seg.count}
</span>
												))}
												<span
													className={`ml-0.5 text-xs leading-none ${stat.done ? "text-green-400" : "text-transparent"}`}
													title={stat.done ? "Toate task-urile sunt finalizate" : ""}
												>
													✓
                            </span>
                            </span>
										)}
</button>
								);
})
						)}
</div>
  </div>
			)}
</div>
	);
}
