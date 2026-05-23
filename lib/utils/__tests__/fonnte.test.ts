/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendWaMessage, blastWaMessage } from "../fonnte";

describe("sendWaMessage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns error when FONNTE_API_TOKEN is not set", async () => {
    delete process.env.FONNTE_API_TOKEN;
    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("FONNTE_API_TOKEN");
  });

  it("returns ok:true on successful API response", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: true }),
    });

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(true);
  });

  it("returns ok:false when HTTP response is not ok", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    });

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("429");
  });

  it("returns ok:false when API returns status:false", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: false, reason: "Invalid number" }),
    });

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid number");
  });

  it("returns ok:false using detail field when reason missing", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: false, detail: "Account suspended" }),
    });

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Account suspended");
  });

  it("returns fallback message when API returns status:false with no reason or detail", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: false }),
    });

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("non-success");
  });

  it("handles null JSON response gracefully", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    });

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
  });

  it("catches fetch errors and returns ok:false", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockRejectedValue(new Error("Network timeout"));

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Network timeout");
  });

  it("handles non-Error fetch throws", async () => {
    process.env.FONNTE_API_TOKEN = "test-token";
    (fetch as any).mockRejectedValue("string error");

    const result = await sendWaMessage("628123456789", "Hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unknown fetch error");
  });

  it("sends request to correct Fonnte URL with correct headers", async () => {
    process.env.FONNTE_API_TOKEN = "my-secret-token";
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: true }),
    });

    await sendWaMessage("628111222333", "Test message");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.fonnte.com/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "my-secret-token",
        }),
      }),
    );
  });
});

describe("blastWaMessage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, FONNTE_API_TOKEN: "test-token" };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns sent=0, failed=0 for empty recipients", async () => {
    const result = await blastWaMessage([]);
    expect(result).toEqual({ sent: 0, failed: 0 });
  });

  it("counts successful sends correctly", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: true }),
    });

    const result = await blastWaMessage([
      { phone: "628111", message: "Hi" },
      { phone: "628222", message: "Hi" },
    ]);

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("counts failed sends correctly", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const result = await blastWaMessage([
      { phone: "628111", message: "Hi" },
      { phone: "628222", message: "Hi" },
    ]);

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(2);
  });

  it("handles mixed success and failure", async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

    const result = await blastWaMessage([
      { phone: "628111", message: "Hi" },
      { phone: "628222", message: "Hi" },
    ]);

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });
});
