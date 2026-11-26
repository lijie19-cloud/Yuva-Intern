import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "./state";
import { Services, Booking, BookingSuccess, VehicleDetails, Vehicles } from "./pages";
import Admin from "./admin";
import Advisor from "./advisor";
import Auth from "./auth";
import Profile from "./profile";
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
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/choose a service/i);
  });
  it("announces the current booking step and supports keyboard vehicle selection", async () => {
    const user = userEvent.setup();
    wrap(<Booking />, "/book-service");
    const steps = screen.getByRole("list", { name: "Booking steps" });
    expect(steps.querySelectorAll("li")).toHaveLength(5);
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent("Vehicle");
    const honda = screen.getByRole("button", { name: /Honda Activa 6G/ });
    expect(honda).toHaveAttribute("aria-pressed", "false");
    honda.focus();
    await user.keyboard("{Enter}");
    expect(honda).toHaveAttribute("aria-pressed", "true");
  });
  it("confirms a demo booking and opens its booking-success route", async () => {
    wrap(
      <Routes>
        <Route path="/book-service" element={<Booking />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
      </Routes>,
      "/book-service",
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /General Servicing/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Connaught Place/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.change(screen.getByLabelText("Appointment date"), {
      target: { value: "2026-11-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "10:30 AM" }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("heading", { name: "Review your booking" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));
    expect(await screen.findByRole("heading", { name: "Your ride is in good hands." })).toBeInTheDocument();
    expect(screen.getByText("DEMO DATA")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("ad-bookings"))[0]).toMatchObject({
      vehicleId: "v1",
      service: "General Servicing",
      appointmentDate: "2026-11-30",
      status: "Confirmed",
    });
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
    expect(screen.getByText("2 matching vehicles · 2 in your garage")).toBeInTheDocument();
  });
  it("searches and filters the garage by registration and brand", () => {
    wrap(<Vehicles />, "/dashboard/vehicles");
    fireEvent.change(screen.getByRole("combobox", { name: "Filter vehicles by brand" }), {
      target: { value: "Honda" },
    });
    expect(screen.getByRole("heading", { name: "Honda Activa 6G" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Royal Enfield Classic 350" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Search" }), {
      target: { value: "DL 8C" },
    });
    expect(screen.getByText("1 matching vehicle · 2 in your garage")).toBeInTheDocument();
  });
  it("shows vehicle facts and linked service history on the detail route", () => {
    wrap(
      <Routes><Route path="/vehicles/:id" element={<VehicleDetails />} /></Routes>,
      "/vehicles/v1",
    );
    expect(screen.getByText("DL 3S CX 4821")).toBeInTheDocument();
    expect(screen.getByText("349 cc single-cylinder")).toBeInTheDocument();
    expect(screen.getByText("Brake Inspection")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book service/i })).toHaveAttribute(
      "href",
      "/book-service?vehicle=v1",
    );
  });
  it("rejects malformed registration numbers with an accessible error", () => {
    wrap(<Vehicles />, "/dashboard/vehicles");
    fireEvent.click(screen.getByRole("button", { name: /add vehicle/i }));
    fireEvent.change(screen.getByLabelText("Registration number"), {
      target: { value: "not-a-plate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save vehicle" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid indian registration number/i);
    expect(screen.getByLabelText("Registration number")).toHaveAttribute("aria-invalid", "true");
  });
  it("shows profile vehicles and bookings, then preserves them after contact edits", () => {
    localStorage.setItem("ad-demo-accounts", JSON.stringify([{
      id: "demo-customer-1",
      name: "Aarav Mehta",
      email: "aarav@example.com",
      phone: "+91 90000 00001",
      role: "Customer",
      credential: { salt: "demo-salt", hash: "demo-verifier" },
    }]));
    wrap(<Profile />, "/profile");
    expect(screen.getByRole("heading", { name: "Registered vehicles" })).toBeInTheDocument();
    expect(screen.getByText("Royal Enfield Classic 350")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upcoming appointments" })).toBeInTheDocument();
    expect(screen.getByText("General Servicing")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Aarav Mehta Updated" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "aarav.updated@example.com" } });
    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "+91 90000 00001" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(JSON.parse(localStorage.getItem("ad-user"))).toMatchObject({
      name: "Aarav Mehta Updated",
      email: "aarav.updated@example.com",
    });
    expect(JSON.parse(localStorage.getItem("ad-vehicles")).filter((vehicle) => vehicle.ownerEmail === "aarav.updated@example.com")).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem("ad-bookings")).find((booking) => booking.id === "AD-2608").customerEmail).toBe("aarav.updated@example.com");
    expect(JSON.parse(localStorage.getItem("ad-demo-accounts"))[0]).toMatchObject({
      email: "aarav.updated@example.com",
      credential: { salt: "demo-salt", hash: "demo-verifier" },
    });
  });
  it("shows profile empty states when a demo customer has no vehicles or bookings", () => {
    localStorage.setItem("ad-vehicles", "[]");
    localStorage.setItem("ad-bookings", "[]");
    wrap(<Profile />, "/profile");
    expect(screen.getByText("No vehicles are registered to this profile yet.")).toBeInTheDocument();
    expect(screen.getByText("You have no upcoming appointments.")).toBeInTheDocument();
    expect(screen.getByText("Your completed or cancelled service bookings will appear here.")).toBeInTheDocument();
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
  it("does not offer public service advisor registration", () => {
    wrap(<Auth register />, "/register");
    expect(screen.queryByRole("option", { name: "Service Advisor" })).not.toBeInTheDocument();
  });
  it("lets an admin create an advisor who signs in with the assigned username and PIN", async () => {
    localStorage.setItem("ad-user", JSON.stringify({ name: "Priya Khanna", email: "priya@example.test", role: "Administrator" }));
    const adminView = wrap(<Admin />, "/admin/advisors");
    fireEvent.click(screen.getByRole("button", { name: /create advisor/i }));
    fireEvent.change(screen.getByLabelText("Advisor full name"), { target: { value: "Dev Malhotra" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "dev.malhotra" } });
    fireEvent.change(screen.getByLabelText("Temporary PIN"), { target: { value: "4826" } });
    fireEvent.change(screen.getByLabelText("Assigned service center"), { target: { value: "dwarka" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Create advisor" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("ad-demo-accounts"))[0]).toMatchObject({
        username: "dev.malhotra", role: "Service Advisor", serviceCenterId: "dwarka",
      });
    });
    expect(JSON.parse(localStorage.getItem("ad-demo-accounts"))[0].credential.hash).not.toBe("4826");
    adminView.unmount();
    localStorage.removeItem("ad-user");
    const loginView = render(<MemoryRouter initialEntries={["/login"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AppProvider><Auth /></AppProvider></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Sign-in type"), { target: { value: "Service Advisor" } });
    fireEvent.change(screen.getByLabelText("Advisor username"), { target: { value: "dev.malhotra" } });
    fireEvent.change(screen.getByLabelText("Advisor PIN"), { target: { value: "4826" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem("ad-user"))).toMatchObject({
      role: "Service Advisor", username: "dev.malhotra", serviceCenterId: "dwarka", mustChangePin: true,
    }));
    loginView.unmount();
    render(<AppProvider><Advisor /></AppProvider>);
    expect(screen.getByRole("dialog", { name: "Create your personal PIN" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("New PIN"), { target: { value: "7391" } });
    fireEvent.change(screen.getByLabelText("Confirm new PIN"), { target: { value: "7391" } });
    fireEvent.click(screen.getByRole("button", { name: "Save personal PIN" }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("ad-demo-accounts"))[0].mustChangePin).toBe(false);
      expect(JSON.parse(localStorage.getItem("ad-user")).mustChangePin).toBe(false);
    });
    expect(screen.queryByRole("dialog", { name: "Create your personal PIN" })).not.toBeInTheDocument();
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
    localStorage.setItem("ad-user", JSON.stringify({ name: "Priya Khanna", email: "priya@example.test", role: "Administrator" }));
    wrap(<Admin />, "/admin");
    expect(
      screen.getByRole("heading", { name: /^Good (morning|afternoon|evening), Priya\.$/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Confirmed appointments")).toBeInTheDocument();
    expect(screen.getByText("Cancelled appointments")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
  });
  it("shows service operation menus under Admin overview and opens the selected workspace", async () => {
    localStorage.setItem("ad-user", JSON.stringify({ name: "Priya Khanna", email: "priya@example.test", role: "Administrator" }));
    wrap(<App />, "/admin");
    const nav = await screen.findByRole("navigation", { name: "Administrator workspace navigation" });
    expect(within(nav).getByRole("link", { name: /Admin overview/i })).toHaveAttribute("aria-current", "page");
    fireEvent.click(within(nav).getByRole("link", { name: "Services" }));
    expect(screen.getByRole("heading", { level: 2, name: "Services" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Revenue overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add service/i })).toBeInTheDocument();
  });
  it("changes dashboard chart periods and hides activity older than six hours", () => {
    const now = Date.now();
    localStorage.setItem("ad-bookings", JSON.stringify([
      { id: "AD-RECENT", vehicle: "Test bike", service: "Oil change", center: "Dwarka", date: "26 Nov 2026", time: "10:00 AM", status: "Confirmed", price: 500, customer: "Recent Rider", createdAt: new Date(now - 60_000).toISOString() },
      { id: "AD-OLD", vehicle: "Old bike", service: "Brake check", center: "South Delhi", date: "26 Nov 2026", time: "09:00 AM", status: "Completed", price: 600, customer: "Old Rider", createdAt: new Date(now - 7 * 60 * 60 * 1000).toISOString() },
    ]));
    wrap(<Admin />, "/admin");
    fireEvent.change(screen.getByRole("combobox", { name: "Dashboard time range" }), { target: { value: "Daily" } });
    expect(screen.getByText("Daily completed service revenue · ₹ thousands")).toBeInTheDocument();
    const activityRegion = within(screen.getByRole("region", { name: "Recent activity in the last six hours" }));
    expect(activityRegion.getByText("AD-RECENT")).toBeInTheDocument();
    expect(activityRegion.queryByText("AD-OLD")).not.toBeInTheDocument();
  });
  it("lets an admin assign an existing advisor to a service center", () => {
    localStorage.setItem("ad-demo-accounts", JSON.stringify([{ id: "advisor-1", name: "Dev Malhotra", email: "dev@example.test", role: "Service Advisor" }]));
    wrap(<Admin />, "/admin/advisors");
    fireEvent.change(screen.getByRole("combobox", { name: "Assign service center for Dev Malhotra" }), { target: { value: "dwarka" } });
    expect(JSON.parse(localStorage.getItem("ad-demo-accounts"))[0].serviceCenterId).toBe("dwarka");
    expect(screen.getByRole("combobox", { name: "Assign service center for Dev Malhotra" })).toHaveValue("dwarka");
  });
  it("filters admin appointments by status, service, and appointment date", () => {
    wrap(<Admin />, "/admin/appointments");
    fireEvent.change(screen.getByRole("combobox", { name: "Filter bookings by status" }), {
      target: { value: "Completed" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Filter bookings by service" }), {
      target: { value: "Engine Oil Change" },
    });
    fireEvent.change(screen.getByLabelText("Filter bookings by date"), {
      target: { value: "2026-11-20" },
    });
    expect(screen.getByText("AD-2594")).toBeInTheDocument();
    expect(screen.queryByText("AD-2571")).not.toBeInTheDocument();
    expect(screen.getByText("1 matching appointment")).toBeInTheDocument();
  });
  it("updates booking status, opens booking details, and paginates the table", () => {
    wrap(<Admin />, "/admin/appointments");
    fireEvent.change(screen.getByRole("combobox", { name: "Bookings per page" }), {
      target: { value: "5" },
    });
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next appointments page" }));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Filter bookings by status" }), {
      target: { value: "All statuses" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Bookings per page" }), {
      target: { value: "8" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Update AD-2608" }), {
      target: { value: "In Progress" },
    });
    expect(JSON.parse(localStorage.getItem("ad-bookings")).find((booking) => booking.id === "AD-2608").status).toBe("In Progress");
    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0]);
    expect(screen.getByRole("dialog", { name: /booking AD-/i })).toBeInTheDocument();
  });
  it("updates a service price and adds a service to the shared catalogue", async () => {
    wrap(<><Admin /><Services /></>, "/admin/services");
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
