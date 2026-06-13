import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FileList } from "@/features/files/components/FileList";

// createClient is already mocked globally in __tests__/setup.ts

describe("FileList component", () => {
  it("shows empty state when no files", async () => {
    // The global mock returns empty data by default
    render(<FileList orgSlug="test-team" orgId="org-123" />);

    // Shows loader initially, then empty state after resolve
    // We use findByText to wait for async state
    const empty = await screen.findByText(/Belum ada file yang diupload/i);
    expect(empty).toBeInTheDocument();
  });
});
