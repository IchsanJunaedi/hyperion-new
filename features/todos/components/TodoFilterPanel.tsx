import type { SmartTodoType, TodoPriority, TodoFilters } from "../types";

const CATEGORIES: { value: SmartTodoType; label: string }[] = [
  { value: "contract_expiry", label: "Kontrak" },
  { value: "salary_due", label: "Salary" },
  { value: "member_unassigned", label: "Roster" },
  { value: "trial_pending", label: "Trial" },
  { value: "scrim_no_result", label: "Scrim" },
  { value: "sponsor_stale", label: "Sponsor" },
  { value: "tournament_no_bracket", label: "Turnamen" },
];

const PRIORITIES: { value: TodoPriority; label: string }[] = [
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
];

interface Props {
  filters: TodoFilters;
  onChange: (f: TodoFilters) => void;
}

const TodoFilterPanel = ({ filters, onChange }: Props) => {
  const toggleCategory = (cat: SmartTodoType) =>
    onChange({
      ...filters,
      categories: filters.categories.includes(cat)
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat],
    });

  const togglePriority = (p: TodoPriority) =>
    onChange({
      ...filters,
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter((x) => x !== p)
        : [...filters.priorities, p],
    });

  return (
    <aside className="w-44 shrink-0 space-y-5 text-sm">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ui-text-muted">
          Kategori
        </p>
        <ul className="space-y-1.5">
          {CATEGORIES.map(({ value, label }) => (
            <li key={value}>
              <label className="flex cursor-pointer items-center gap-2 text-ui-text-2 hover:text-ui-text-dim">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(value)}
                  onChange={() => toggleCategory(value)}
                  className="accent-ui-text-dim"
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ui-text-muted">
          Prioritas
        </p>
        <ul className="space-y-1.5">
          {PRIORITIES.map(({ value, label }) => (
            <li key={value}>
              <label className="flex cursor-pointer items-center gap-2 text-ui-text-2 hover:text-ui-text-dim">
                <input
                  type="checkbox"
                  checked={filters.priorities.includes(value)}
                  onChange={() => togglePriority(value)}
                  className="accent-ui-text-dim"
                />
                {label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ui-text-muted">
          Status
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-ui-text-2 hover:text-ui-text-dim">
          <input
            type="checkbox"
            checked={filters.showCompleted}
            onChange={(e) => onChange({ ...filters, showCompleted: e.target.checked })}
            className="accent-ui-text-dim"
          />
          Tampilkan selesai
        </label>
      </div>
    </aside>
  );
};

export { TodoFilterPanel };
