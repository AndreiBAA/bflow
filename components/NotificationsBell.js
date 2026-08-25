"use client";
import { useState } from "react";
import useClickOutside from "@/lib/useClickOutside";

export default function NotificationsBell({ notifications, onMarkRead, onMarkAllRead }) {
      	const [open, setOpen] = useState(false);
      	const unreadCount = notifications.filter((n) => !n.read).length;
      	const ref = useClickOutside(() => setOpen(false), open);

	return (
            		<div className="relative" ref={ref}>
            			<button
      				onClick={() => setOpen((o) => !o)}
      				className="relative text-gray-400 hover:text-gray-200 hover:bg-[#181b24] p-2 rounded-md"
      				title="Notificari"
      			>
                                    				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    					<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                    </svg>
      {unreadCount > 0 && (
            					<span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] leading-none font-semibold rounded-full min-w-[16px] h-4 px-[3px] flex items-center justify-center">
      {unreadCount > 9 ? "9+" : unreadCount}
      </span>
      				)}
                                    </button>

{open && (
      				<div className="absolute right-0 mt-1 w-80 bg-[#151824] border border-gray-800 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto">
      					<div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
      						<span className="text-xs font-medium text-gray-400">Notificari</span>
 {unreadCount > 0 && (
       							<button onClick={onMarkAllRead} className="text-xs text-blue-400 hover:text-blue-300">
       								marcheaza tot citit
       </button>
  						)}
 </div>
 {notifications.length === 0 ? (
       						<div className="text-xs text-gray-600 text-center py-6">Nimic nou.</div>
       					) : (
       						notifications.map((n) => (
                                                							<button
                                                            								key={n.id}
                                                            								onClick={() => onMarkRead(n)}
 								className={`w-full text-left px-3 py-2 text-xs border-b border-gray-800/60 hover:bg-[#181b24] ${
                                                      									n.read ? "text-gray-500" : "text-gray-200"
                                                }`}
							>
{n.message}
</button>
						))
					)}
</div>
			)}
</div>
	);
}
