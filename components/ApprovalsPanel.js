"use client";
import { useState } from "react";
import useClickOutside from "@/lib/useClickOutside";

const FIELD_LABELS = {
    	title: "Titlu",
    	description: "Descriere",
    	project_id: "Proiect",
    	assignee: "Responsabil",
    	start_date: "Start",
    	deadline: "Deadline",
    	urgent: "Urgent",
};

export default function ApprovalsPanel({ requests, tasksById, profilesById, onApprove, onReject }) {
    	const [open, setOpen] = useState(false);
    	const ref = useClickOutside(() => setOpen(false), open);

	return (
        		<div className="relative" ref={ref}>
        			<button
    				onClick={() => setOpen((o) => !o)}
    				title="Aprobari"
    				className="relative text-gray-400 hover:text-gray-200 hover:bg-[#181b24] p-2 rounded-md"
    			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        					<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                        					<path strokeLinecap="round" strokeLinejoin="round" d="M9 3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-.5Z" />
                        					<path strokeLinecap="round" strokeLinejoin="round" d="m9 14 2 2 4-4" />
                        </svg>
    {requests.length > 0 && (
        					<span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] leading-none font-semibold rounded-full min-w-[16px] h-4 px-[3px] flex items-center justify-center">
    {requests.length > 9 ? "9+" : requests.length}
    </span>
    				)}
</button>

{open && (
    				<div className="absolute right-0 mt-1 w-96 max-w-[90vw] bg-[#151824] border border-gray-800 rounded-lg shadow-lg z-40 max-h-[28rem] overflow-y-auto">
    					<div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
    						<span className="text-xs font-medium text-gray-400">Cereri de aprobare</span>
    </div>

 {requests.length === 0 ? (
     						<div className="text-xs text-gray-600 text-center py-6">Nu ai cereri in asteptare.</div>
  					) : (
                        						<div className="p-2 space-y-2">
                    {requests.map((r) => {
                        								const task = tasksById[r.task_id];
                        								const requester = profilesById[r.requested_by];
                        								return (
                                                            									<div key={r.id} className="border border-gray-800 rounded-md p-2.5">
                        										<div className="flex items-center justify-between gap-2">
                        											<div className="min-w-0">
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
											<span className="text-xs text-gray-500 shrink-0">{requester?.full_name || "membru"}</span>
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

										<div className="flex gap-2 mt-2">
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
					)}
</div>
			)}
</div>
	);
}
