import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Advisor from "./advisor";
import { AppProvider } from "./state";

/** Renders the advisor component with its shared application state provider. */
function renderAdvisor() {
  return render(<AppProvider><Advisor /></AppProvider>);
}

describe("Advisor appointment queue", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ad-user", JSON.stringify({ name: "Demo Advisor", email: "advisor@example.com", role: "Service Advisor", serviceCenterId: "cp" }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("filters appointments and shows a useful empty state", () => {
    renderAdvisor();
    expect(screen.getByRole("heading", { name: /^Good (morning|afternoon|evening), Demo\.$/ })).toBeInTheDocument();
    const search = screen.getByRole("textbox", { name: "Search appointments" });

    expect(screen.getByText("AD-2608")).toBeInTheDocument();
    expect(screen.queryByText("AD-2594")).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "brake" } });
    expect(screen.getByText("AD-2571")).toBeInTheDocument();
    expect(screen.queryByText("AD-2594")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "no matching booking" } });
    expect(screen.getByText("No appointments match this search.")).toBeInTheDocument();
  });

  it("updates a booking status and exposes the table scroll area to the keyboard", async () => {
    renderAdvisor();
    const region = screen.getByRole("region", { name: "Appointment service queue" });
    expect(region).toHaveAttribute("tabindex", "0");

    const status = screen.getByRole("combobox", { name: "Update AD-2608 status" });
    fireEvent.change(status, {
      target: { value: "In Progress" },
    });
    await waitFor(() => {
      const bookings = JSON.parse(localStorage.getItem("ad-bookings"));
      expect(bookings.find((booking) => booking.id === "AD-2608").status).toBe("In Progress");
    });
    expect(status).toHaveValue("In Progress");
  });
});
