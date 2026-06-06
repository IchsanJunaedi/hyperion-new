import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/manage/rrq",
}));

const teams = [
  { id: "1", slug: "rrq", name: "RRQ Hoshi", logoUrl: null },
  { id: "2", slug: "evos", name: "EVOS Pride", logoUrl: null },
];

describe("TeamSwitcher", () => {
  it("renders current team name", () => {
    render(<TeamSwitcher teams={teams} currentSlug="rrq" />);
    expect(screen.getByText("RRQ Hoshi")).toBeInTheDocument();
  });

  it("shows chevron toggle button", () => {
    render(<TeamSwitcher teams={teams} currentSlug="rrq" />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens dropdown on click and shows all teams", () => {
    render(<TeamSwitcher teams={teams} currentSlug="rrq" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("RRQ Hoshi")).toBeInTheDocument();
    expect(screen.getByText("EVOS Pride")).toBeInTheDocument();
  });

  it("renders nothing when only 1 team", () => {
    const { container } = render(
      <TeamSwitcher teams={[teams[0]!]} currentSlug="rrq" />
    );
    expect(container.firstChild).toBeNull();
  });
});
