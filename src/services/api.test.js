import { describe, it, expect } from "vitest";
import { createMockApi } from "./api";

describe("mock REST API", () => {
  it("supports create, update, list and delete", async () => {
    const api = createMockApi({ latency: 0 });
    const item = await api.create("vehicles", { id: "test", brand: "Honda" });
    expect(item.id).toBe("test");
    expect(
      (await api.update("vehicles", "test", { model: "Shine" })).model,
    ).toBe("Shine");
    expect((await api.list("vehicles")).some((v) => v.id === "test")).toBe(
      true,
    );
    await api.remove("vehicles", "test");
    expect(await api.get("vehicles", "test")).toBeNull();
  });
  it("returns a useful error when the mock endpoint fails", async () => {
    const api = createMockApi({ latency: 0, failureRate: 1 });
    await expect(api.list("bookings")).rejects.toThrow(
      /temporarily unavailable/i,
    );
  });
});
