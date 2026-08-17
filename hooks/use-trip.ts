"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Trip } from "@/types/trip";
import * as data from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type TripState = Trip | null | "loading";

interface UseTripResult {
  trip: TripState;
  update: (mutator: (t: Trip) => Trip) => void;
  /** true when a cloud save is pending/in flight */
  saving: boolean;
  /** true when a cloud save failed and we're offline-pending */
  offline: boolean;
  mode: "cloud" | "local";
}

/**
 * Loads a trip through the unified data layer (cloud when signed in,
 * localStorage for guests), applies optimistic updates and debounces the
 * cloud persistence.
 */
export function useTrip(id: string | null | undefined): UseTripResult {
  const [trip, setTrip] = useState<TripState>("loading");
  const [saving, setSaving] = useState(false);
  const [offline, setOffline] = useState(false);
  const ref = useRef<Trip | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!id) {
      ref.current = null;
      setTrip(null);
      return;
    }
    let cancelled = false;
    setTrip("loading");
    data
      .getTrip(id)
      .then((t) => {
        if (cancelled) return;
        ref.current = t;
        setTrip(t);
      })
      .catch(() => {
        if (cancelled) return;
        ref.current = null;
        setTrip(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const persist = useCallback(async (tripToSave: Trip) => {
    try {
      await data.saveTrip(tripToSave);
      if (mounted.current) setOffline(false);
    } catch {
      if (mounted.current) setOffline(true);
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, []);

  const update = useCallback(
    (mutator: (t: Trip) => Trip) => {
      const current = ref.current;
      if (!current) return;
      const next = { ...mutator(current), updatedAt: Date.now() };
      ref.current = next;
      setTrip(next);

      // local mode persists immediately; cloud mode debounces (600ms).
      if (!isSupabaseConfigured()) {
        void persist(next);
        return;
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaving(true);
        void persist(next);
      }, 600);
    },
    [persist]
  );

  // Retry pending saves when the connection comes back.
  useEffect(() => {
    if (!offline) return;
    const retry = () => {
      const current = ref.current;
      if (current) {
        setSaving(true);
        void persist(current);
      }
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [offline, persist]);

  return {
    trip,
    update,
    saving,
    offline,
    mode: isSupabaseConfigured() ? "cloud" : "local",
  };
}
