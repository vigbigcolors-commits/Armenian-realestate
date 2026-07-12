import { useEffect, useState } from "react";

/** Debounce value for real-time filters (price sliders). */
export function useDebouncedValue<T>(value: T, delayMs = 320): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
