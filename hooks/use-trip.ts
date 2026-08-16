"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Trip } from "@/types/trip";
import { loadTrip, saveTrip } from "@/lib/storage";

export type TripState = Trip | null | "loading";

/**
 * Loads a trip from localStorage, keeps a live ref, and exposes `update`
 * which applies a pure mutation, saves immediately, and re-renders.
 */
export function useTrip(id: string | null | undefined) {
  const [trip, setTrip] = useState<TripState>("loading");
  const ref = useRef<Trip | null>(null);

  useEffect(() => {
    if (!id) {
      ref.current = null;
      setTrip(null);
      return;
    }
    const loaded = loadTrip(id);
    ref.current = loaded;
    setTrip(loaded);
  }, [id]);

  const update = useCallback((mutator: (t: Trip) => Trip) => {
    const current = ref.current;
    if (!current) return;
    const next = { ...mutator(current), updatedAt: Date.now() };
    ref.current = next;
    setTrip(next);
    saveTrip(next);
  }, []);

  const reset = useCallback((t: Trip) => {
    ref.current = t;
    setTrip(t);
  }, []);

  return { trip, update, reset };
}
