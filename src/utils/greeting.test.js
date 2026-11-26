import { describe, expect, it } from "vitest";
import { firstName, getTimeGreeting } from "./greeting";

describe("dashboard greeting helpers", () => {
  it("uses the local hour for morning, afternoon, and evening greetings", () => {
    expect(getTimeGreeting(new Date(2026, 0, 1, 8))).toBe("Good morning");
    expect(getTimeGreeting(new Date(2026, 0, 1, 14))).toBe("Good afternoon");
    expect(getTimeGreeting(new Date(2026, 0, 1, 20))).toBe("Good evening");
  });

  it("uses a person's first name and has a fallback for missing names", () => {
    expect(firstName("Dev Malhotra")).toBe("Dev");
    expect(firstName("  ")).toBe("there");
  });
});
