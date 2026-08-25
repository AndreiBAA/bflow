"use client";
import { useEffect, useRef } from "react";

// Hook reutilizabil: apeleaza onOutside() cand se face click/touch in afara elementului referentiat.
// Folosire: const ref = useClickOutside(() => setOpen(false), open); <div ref={ref}>...</div>
export default function useClickOutside(onOutside, active = true) {
  	const ref = useRef(null);
  	const callbackRef = useRef(onOutside);
  	callbackRef.current = onOutside;

	useEffect(() => {
    		if (!active) return;
    		function handle(e) {
          			if (ref.current && !ref.current.contains(e.target)) {
                  				callbackRef.current?.();
                }
        }
    		document.addEventListener("mousedown", handle);
    		document.addEventListener("touchstart", handle);
    		return () => {
          			document.removeEventListener("mousedown", handle);
          			document.removeEventListener("touchstart", handle);
        };
  }, [active]);

	return ref;
}
