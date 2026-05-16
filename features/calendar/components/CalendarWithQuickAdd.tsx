"use client";

import { useState, useCallback } from "react";

import type { Database } from "@/types/database";
import { CalendarGrid } from "./CalendarGrid";
import { QuickAddEventModal } from "./QuickAddEventModal";

type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];

interface CalendarWithQuickAddProps {
  orgSlug: string;
  events: CalendarEvent[];
  year: number;
  month: number;
  divisions?: Array<{ id: string; name: string }>;
  /** If false, calendar is view-only (no click-to-create) */
  canCreate?: boolean;
}

export function CalendarWithQuickAdd({
  orgSlug,
  events,
  year,
  month,
  divisions = [],
  canCreate = true,
}: CalendarWithQuickAddProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return (
    <>
      <CalendarGrid
        orgSlug={orgSlug}
        events={events}
        year={year}
        month={month}
        canCreate={canCreate}
        onDayClick={canCreate ? handleDayClick : undefined}
      />

      {canCreate && (
        <QuickAddEventModal
          isOpen={selectedDate !== null}
          date={selectedDate}
          orgSlug={orgSlug}
          divisions={divisions}
          onClose={handleClose}
        />
      )}
    </>
  );
}
