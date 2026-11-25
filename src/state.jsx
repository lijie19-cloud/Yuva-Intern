import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { initialVehicles, initialBookings, services as initialServices } from "./data";
const C = createContext(null);
/** Reads persisted demo state safely and falls back to seeded data. */
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
/** Owns and persists shared user, vehicle, booking, and notification state. */
export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = read("ad-theme", "light");
    return savedTheme === "dark" ? "dark" : "light";
  });
  const [user, setUser] = useState(() => read("ad-user", null));
  const [vehicles, setVehicles] = useState(() =>
    read("ad-vehicles", initialVehicles),
  );
  const [bookings, setBookings] = useState(() =>
    read("ad-bookings", initialBookings),
  );
  const [services, setServices] = useState(() =>
    read("ad-services", initialServices),
  );
  const [toast, setToast] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("ad-theme", JSON.stringify(theme));
  }, [theme]);
  useEffect(
    () => localStorage.setItem("ad-user", JSON.stringify(user)),
    [user],
  );
  useEffect(
    () => localStorage.setItem("ad-vehicles", JSON.stringify(vehicles)),
    [vehicles],
  );
  useEffect(
    () => localStorage.setItem("ad-bookings", JSON.stringify(bookings)),
    [bookings],
  );
  useEffect(
    () => localStorage.setItem("ad-services", JSON.stringify(services)),
    [services],
  );
  /** Shows a short-lived global status message. */
  const notify = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };
  const value = useMemo(
    () => ({
      theme,
      setTheme,
      user,
      setUser,
      vehicles,
      setVehicles,
      bookings,
      setBookings,
      services,
      setServices,
      toast,
      notify,
    }),
    [theme, user, vehicles, bookings, services, toast],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
/** Exposes app-wide context to screens and shared components. */
export const useApp = () => useContext(C);

/** Returns only appointments owned by the signed-in account, including legacy name-only demo records. */
export function bookingsForUser(bookings, user) {
  if (!user || user.role !== "Customer") return [];
  const email = user.email?.trim().toLowerCase();
  const name = user.name?.trim().toLowerCase();
  return bookings.filter((booking) => {
    if (booking.customerEmail)
      return booking.customerEmail.trim().toLowerCase() === email;
    return Boolean(name && booking.customer?.trim().toLowerCase() === name);
  });
}

/** Returns only vehicles attached to the signed-in customer account. */
export function vehiclesForUser(vehicles, user) {
  if (!user || user.role !== "Customer") return [];
  const email = user.email?.trim().toLowerCase();
  const name = user.name?.trim().toLowerCase();
  return vehicles.filter((vehicle) => {
    if (vehicle.ownerEmail)
      return vehicle.ownerEmail.trim().toLowerCase() === email;
    if (vehicle.ownerName)
      return Boolean(name && vehicle.ownerName.trim().toLowerCase() === name);
    // Preserve access to legacy locally seeded vehicles for their original demo owner only.
    return name === "aarav mehta" && ["v1", "v2"].includes(vehicle.id);
  });
}
