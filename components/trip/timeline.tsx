"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Activity, Day } from "@/types/trip";
import { DragCard, SortableActivityItem } from "@/components/trip/activity-item";

interface TimelineProps {
  day: Day;
  currency: string;
  onEdit: (activity: Activity) => void;
  onDuplicate: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onReorder: (fromId: string, toId: string) => void;
}

export function Timeline({
  day,
  currency,
  onEdit,
  onDuplicate,
  onDelete,
  onReorder,
}: TimelineProps) {
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveActivity(
      day.activities.find((a) => a.id === event.active.id) ?? null
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveActivity(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  };

  if (day.activities.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveActivity(null)}
    >
      <SortableContext
        items={day.activities.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-2">
          {day.activities.map((activity) => (
            <SortableActivityItem
              key={activity.id}
              activity={activity}
              currency={currency}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay
        dropAnimation={{ duration: 200, easing: "cubic-bezier(0.21, 1.02, 0.73, 1)" }}
      >
        {activeActivity ? (
          <DragCard activity={activeActivity} currency={currency} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Pure helper so the page can reorder without importing dnd-kit. */
export function moveActivity(
  activities: Activity[],
  fromId: string,
  toId: string
): Activity[] {
  const fromIdx = activities.findIndex((a) => a.id === fromId);
  const toIdx = activities.findIndex((a) => a.id === toId);
  if (fromIdx === -1 || toIdx === -1) return activities;
  return arrayMove(activities, fromIdx, toIdx);
}
