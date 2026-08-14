"use client";
import { useState } from "react";

export default function NotificationsBell({ notifications, onMarkRead, onMarkAllRead }) {
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.read).length;

  return (
        <div className="relative">
          <button
          onClick={() => setOpen((o) => !o)}
          className="relative text-gray-400 hover:text-gray-200 px-2 py-1.5"
          title="Notificari"
        >
                    <span className="text-sm">Notificari</span>
  {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
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
