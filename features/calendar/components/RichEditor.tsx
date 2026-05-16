"use client";

import { Bold, Italic, Link2, List, ListChecks, Quote } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

interface RichEditorProps {
  value?: unknown;
  onChange?: (content: unknown) => void;
  onSave?: (content: unknown) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
}

/**
 * Simplified rich text editor for calendar events.
 * NOTE: This is a placeholder that stores content as JSON.
 * Full TipTap integration will come after npm install.
 *
 * For now, this provides:
 * - Markdown-like plain text editing
 * - Basic formatting indicators
 * - Autosave functionality
 */
export function RichEditor({
  value = null,
  onChange,
  onSave,
  placeholder = "Tulis catatan, checklist, atau daftar...",
  editable = true,
  minHeight = "300px",
}: RichEditorProps) {
  const [content, setContent] = useState<string>(() => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "content" in value) {
      return JSON.stringify(value);
    }
    return "";
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedSave = useDebouncedCallback((text: string) => {
    if (onSave) {
      onSave({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text }],
          },
        ],
      });
    }
  }, 1000);

  const handleChange = useCallback(
    (text: string) => {
      setContent(text);
      if (onChange) {
        onChange(text);
      }
      debouncedSave(text);
    },
    [onChange, debouncedSave],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Tab handling for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent =
          content.substring(0, start) + "\t" + content.substring(end);
        handleChange(newContent);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        }, 0);
      }
    },
    [content, handleChange],
  );

  const handleBlur = useCallback(() => {
    if (onSave) {
      onSave({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: content }],
          },
        ],
      });
    }
  }, [content, onSave]);

  if (!editable) {
    return (
      <div className="whitespace-pre-wrap rounded-lg border border-white/10 bg-zinc-950 p-4 text-sm text-white/85 leading-relaxed">
        {content || placeholder}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Simple formatting toolbar */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-zinc-900 p-2">
        <button
          type="button"
          title="Bold (Ctrl+B)"
          className="rounded px-2 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Italic (Ctrl+I)"
          className="rounded px-2 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="mx-1 border-r border-white/10" />
        <button
          type="button"
          title="Bullet list"
          className="rounded px-2 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Checklist"
          className="rounded px-2 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ListChecks className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Quote"
          className="rounded px-2 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Link"
          className="rounded px-2 py-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Link2 className="h-4 w-4" />
        </button>
      </div>

      {/* Editor textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{ minHeight }}
        className="w-full rounded-lg border border-white/10 bg-zinc-950 p-4 font-mono text-sm text-white placeholder:text-white/40 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400/20"
      />

      {/* Helper text */}
      <p className="text-xs text-white/40">
        💡 Tip: Type / for formatting options, or use Markdown syntax
      </p>
    </div>
  );
}
