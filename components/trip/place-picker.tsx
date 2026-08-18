"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, X } from "lucide-react";
import type { Place } from "@/types/place";
import { searchPlaces, PlaceSearchError } from "@/lib/amap-places-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PlacePickerProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: Place) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function PlacePicker({
  value,
  onChange,
  onSelect,
  placeholder = "搜索地点",
  id,
  className,
  disabled = false,
}: PlacePickerProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = value.trim();
    requestRef.current?.abort();
    if (!query) {
      setPlaces([]);
      setOpen(false);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchPlaces(query, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setPlaces(result.places);
        setConfigured(result.configured);
        setOpen(result.configured);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof PlaceSearchError ? cause.message : "搜索失败，请稍后重试");
        setOpen(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectPlace = (place: Place) => {
    onChange(place.name);
    onSelect?.(place);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="pr-16 pl-9"
          onFocus={() => {
            if (places.length || error || !configured) setOpen(true);
          }}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
          {loading && <Loader2 className="mr-1 size-4 animate-spin text-muted-foreground" aria-label="搜索中" />}
          {value && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="清除地点"
              onClick={() => onChange("")}
            >
              <X className="size-4" />
            </Button>
          )}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
          {error ? (
            <p className="px-3 py-3 text-sm text-destructive">{error}</p>
          ) : !configured ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">地点搜索未配置，可直接输入地点</p>
          ) : places.length ? (
            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {places.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === place.name}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent"
                    onClick={() => selectPlace(place)}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{place.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{place.address || "暂无地址"}</span>
                    </span>
                    {value === place.name && <Check className="mt-0.5 size-4 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">未找到相关地点，可直接使用当前输入</p>
          )}
        </div>
      )}
    </div>
  );
}
