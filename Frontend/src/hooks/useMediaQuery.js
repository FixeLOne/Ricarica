import { useCallback, useSyncExternalStore } from "react";

/**
 * Vero quando la media query corrisponde.
 *
 * useSyncExternalStore invece di useState + useEffect: matchMedia e' gia' una
 * sorgente esterna con sottoscrizione, e cosi il primo render ha subito il
 * valore giusto invece di partire da false e correggersi dopo.
 */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
