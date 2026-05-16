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

import type { CalendarEvent, EventStatus, EventPriority } from "@/features/calendar/types";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface EventPropertiesProps {
  event: CalendarEvent;
  onPropertyChange: (field: string, value: any) => void;
  picProfiles?: Profile[];
  readOnly?: boolean;
}

interface PropertyFieldProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function PropertyField({ icon, label, children }: PropertyFieldProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#2D2D2D] last:border-b-0">
      <div className="flex items-center gap-2 min-w-fit pt-1">
        <div className="text-[#9B9A97] w-4 h-4 flex items-center justify-center">
          {icon}
        </div>
        <label className="text-sm text-[#9B9A97] font-medium min-w-[100px]">
          {label}
        </label>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function EventProperties({
  event,
  onPropertyChange,
  picProfiles = [],
  readOnly = false,
}: EventPropertiesProps) {
  const [selectedPicId, setSelectedPicId] = useState<string | null>(
    event.pic_id || null,
  );

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPropertyChange("starts_at", e.target.value);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPropertyChange("location", e.target.value);
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPropertyChange("platform", e.target.value);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPropertyChange("team", e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPropertyChange("status", e.target.value as EventStatus);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPropertyChange("priority", e.target.value as EventPriority);
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPicId = e.target.value || null;
    setSelectedPicId(newPicId);
    onPropertyChange("pic_id", newPicId);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(",").map((t) => t.trim());
    onPropertyChange("tags", tags.filter((t) => t.length > 0));
  };

  const handleVisualNeededChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPropertyChange("visual_needed", e.target.checked);
  };

  const selectedPic = picProfiles?.find((p) => p.id === selectedPicId);
  const tagsString = (event.tags as string[])?.join(", ") || "";

  return (
    <div className="bg-[#202020] rounded-lg border border-[#2D2D2D] p-6 space-y-0">
      {/* Date/Time */}
      <PropertyField icon={<Calendar className="w-4 h-4" />} label="Tanggal/Jam">
        <input
          type="datetime-local"
          value={event.starts_at.slice(0, 16)}
          onChange={handleDateTimeChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </PropertyField>

      {/* Area/Location */}
      <PropertyField icon={<MapPin className="w-4 h-4" />} label="Area">
        <input
          type="text"
          placeholder="Lokasi acara"
          value={event.location || ""}
          onChange={handleAreaChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </PropertyField>

      {/* Platform */}
      <PropertyField icon={<Gamepad2 className="w-4 h-4" />} label="Platform">
        <input
          type="text"
          placeholder="Contoh: Valorant, CS2, Mobile Legends"
          value={(event as any).platform || ""}
          onChange={handlePlatformChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </PropertyField>

      {/* Team */}
      <PropertyField icon={<Users className="w-4 h-4" />} label="Tim">
        <input
          type="text"
          placeholder="Nama tim"
          value={(event as any).team || ""}
          onChange={handleTeamChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </PropertyField>

      {/* Status */}
      <PropertyField icon={<CheckCircle className="w-4 h-4" />} label="Status">
        <select
          value={(event as any).status || "draft"}
          onChange={handleStatusChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </PropertyField>

      {/* Priority */}
      <PropertyField icon={<Zap className="w-4 h-4" />} label="Prioritas">
        <select
          value={(event as any).priority || "medium"}
          onChange={handlePriorityChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </PropertyField>

      {/* PIC / Person In Charge */}
      <PropertyField icon={<User className="w-4 h-4" />} label="PIC">
        <div className="flex items-center gap-3">
          <select
            value={selectedPicId || ""}
            onChange={handlePicChange}
            disabled={readOnly}
            className="flex-1 bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="">Pilih PIC</option>
            {picProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name || profile.username || "Unknown"}
              </option>
            ))}
          </select>
          {selectedPic && (
            <div className="flex items-center gap-2">
              {selectedPic.avatar_url ? (
                <img
                  src={selectedPic.avatar_url}
                  alt={selectedPic.display_name || ""}
                  className="w-8 h-8 rounded-full bg-[#2C2C2C]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#2C2C2C] flex items-center justify-center text-xs text-[#9B9A97]">
                  {(selectedPic.display_name || selectedPic.username || "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-[#E5E2E1]">
                {selectedPic.display_name || selectedPic.username}
              </span>
            </div>
          )}
        </div>
      </PropertyField>

      {/* Tags */}
      <PropertyField icon={<Tag className="w-4 h-4" />} label="Tags">
        <input
          type="text"
          placeholder="Pisahkan dengan koma (misal: scrim, practice, important)"
          value={tagsString}
          onChange={handleTagsChange}
          disabled={readOnly}
          className="w-full bg-[#191919] border border-[#2D2D2D] rounded-md px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {tagsString && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tagsString.split(",").map((tag, idx) => {
              const trimmed = tag.trim();
              return trimmed ? (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs"
                >
                  {trimmed}
                </span>
              ) : null;
            })}
          </div>
        )}
      </PropertyField>

      {/* Visual Needed */}
      <PropertyField icon={<Camera className="w-4 h-4" />} label="Visual">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={(event as any).visual_needed || false}
            onChange={handleVisualNeededChange}
            disabled={readOnly}
            className="w-5 h-5 rounded border border-[#2D2D2D] bg-[#191919] text-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-[#E5E2E1] group-hover:text-[#D4D4D4]">
            Visual content diperlukan
          </span>
        </label>
      </PropertyField>
    </div>
  );
}
