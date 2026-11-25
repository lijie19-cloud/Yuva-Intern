import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppProvider } from "./state";
import { Services, Booking, Vehicles } from "./pages";
import Admin from "./admin";
import Auth from "./auth";
import App from "./App";

/** Renders a screen with router and shared state providers for interaction tests. */
function wrap(ui, route = "/") {
  if (!localStorage.getItem("ad-user")) {
    localStorage.setItem("ad-user", JSON.stringify({ name: "Aarav Mehta", email: "aarav@example.com", role: "Customer" }));
  }
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
  );
}

describe("Auto Dealer primary flows", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());
  it("filters services by query", () => {
    wrap(<Services />, "/services");
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "oil" },
    });
    expect(screen.getByText("Engine Oil Change")).toBeInTheDocument();
    expect(screen.queryByText("Brake Inspection")).not.toBeInTheDocument();
  });
  it("requires a service before progressing in the booking flow", () => {
    wrap(<Booking />, "/book-service");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("heading", { name: "Choose your service" }),
    ).toBeInTheDocument();
  });
  it("opens the vehicle editor and rejects an empty registration", () => {
    wrap(<Vehicles />, "/dashboard/vehicles");
    fireEvent.click(screen.getByRole("button", { name: /add vehicle/i }));
    expect(
      screen.getByRole("heading", { name: /add a vehicle/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /save vehicle/i }));
    expect(
      screen.getByRole("heading", { name: /add a vehicle/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 vehicles")).toBeInTheDocument();
  });
  it("keeps keyboard focus inside a dialog and closes it with Escape", () => {
    wrap(<Vehicles />, "/dashboard/vehicles");
    const opener = screen.getByRole("button", { name: /add vehicle/i });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole("dialog", { name: "Add a vehicle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Tab", shiftKey: true });
    const submit = screen.getByRole("button", { name: "Save vehicle" });
    expect(submit).toHaveFocus();
    fireEvent.keyDown(submit, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
  it("exposes and keyboard-closes the responsive navigation menu", () => {
    wrap(<App />, "/");
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const navigation = screen.getByRole("navigation", { name: "Primary navigation" });
    fireEvent.keyDown(navigation, { key: "Escape" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });
  it("allows only one administrator registration per browser demo", async () => {
    const view = wrap(<Auth register />, "/register");
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Demo Admin" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "demo1234" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "demo1234" },
    });
    fireEvent.change(screen.getByLabelText("Account type"), {
      target: { value: "Administrator" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("ad-admin-account"))).toMatchObject({
        email: "admin@example.com",
      });
    });
    view.unmount();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProvider>
          <Auth register />
        </AppProvider>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("option", { name: "Administrator" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/administrator account has already been created/i),
    ).toBeInTheDocument();
  });
  it("seeds a useful garage when a new customer starts with empty demo data", async () => {
    localStorage.setItem("ad-vehicles", "[]");
    localStorage.setItem("ad-bookings", "[]");
    wrap(<Auth register />, "/register");
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "New Rider" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "rider@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "demo1234" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "demo1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("ad-vehicles"))).toHaveLength(2);
      expect(JSON.parse(localStorage.getItem("ad-bookings"))[0].customer).toBe(
        "New Rider",
      );
    });
  });
  it("verifies registered demo passwords and rejects incorrect credentials", async () => {
    const registration = wrap(<Auth register />, "/register");
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Maya Rider" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "Maya@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secure-demo-123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "secure-demo-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      const accounts = JSON.parse(localStorage.getItem("ad-demo-accounts"));
      expect(accounts).toHaveLength(1);
      expect(JSON.stringify(accounts)).not.toContain("secure-demo-123");
      expect(accounts[0].credential.hash).toBeTruthy();
    });
    registration.unmount();
    localStorage.removeItem("ad-user");

    wrap(<Auth />, "/login");
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "maya@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
    );

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secure-demo-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("ad-user"))).toMatchObject({
        email: "maya@example.com",
        role: "Customer",
      });
    });
  });
  it("redirects customers away from administrator routes", async () => {
    localStorage.setItem(
      "ad-user",
      JSON.stringify({ name: "Maya Rider", email: "maya@example.com", role: "Customer" }),
    );
    wrap(<App />, "/admin");
    expect(
      await screen.findByRole("heading", { name: "Good morning, Maya." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Good morning, team." })).toBeNull();
  });
  it("renders the admin account overview without an icon runtime error", () => {
    wrap(<Admin />, "/admin");
    expect(
      screen.getByRole("heading", { name: "Good morning, team." }),
    ).toBeInTheDocument();
  });
  it("updates a service price and adds a service to the shared catalogue", async () => {
    wrap(<><Admin /><Services /></>, "/admin");
    fireEvent.click(screen.getByRole("button", { name: "Services" }));

    const priceInput = screen.getByLabelText("Price for General Servicing (₹)");
    fireEvent.change(priceInput, { target: { value: "1999" } });
    fireEvent.submit(priceInput.closest("form"));
    await waitFor(() => {
      const savedServices = JSON.parse(localStorage.getItem("ad-services"));
      expect(savedServices.find((service) => service.id === "general").price).toBe(1999);
      expect(screen.getByText("₹1,999")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Add service" }));
    fireEvent.change(screen.getByLabelText("Service name"), { target: { value: "Suspension Check" } });
    fireEvent.change(screen.getByLabelText("Price (₹)"), { target: { value: "1299" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Inspect forks and suspension response." } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add service" }).at(-1));

    await waitFor(() => {
      const savedServices = JSON.parse(localStorage.getItem("ad-services"));
      expect(savedServices.some((service) => service.name === "Suspension Check" && service.price === 1299)).toBe(true);
    });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getAllByText("Suspension Check").length).toBeGreaterThanOrEqual(2);
  });
});
