"use client";
import { useState } from "react";
import ActivityLog from "./ActivityLog";
import ConfirmDialog from "./ConfirmDialog";
import useClickOutside from "@/lib/useClickOutside";

const emptyForm = {
        	title: "",
        	description: "",
        	project_id: "",
        	assignee: "",
        	start_date: "",
        	deadline: "",
        	urgent: false,
        	status_id: "",
};

export default function TaskModal({ task, statuses, projectOptions, profilesAll, onClose, onSave, onDelete, onRestore, isPrivileged, onPermanentDelete }) {
        	const [form, setForm] = useState(
                        		task
                        			? {
                                                        				title: task.title || "",
                                                        				description: task.description || "",
                                                        				project_id: task.project_id || "",
                                                        				assignee: task.assignee || "",
                                                        				start_date: task.start_date || "",
                                                        				deadline: task.deadline || "",
                                                        				urgent: !!task.urgent,
                                                        				status_id: task.status_id || statuses[0]?.id || "",
                                                }
                        			: { ...emptyForm, status_id: statuses[0]?.id || "" }
                        	);
        	const [assigneeInput, setAssigneeInput] = useState("");
        	const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
	const [confirmPermanentDeleteOpen, setConfirmPermanentDeleteOpen] = useState(false);
        	const assigneeBoxRef = useClickOutside(() => setAssigneeInput(""), !!assigneeInput.trim());

	function update(field, value) {
                		setForm((prev) => ({ ...prev, [field]: value }));
        }

	const assigneeList = (form.assignee || "")
        		.split(",")
        		.map((s) => s.trim())
        		.filter(Boolean);

	function isRealUser(name) {
                		return (profilesAll || []).some(
                                        			(p) => (p.full_name || "").trim().toLowerCase() === name.trim().toLowerCase()
                                        		);
        }

	const assigneeSuggestions = (profilesAll || [])
        		.filter((p) => p.full_name)
        		.filter((p) => !assigneeList.includes(p.full_name))
        		.filter((p) => p.full_name.toLowerCase().includes(assigneeInput.trim().toLowerCase()))
        		.slice(0, 5);

	function addAssignee(name) {
                		const trimmed = (name || "").trim();
                		if (!trimmed || assigneeList.includes(trimmed)) {
                                        			setAssigneeInput("");
                                        			return;
                                }
                		update("assignee", [...assigneeList, trimmed].join(", "));
                		setAssigneeInput("");
        }

	function removeAssignee(name) {
                		update("assignee", assigneeList.filter((a) => a !== name).join(", "));
        }

	function handleSubmit(e) {
                		e.preventDefault();
                		if (!form.title.trim()) return;
                		onSave(
                                        {
                                                				...form,
                                                				project_id: form.project_id || null,
                                                				start_date: form.start_date || null,
                                                				deadline: form.deadline || null,
                                        },
                                        			task
                                        		);
        }

	return (
                		<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                			<div className="bg-[#151824] border border-gray-800 rounded-lg w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
                				<div className="flex items-center justify-between mb-4">
                					<h2 className="text-lg font-semibold text-gray-100">{task ? "Editeaza task" : "Task nou"}</h2>
					<button onClick={onClose} className="text-gray-500 hover:text-gray-300">
        						X
        </button>
        </div>

				<form onSubmit={handleSubmit} className="space-y-3">
        					<div>
        						<label className="text-xs text-gray-500">Titlu</label>
						<input
							autoFocus
							value={form.title}
							onChange={(e) => update("title", e.target.value)}
							className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
							required
						/>
                                                                </div>

					<div>
                                                                						<label className="text-xs text-gray-500">Descriere</label>
						<textarea
							value={form.description}
							onChange={(e) => update("description", e.target.value)}
							rows={3}
							className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
						/>
                                                                </div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                						<div>
                                                                							<label className="text-xs text-gray-500">Proiect</label>
							<select
								value={form.project_id}
								onChange={(e) => update("project_id", e.target.value)}
								className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
							>
                                                                        								<option value="">- fara proiect -</option>
{(projectOptions || []).map((p) => (
        									<option key={p.id} value={p.id}>
{" ".repeat(p.depth) + p.name}
</option>
								))}
</select>
        </div>
						<div>
        							<label className="text-xs text-gray-500 flex items-center gap-2">
        								Responsabil
								<span className="flex items-center gap-1 text-[10px] text-gray-600 normal-case">
        									<span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> cont
									<span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1" /> text
        </span>
        </label>
							<div className="mt-1 flex flex-wrap gap-1 mb-1">
{assigneeList.map((name) => {
        									const realUser = isRealUser(name);
        									return (
                                                                                        										<span
        											key={name}
        											title={realUser ? "Cont in platforma" : "Text liber (fara cont)"}
                  											className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
        												realUser
        													? "bg-blue-600/20 border-blue-600 text-blue-300"
                                                                        													: "bg-amber-600/20 border-amber-600 text-amber-300"
                                                                }`}
										>
{name}
											<button
												type="button"
												onClick={() => removeAssignee(name)}
												className="hover:text-white"
											>
                                                                                                        												x
                                                                                                        </button>
                                                                                                        </span>
									);
})}
</div>
							<div className="relative" ref={assigneeBoxRef}>
        								<input
									value={assigneeInput}
									onChange={(e) => setAssigneeInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
                                                                                        											e.preventDefault();
                                                                                        											addAssignee(assigneeInput);
                                                                                }
                                                                        }}
									placeholder="Adauga responsabil..."
									className="w-full bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
								/>
                                                                        {assigneeInput.trim() && assigneeSuggestions.length > 0 && (
                                                                                									<div className="absolute z-10 mt-1 w-full bg-[#181b24] border border-gray-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                                        {assigneeSuggestions.map((p) => (
                                                                                											<button
                                                                                                 												key={p.id}
												type="button"
												onClick={() => addAssignee(p.full_name)}
												className="w-full text-left px-2 py-1.5 text-sm text-gray-300 hover:bg-[#232733]"
											>
                                                                                                        {p.full_name}
                                                                                                        </button>
										))}
                                                                                        </div>
								)}
</div>
                                                                        </div>
                                                                        </div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        						<div>
                                                                        							<label className="text-xs text-gray-500">Start</label>
							<input
								type="date"
								value={form.start_date || ""}
								onChange={(e) => update("start_date", e.target.value)}
								className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
							/>
                                                                        </div>
						<div>
                                                                        							<label className="text-xs text-gray-500">Deadline</label>
							<input
								type="date"
								value={form.deadline || ""}
								onChange={(e) => update("deadline", e.target.value)}
								className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
							/>
                                                                        </div>
                                                                        </div>

					<div>
                                                                        						<label className="text-xs text-gray-500">Status</label>
						<select
							value={form.status_id}
							onChange={(e) => update("status_id", e.target.value)}
							className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200"
						>
                                                        {statuses.map((s) => (
                                                                								<option key={s.id} value={s.id}>
                                                                {s.name}
                                                                </option>
                                                                      							))}
</select>
        </div>

					<label className="flex items-center gap-2 text-sm text-gray-400">
        						<input
							type="checkbox"
							checked={form.urgent}
							onChange={(e) => update("urgent", e.target.checked)}
							className="accent-red-500"
						/>
                                                                						Marcheaza ca urgent
                                                                </label>

					<div className="flex items-center justify-between pt-2">
                                                                						<div>
                                                        {task && (
                                                                								task.archived ? (
<>
															<button                                                             									<button
                                                                										type="button"
                                                                										onClick={() => onRestore && onRestore(task)}
										className="text-sm text-blue-400 hover:text-blue-300"
									>
                                                                                        										Restaureaza task
                                                                                        </button>
{isPrivileged && (
	<button
	type="button"
 onClick={() => setConfirmPermanentDeleteOpen(true)}
 className="text-sm text-red-500 hover:text-red-400 ml-3"
 >
	 Sterge definitiv
	 </button>
 )}
</>
	) : (
                                                                        									<button
										type="button"
										onClick={() => setConfirmArchiveOpen(true)}
										className="text-sm text-red-500 hover:text-red-400"
									>
                                                                                        										Arhiveaza task
                                                                                        </button>
								)
							)}
</div>
						<div className="flex gap-2">
        							<button type="button" onClick={onClose} className="text-sm text-gray-400 px-3 py-1.5">
        								Anuleaza
        </button>
                                                                                        							<button
								type="submit"
								className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md"
							>
                                                                        								Salveaza
                                                                        </button>
                                                                        </div>
                                                                        </div>
                                                                        </form>

{task && (
        				<div className="mt-5 pt-4 border-t border-gray-800">
        					<h3 className="text-xs font-medium text-gray-500 mb-2">Istoric</h3>
 					<ActivityLog taskId={task.id} />
        </div>
 			)}
			<ConfirmDialog
				open={confirmArchiveOpen}
				title="Arhiveaza task-ul?"
				message='Task-ul va fi scos din tabla (arhivat), nu sters definitiv. Il poti restaura oricand din filtrul "Arhivate".'
				confirmLabel="Arhiveaza"
				danger={false}
				onCancel={() => setConfirmArchiveOpen(false)}
				onConfirm={() => {
					setConfirmArchiveOpen(false);
                                        					onDelete(task);
                                }}
			/>
				<ConfirmDialog
				open={confirmPermanentDeleteOpen}
					title="Sterge definitiv task-ul?"
						message="Aceasta actiune este ireversibila. Task-ul va fi sters permanent din baza de date."
							confirmLabel="Sterge definitiv"
								danger={true}
									onCancel={() => setConfirmPermanentDeleteOpen(false)}
										onConfirm={() => {
											setConfirmPermanentDeleteOpen(false);
											onPermanentDelete && onPermanentDelete(task);
										}}
/>
                                </div>
                                </div>
	);
}
