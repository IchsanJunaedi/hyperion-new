"use client";

import { useState, useCallback } from "react";
import { ChevronDown, X } from "lucide-react";
import type { EventPriority, EventStatus } from "../types";

interface PropertyFieldProps {
  label: string;
  icon?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  fieldType:
    | "text"
    | "select"
    | "tags"
    | "checkbox"
    | "user"
    | "date-time"
    | "status"
    | "priority";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  editable?: boolean;
  isEditing?: boolean;
  onEdit?: (isEditing: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function PropertyField({
  label,
  icon,
  value,
  onChange,
  fieldType,
  options = [],
  placeholder = "Tambahkan...",
  editable = true,
  isEditing: isEditingProp,
  onEdit,
}: PropertyFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [tagInput, setTagInput] = useState("");

  const handleEditToggle = useCallback(() => {
    const newState = !isEditing;
    setIsEditing(newState);
    if (onEdit) onEdit(newState);
  }, [isEditing, onEdit]);

  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(newValue);
      setIsEditing(false);
      if (onEdit) onEdit(false);
    },
    [onChange, onEdit],
  );

  if (!editable) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2.5 px-3 py-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-white/60">{icon}</div>}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white/50">{label}</span>
            <span className="text-sm text-white/85">
              {Array.isArray(value) ? value.join(", ") : value || placeholder}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group rounded-lg border border-white/5 bg-white/2.5 px-3 py-2 transition hover:bg-white/5"
      onClick={editable ? handleEditToggle : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex flex-1 cursor-pointer items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleEditToggle();
          }}
        >
          {icon && <div className="text-white/60">{icon}</div>}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white/50">{label}</span>
            {!isEditing ? (
              <span className="text-sm text-white/85">
                {Array.isArray(value) ? value.join(", ") : value || placeholder}
              </span>
            ) : (
              <>
                {fieldType === "select" && (
                  <div className="relative mt-1 w-48">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex w-full items-center gap-2 rounded border border-white/20 bg-zinc-900 px-2 py-1 text-xs text-white"
                    >
                      <span className="flex-1 text-left">
                        {value
                          ? options.find((o) => o.value === value)?.label
                          : placeholder}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-full space-y-1 rounded border border-white/10 bg-zinc-800 p-1">
                        {options.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              handleChange(opt.value);
                              setDropdownOpen(false);
                            }}
                            className="w-full rounded px-2 py-1 text-left text-xs text-white/80 transition hover:bg-white/10"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {fieldType === "text" && (
                  <input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => handleChange(inputValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleChange(inputValue);
                      if (e.key === "Escape") setIsEditing(false);
                    }}
                    placeholder={placeholder}
                    className="mt-1 rounded border border-white/20 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  />
                )}

                {fieldType === "tags" && (
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(value) &&
                        value.map((tag) => (
                          <div
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                handleChange(value.filter((t: string) => t !== tag))
                              }
                              className="cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tagInput) {
                          handleChange([
                            ...(Array.isArray(value) ? value : []),
                            tagInput,
                          ]);
                          setTagInput("");
                        }
                        if (e.key === "Escape") setIsEditing(false);
                      }}
                      placeholder="Tambah tag..."
                      className="w-full rounded border border-white/20 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                )}

                {fieldType === "checkbox" && (
                  <label className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-yellow-400"
                    />
                    <span className="text-xs text-white/80">
                      {value ? "Yes" : "No"}
                    </span>
                  </label>
                )}

                {fieldType === "status" && (
                  <div className="relative mt-1 w-48">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex w-full items-center gap-2 rounded border border-white/20 bg-zinc-900 px-2 py-1 text-xs text-white"
                    >
                      <span className="flex-1 text-left">
                        {value
                          ? STATUS_OPTIONS.find((o) => o.value === value)?.label
                          : placeholder}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-full space-y-1 rounded border border-white/10 bg-zinc-800 p-1">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              handleChange(opt.value);
                              setDropdownOpen(false);
                            }}
                            className="w-full rounded px-2 py-1 text-left text-xs text-white/80 transition hover:bg-white/10"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {fieldType === "priority" && (
                  <div className="relative mt-1 w-48">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex w-full items-center gap-2 rounded border border-white/20 bg-zinc-900 px-2 py-1 text-xs text-white"
                    >
                      <span className="flex-1 text-left">
                        {value
                          ? PRIORITY_OPTIONS.find((o) => o.value === value)?.label
                          : placeholder}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-full space-y-1 rounded border border-white/10 bg-zinc-800 p-1">
                        {PRIORITY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              handleChange(opt.value);
                              setDropdownOpen(false);
                            }}
                            className="w-full rounded px-2 py-1 text-left text-xs text-white/80 transition hover:bg-white/10"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {fieldType === "date-time" && (
                  <input
                    autoFocus
                    type="datetime-local"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => handleChange(inputValue)}
                    className="mt-1 rounded border border-white/20 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-yellow-400 focus:outline-none"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
