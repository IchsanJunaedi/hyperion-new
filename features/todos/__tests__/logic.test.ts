import { describe, it, expect } from "vitest";
import { computeUrgency, formatRelativeDueDate, groupTodos, filterTodos } from "../logic";
import type { SmartTodo, ManualTodo } from "../types";

const NOW = new Date("2026-06-09T10:00:00Z");

describe("computeUrgency", () => {
  it("returns 'overdue' for past dates", () => {
    expect(computeUrgency(new Date("2026-06-07"), NOW)).toBe("overdue");
  });
  it("returns 'today' for today", () => {
    expect(computeUrgency(new Date("2026-06-09"), NOW)).toBe("today");
  });
  it("returns 'this_week' for dates within 7 days", () => {
    expect(computeUrgency(new Date("2026-06-14"), NOW)).toBe("this_week");
  });
  it("returns 'later' for dates beyond 7 days", () => {
    expect(computeUrgency(new Date("2026-06-20"), NOW)).toBe("later");
  });
  it("returns 'later' for null", () => {
    expect(computeUrgency(null, NOW)).toBe("later");
  });
});

describe("formatRelativeDueDate", () => {
  it("formats overdue as 'Terlambat N hari'", () => {
    expect(formatRelativeDueDate(new Date("2026-06-07"), NOW)).toBe("Terlambat 2 hari");
  });
  it("formats today as 'Hari ini'", () => {
    expect(formatRelativeDueDate(new Date("2026-06-09"), NOW)).toBe("Hari ini");
  });
  it("formats future as 'N hari lagi'", () => {
    expect(formatRelativeDueDate(new Date("2026-06-12"), NOW)).toBe("3 hari lagi");
  });
  it("returns empty string for null", () => {
    expect(formatRelativeDueDate(null, NOW)).toBe("");
  });
});

function makeSmartTodo(urgency: SmartTodo["urgency"], id = "a"): SmartTodo {
  return {
    id: `salary_due:${id}`,
    source: "smart",
    smart_type: "salary_due",
    title: "Test",
    urgency,
    entity_id: id,
    navigate_to: "/dashboard/salaries",
  };
}

function makeManualTodo(urgency: ManualTodo["urgency"], id = "b"): ManualTodo {
  return {
    id,
    source: "manual",
    title: "Manual",
    due_date: null,
    priority: "medium",
    urgency,
    assigned_to: null,
    completed_at: null,
    created_by: "user1",
  };
}

describe("groupTodos", () => {
  it("always returns 4 groups", () => {
    expect(groupTodos([])).toHaveLength(4);
  });
  it("places todos in correct group", () => {
    const todos = [makeSmartTodo("overdue"), makeManualTodo("today")];
    const groups = groupTodos(todos);
    expect(groups.find((g) => g.urgency === "overdue")?.todos).toHaveLength(1);
    expect(groups.find((g) => g.urgency === "today")?.todos).toHaveLength(1);
    expect(groups.find((g) => g.urgency === "this_week")?.todos).toHaveLength(0);
  });
  it("groups are in urgency order: overdue → today → this_week → later", () => {
    const groups = groupTodos([]);
    expect(groups.map((g) => g.urgency)).toEqual(["overdue", "today", "this_week", "later"]);
  });
});

describe("filterTodos", () => {
  const todos = [makeSmartTodo("overdue"), makeManualTodo("today")];

  it("returns all for source=all, no other filters", () => {
    expect(filterTodos(todos, { source: "all", priorities: [], categories: [], showCompleted: false })).toHaveLength(2);
  });
  it("filters source=smart", () => {
    const result = filterTodos(todos, { source: "smart", priorities: [], categories: [], showCompleted: false });
    expect(result.every((t) => t.source === "smart")).toBe(true);
  });
  it("filters source=manual", () => {
    const result = filterTodos(todos, { source: "manual", priorities: [], categories: [], showCompleted: false });
    expect(result.every((t) => t.source === "manual")).toBe(true);
  });
  it("filters by priority for manual todos", () => {
    const high: ManualTodo = { ...makeManualTodo("today", "h"), priority: "high" };
    const result = filterTodos([high, makeManualTodo("today", "m")], {
      source: "all", priorities: ["high"], categories: [], showCompleted: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("h");
  });
  it("hides completed todos when showCompleted=false", () => {
    const done: ManualTodo = { ...makeManualTodo("today", "d"), completed_at: new Date() };
    const result = filterTodos([done, makeManualTodo("today", "p")], {
      source: "all", priorities: [], categories: [], showCompleted: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("p");
  });
  it("shows completed todos when showCompleted=true", () => {
    const done: ManualTodo = { ...makeManualTodo("today", "d"), completed_at: new Date() };
    const result = filterTodos([done], {
      source: "all", priorities: [], categories: [], showCompleted: true,
    });
    expect(result).toHaveLength(1);
  });
});
