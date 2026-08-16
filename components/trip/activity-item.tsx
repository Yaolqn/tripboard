"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Activity } from "@/types/trip";
import { TYPE_META } from "@/lib/trip-utils";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SortableActivityItemProps {
  activity: Activity;
  currency: string;
  onEdit: (activity: Activity) => void;
  onDuplicate: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

export function SortableActivityItem({
  activity,
  currency,
  onEdit,
  onDuplicate,
  onDelete,
}: SortableActivityItemProps) {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const meta = TYPE_META[activity.type];
  const href = activity.url
    ? /^https?:\/\//i.test(activity.url)
      ? activity.url
      : `https://${activity.url}`
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("group relative flex gap-3", isDragging && "z-10 opacity-40")}
    >
      {/* drag handle */}
      <div className="w-4 shrink-0 pt-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("dragToReorder")}
          className="touch-none cursor-grab rounded-md p-0.5 text-muted-foreground/40 transition-opacity hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100"
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>

      {/* time */}
      <div className="w-11 shrink-0 pt-[7px] text-right text-xs tabular-nums text-muted-foreground">
        {activity.time || ""}
      </div>

      {/* vertical line + dot */}
      <div className="relative w-px shrink-0 self-stretch bg-border/80">
        <span
          className={cn(
            "absolute left-1/2 top-[9px] size-[7px] -translate-x-1/2 rounded-full",
            meta.dot
          )}
        />
      </div>

      {/* content */}
      <div className="min-w-0 flex-1 pb-5">
        <div className="-mx-2 flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <meta.icon className={cn("size-3.5 shrink-0", meta.accent)} />
              <span className="truncate text-sm font-medium">{activity.title}</span>
            </div>
            {activity.location && (
              <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {activity.location}
              </div>
            )}
            {(activity.notes || href) && (
              <div className="mt-1 space-y-0.5">
                {activity.notes && (
                  <p className="line-clamp-2 text-[13px] leading-snug text-muted-foreground/90">
                    {activity.notes}
                  </p>
                )}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex max-w-full items-center gap-1 truncate text-[13px] text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground"
                  >
                    {activity.url}
                  </a>
                )}
              </div>
            )}
            {typeof activity.cost === "number" && (
              <div className="mt-1.5 inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium tabular-nums text-secondary-foreground">
                {formatMoney(activity.cost, currency)}
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("activityActions")}
                className="rounded-md p-1 text-muted-foreground/50 transition-opacity hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:opacity-0 md:group-hover:opacity-100"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(activity)}>
                <Pencil />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDuplicate(activity)}>
                <Copy />
                {t("duplicate")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(activity)}
              >
                <Trash2 />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/** Elevated card shown while dragging (via DragOverlay). */
export function DragCard({
  activity,
  currency,
}: {
  activity: Activity;
  currency: string;
}) {
  const meta = TYPE_META[activity.type];
  return (
    <div className="flex w-72 items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 shadow-lg">
      <meta.icon className={cn("size-4 shrink-0", meta.accent)} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {activity.title}
      </span>
      {typeof activity.cost === "number" && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatMoney(activity.cost, currency)}
        </span>
      )}
    </div>
  );
}
