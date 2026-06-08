import { describe, it, expect } from "vitest";
import { createManualTodoSchema, dismissSmartTodoSchema } from "../todos";

describe("createManualTodoSchema", () => {
  it("accepts valid manual todo input", () => {
    const input = {
      title: "Review contract",
      due_date: "2026-06-15",
      priority: "high",
      assigned_to: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Review contract");
      expect(result.data.priority).toBe("high");
    }
  });

  it("defaults priority to medium", () => {
    const input = {
      title: "Task title",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("trims whitespace from title", () => {
    const input = {
      title: "  spaced title  ",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("spaced title");
    }
  });

  it("rejects empty title", () => {
    const input = {
      title: "",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 chars", () => {
    const input = {
      title: "a".repeat(201),
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts valid ISO date for due_date", () => {
    const input = {
      title: "Task",
      due_date: "2026-06-15",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.due_date).toBe("2026-06-15");
    }
  });

  it("converts empty string due_date to null", () => {
    const input = {
      title: "Task",
      due_date: "",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.due_date).toBeNull();
    }
  });

  it("rejects invalid ISO date format", () => {
    const input = {
      title: "Task",
      due_date: "not-a-date",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("converts undefined due_date to null", () => {
    const input = {
      title: "Task",
      due_date: undefined,
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.due_date).toBeNull();
    }
  });

  it("converts undefined assigned_to to null", () => {
    const input = {
      title: "Task",
      assigned_to: undefined,
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assigned_to).toBeNull();
    }
  });

  it("rejects invalid UUID for assigned_to", () => {
    const input = {
      title: "Task",
      assigned_to: "not-a-uuid",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates priority enum values", () => {
    const validPriorities = ["low", "medium", "high"];
    for (const priority of validPriorities) {
      const input = { title: "Task", priority };
      const result = createManualTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid priority value", () => {
    const input = {
      title: "Task",
      priority: "urgent",
    };

    const result = createManualTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("dismissSmartTodoSchema", () => {
  it("accepts valid dismiss input", () => {
    const input = {
      smart_type: "contract_expiry",
      entity_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const result = dismissSmartTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.smart_type).toBe("contract_expiry");
    }
  });

  it("validates all smart_type enum values", () => {
    const validTypes = [
      "contract_expiry",
      "salary_due",
      "member_unassigned",
      "trial_pending",
      "scrim_no_result",
      "sponsor_stale",
      "tournament_no_bracket",
    ];
    for (const smart_type of validTypes) {
      const input = { smart_type, entity_id: "test-id" };
      const result = dismissSmartTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid smart_type", () => {
    const input = {
      smart_type: "invalid_type",
      entity_id: "test-id",
    };

    const result = dismissSmartTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("requires entity_id", () => {
    const input = {
      smart_type: "contract_expiry",
    };

    const result = dismissSmartTodoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts any string as entity_id", () => {
    const input = {
      smart_type: "contract_expiry",
      entity_id: "any-string-id",
    };

    const result = dismissSmartTodoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
