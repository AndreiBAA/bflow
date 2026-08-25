"use client";

// Modal de confirmare unitar, folosit pentru toate actiunile distructive/importante din aplicatie.
// Props:
//  open: boolean - daca e afisat
//  title: string
//  message: string | node - text explicativ
//  confirmLabel / cancelLabel: text pe butoane
//  danger: boolean - stil rosu (actiune distructiva) vs albastru (actiune neutra, ex. arhivare)
//  loading: boolean - dezactiveaza butoanele si arata stare de asteptare
//  onConfirm / onCancel: callback-uri
export default function ConfirmDialog({
  	open,
  	title,
  	message,
  	confirmLabel = "Confirma",
  	cancelLabel = "Anuleaza",
  	danger = true,
  	loading = false,
  	onConfirm,
  	onCancel,
}) {
  	if (!open) return null;

	return (
    		<div
  			className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
  			onMouseDown={(e) => {
          				if (e.target === e.currentTarget && !loading) onCancel?.();
        }}
  		>
          			<div className="bg-[#181b24] border border-gray-700 rounded-md shadow-lg w-full max-w-sm p-4">
          				<h3 className="text-sm font-semibold text-gray-100 mb-2">{title}</h3>
  {message && <div className="text-sm text-gray-400 mb-4">{message}</div>}
   				<div className="flex justify-end gap-2">
    					<button
   						type="button"
   						disabled={loading}
   						onClick={onCancel}
   						className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-md disabled:opacity-50"
   					>
              {cancelLabel}
                </button>
   					<button
   						type="button"
   						disabled={loading}
   						onClick={onConfirm}
   						className={`text-sm px-3 py-1.5 rounded-md text-white disabled:opacity-50 ${
                							danger ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"
              }`}
  					>
  {loading ? "Se proceseaza..." : confirmLabel}
  </button>
    </div>
    </div>
    </div>
  	);
}
