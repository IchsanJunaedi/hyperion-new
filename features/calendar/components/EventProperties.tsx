"use client";

import {
  Calendar,
  Camera,
  Gamepad2,
  MapPin,
  Tag,
  User,
  Users,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { PropertyField } from "./PropertyField";
import type { CalendarEvent } from "../types";

interface EventPropertiesProps {
  event: CalendarEvent;
  onPropertyChange: (field: string, value: unknown) => void;
  readOnly?: boolean;
}

export function EventProperties({
  event,
  onPropertyChange,
  readOnly = false,
}: EventPropertiesProps) {
  const handlePropertyChange = (field: string, value: unknown) => {
    onPropertyChange(field, value);
  };

  return (
    <div className="space-y-0.5 rounded-xl border border-white/10 bg-zinc-900/40 p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-white/80">Properties</h3>

      <PropertyField
        label="Tanggal & Waktu"
        icon={<Calendar className="h-4 w-4" />}
        value={event.starts_at}
        onChange={(value) => handlePropertyChange("starts_at", value)}
        fieldType="date-time"
        editable={!readOnly}
      />

      <PropertyField
        label="Area"
        icon={<MapPin className="h-4 w-4" />}
        value={event.area || ""}
        onChange={(value) => handlePropertyChange("area", value)}
        fieldType="text"
        placeholder="Lokasi acara..."
        editable={!readOnly}
      />

      <PropertyField
        label="Platform"
        icon={<Gamepad2 className="h-4 w-4" />}
        value={event.platform || ""}
        onChange={(value) => handlePropertyChange("platform", value)}
        fieldType="text"
        placeholder="Discord, LAN, Online..."
        editable={!readOnly}
      />

      <PropertyField
        label="Tim"
        icon={<Users className="h-4 w-4" />}
        value={event.division_id || ""}
        onChange={(value) => handlePropertyChange("division_id", value)}
        fieldType="text"
        placeholder="Divisi atau tim..."
        editable={!readOnly}
      />

      <PropertyField
        label="Status"
        icon={<CheckCircle className="h-4 w-4" />}
        value={event.status || "confirmed"}
        onChange={(value) => handlePropertyChange("status", value)}
        fieldType="status"
        editable={!readOnly}
      />

      <PropertyField
        label="Prioritas"
        icon={<Zap className="h-4 w-4" />}
        value={event.priority || "medium"}
        onChange={(value) => handlePropertyChange("priority", value)}
        fieldType="priority"
        editable={!readOnly}
      />

      <PropertyField
        label="PIC (Person In Charge)"
        icon={<User className="h-4 w-4" />}
        value={event.pic_user_id || ""}
        onChange={(value) => handlePropertyChange("pic_user_id", value)}
        fieldType="text"
        placeholder="Nama atau email..."
        editable={!readOnly}
      />

      <PropertyField
        label="Tags"
        icon={<Tag className="h-4 w-4" />}
        value={event.tags || []}
        onChange={(value) => handlePropertyChange("tags", value)}
        fieldType="tags"
        editable={!readOnly}
      />

      <PropertyField
        label="Visual Diperlukan"
        icon={<Camera className="h-4 w-4" />}
        value={event.visual_needed || false}
        onChange={(value) => handlePropertyChange("visual_needed", value)}
        fieldType="checkbox"
        editable={!readOnly}
      />
    </div>
  );
}
