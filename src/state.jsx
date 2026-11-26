import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useCallback,
  useRef,
} from "react";
import { initialVehicles, initialBookings, services as initialServices } from "./data";
const AuthContext = createContext(null);
const VehicleContext = createContext(null);
const BookingContext = createContext(null);
const UIContext = createContext(null);
/** Reads persisted demo state safely and falls back to seeded data. */
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Demo state remains usable for this tab when browser storage is unavailable.
  }
};

/** Applies React-style values or updater functions inside the reducer. */
function valueReducer(current, action) {
  return typeof action.value === "function" ? action.value(current) : action.value;
}

/** Updates booking and catalogue state while keeping those domains together. */
function bookingReducer(state, action) {
  if (action.type === "bookings/set") {
    return { ...state, bookings: typeof action.value === "function" ? action.value(state.bookings) : action.value };
  }
  if (action.type === "services/set") {
    return { ...state, services: typeof action.value === "function" ? action.value(state.services) : action.value };
  }
  return state;
}

function uiReducer(state, action) {
  if (action.type === "theme/set") {
    const value = typeof action.value === "function" ? action.value(state.theme) : action.value;
    return { ...state, theme: value === "dark" ? "dark" : "light" };
  }
  if (action.type === "toast/set") return { ...state, toast: action.value };
  return state;
}

/** Owns separate authentication, vehicle, booking, and notification state domains. */
export function AppProvider({ children }) {
  const [user, userDispatch] = useReducer(valueReducer, null, () => read("ad-user", null));
  const [vehicles, vehicleDispatch] = useReducer(valueReducer, null, () => read("ad-vehicles", initialVehicles));
  const [bookingState, bookingDispatch] = useReducer(bookingReducer, null, () => ({
    bookings: read("ad-bookings", initialBookings),
    services: read("ad-services", initialServices),
  }));
  const [uiState, uiDispatch] = useReducer(uiReducer, null, () => {
    const savedTheme = read("ad-theme", "light");
    return { theme: savedTheme === "dark" ? "dark" : "light", toast: "" };
  });
  const toastTimer = useRef(null);
  const { bookings, services } = bookingState;
  const { theme, toast } = uiState;
  const setUser = useCallback((value) => userDispatch({ value }), []);
  const setVehicles = useCallback((value) => vehicleDispatch({ value }), []);
  const setBookings = useCallback((value) => bookingDispatch({ type: "bookings/set", value }), []);
  const setServices = useCallback((value) => bookingDispatch({ type: "services/set", value }), []);
  const setTheme = useCallback((value) => uiDispatch({ type: "theme/set", value }), []);
  const notify = useCallback((message) => {
    uiDispatch({ type: "toast/set", value: message });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => uiDispatch({ type: "toast/set", value: "" }), 3000);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    write("ad-theme", theme);
  }, [theme]);
  useEffect(() => write("ad-user", user), [user]);
  useEffect(() => write("ad-vehicles", vehicles), [vehicles]);
  useEffect(() => write("ad-bookings", bookings), [bookings]);
  useEffect(() => write("ad-services", services), [services]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const authValue = useMemo(() => ({ user, setUser }), [user, setUser]);
  const vehicleValue = useMemo(() => ({ vehicles, setVehicles }), [vehicles, setVehicles]);
  const bookingValue = useMemo(() => ({ bookings, setBookings, services, setServices }), [bookings, setBookings, services, setServices]);
  const uiValue = useMemo(() => ({ theme, setTheme, toast, notify }), [theme, setTheme, toast, notify]);
  return <AuthContext.Provider value={authValue}>
    <VehicleContext.Provider value={vehicleValue}>
      <BookingContext.Provider value={bookingValue}>
        <UIContext.Provider value={uiValue}>{children}</UIContext.Provider>
      </BookingContext.Provider>
    </VehicleContext.Provider>
  </AuthContext.Provider>;
}
/** Exposes only demo identity and session updates. */
export const useAuth = () => useContext(AuthContext);
/** Exposes vehicle records and updates. */
export const useVehicles = () => useContext(VehicleContext);
/** Exposes booking and service-catalogue state. */
export const useBookings = () => useContext(BookingContext);
/** Exposes theme, toast and notification actions. */
export const useNotifications = () => useContext(UIContext);
/** Compatibility hook for screens that need several shared state domains. */
export function useApp() {
  return {
    ...useAuth(),
    ...useVehicles(),
    ...useBookings(),
    ...useNotifications(),
  };
}

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
