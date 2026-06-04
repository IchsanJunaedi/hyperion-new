import { describe, it, expect } from "vitest";
import {
  buildScrimWaMessage,
  buildTournamentWaMessage,
  buildTournamentRegisteredWaMessage,
} from "@/lib/utils/wa-templates";

describe("buildScrimWaMessage", () => {
  const base = {
    orgName: "Tim Garuda",
    opponentName: "Tim Elang",
    scheduledAt: "2026-05-20T13:00:00.000Z",
    format: "bo3",
    scrimUrl: "https://hyperionteam.id/garuda/scrim/123",
  };

  it("contains org name, opponent, and scrim URL", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).toContain("Tim Garuda");
    expect(msg).toContain("Tim Elang");
    expect(msg).toContain("https://hyperionteam.id/garuda/scrim/123");
  });

  it("uppercases the format value", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).toContain("BO3");
  });

  it("omits Region, Room, Catatan lines when not provided", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).not.toContain("Region:");
    expect(msg).not.toContain("Room:");
    expect(msg).not.toContain("Catatan:");
  });

  it("includes optional fields when provided", () => {
    const msg = buildScrimWaMessage({
      ...base,
      serverRegion: "SEA",
      roomInfo: "Room 101 / Pass: 1234",
      notes: "Pakai server cadangan",
    });
    expect(msg).toContain("SEA");
    expect(msg).toContain("Room 101 / Pass: 1234");
    expect(msg).toContain("Pakai server cadangan");
  });

  it("includes confirmation URL line", () => {
    const msg = buildScrimWaMessage(base);
    expect(msg).toContain("Konfirmasi kehadiran");
  });
});

describe("buildTournamentWaMessage", () => {
  const base = {
    orgName: "Tim Garuda",
    tournamentName: "MPL Season 15",
    startDate: "2026-06-01",
    tournamentUrl: "https://hyperionteam.id/garuda/tournament/456",
  };

  it("contains tournament name and URL", () => {
    const msg = buildTournamentWaMessage(base);
    expect(msg).toContain("MPL Season 15");
    expect(msg).toContain("https://hyperionteam.id/garuda/tournament/456");
  });

  it("omits optional fields when not provided", () => {
    const msg = buildTournamentWaMessage(base);
    expect(msg).not.toContain("Organizer:");
    expect(msg).not.toContain("Selesai:");
    expect(msg).not.toContain("Prize Pool:");
    expect(msg).not.toContain("Biaya Daftar:");
    expect(msg).not.toContain("Link registrasi:");
  });

  it("includes all optional fields when provided", () => {
    const msg = buildTournamentWaMessage({
      ...base,
      organizer: "Moonton",
      endDate: "2026-06-10",
      prizePool: "Rp 10.000.000",
      registrationFee: "Rp 150.000",
      registrationUrl: "https://moonton.com/register",
    });
    expect(msg).toContain("Moonton");
    expect(msg).toContain("Rp 10.000.000");
    expect(msg).toContain("Rp 150.000");
    expect(msg).toContain("https://moonton.com/register");
  });
});

describe("buildTournamentRegisteredWaMessage", () => {
  const base = {
    orgName: "Tim Garuda",
    tournamentName: "MPL Season 15",
    startDate: "2026-06-01",
    tournamentUrl: "https://hyperionteam.id/garuda/tournament/456",
  };

  it("contains confirmed indicator and tournament name", () => {
    const msg = buildTournamentRegisteredWaMessage(base);
    expect(msg).toContain("Dikonfirmasi");
    expect(msg).toContain("MPL Season 15");
  });

  it("contains tournament URL", () => {
    const msg = buildTournamentRegisteredWaMessage(base);
    expect(msg).toContain("https://hyperionteam.id/garuda/tournament/456");
  });

  it("contains motivational copy", () => {
    const msg = buildTournamentRegisteredWaMessage(base);
    expect(msg).toContain("Persiapkan dirimu");
  });

  it("omits organizer and registration URL when not provided", () => {
    const msg = buildTournamentRegisteredWaMessage(base);
    expect(msg).not.toContain("Organizer:");
    expect(msg).not.toContain("Link registrasi:");
  });

  it("includes organizer when provided", () => {
    const msg = buildTournamentRegisteredWaMessage({ ...base, organizer: "Moonton" });
    expect(msg).toContain("Moonton");
  });

  it("includes registration URL when provided", () => {
    const msg = buildTournamentRegisteredWaMessage({
      ...base,
      registrationUrl: "https://moonton.com/register",
    });
    expect(msg).toContain("https://moonton.com/register");
  });
});
