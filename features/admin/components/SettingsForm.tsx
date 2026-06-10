"use client";

import { useState } from "react";
import { toast } from "sonner";
import { upsertSiteSettings } from "@/features/admin/actions";

export interface SettingsField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

interface Props {
  fields: SettingsField[];
  initialValues: Record<string, string>;
  title: string;
}

const SettingsForm = ({ fields, initialValues, title }: Props) => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, initialValues[f.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await upsertSiteSettings(values);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success("Pengaturan disimpan");
  };

  const inputClass =
    "w-full border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text outline-none transition focus:border-[#F5C400]/50 placeholder:text-ui-text-muted";
  const labelClass = "mb-1 block text-xs font-medium text-ui-text-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">{title}</h1>
      <div className="space-y-4 rounded border border-ui-border bg-ui-bg p-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label className={labelClass}>{field.label}</label>
            {field.multiline ? (
              <textarea
                className={inputClass + " min-h-[80px] resize-y"}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            ) : (
              <input
                className={inputClass}
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="cursor-pointer border border-[#F5C400] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
};
export { SettingsForm };
