import React, { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./state";
import { Loader } from "./ui";
import { Layout } from "./layout2";
import { isDemoAccountActive } from "./services/demoAuth";
import { Home } from "./home";
const Services = lazy(() =>
  import("./pages").then((m) => ({ default: m.Services })),
);
const Detail = lazy(() =>
  import("./pages").then((m) => ({ default: m.Detail })),
);
const Booking = lazy(() =>
  import("./pages").then((m) => ({ default: m.Booking })),
);
const Dashboard = lazy(() =>
  import("./pages").then((m) => ({ default: m.Dashboard })),
);
const Vehicles = lazy(() =>
  import("./pages").then((m) => ({ default: m.Vehicles })),
);
const Bookings = lazy(() =>
  import("./pages").then((m) => ({ default: m.Bookings })),
);
const History = lazy(() =>
  import("./pages").then((m) => ({ default: m.History })),
);
const Profile = lazy(() => import("./profile"));
const Admin = lazy(() => import("./admin"));
const Advisor = lazy(() => import("./advisor"));
const Auth = lazy(() => import("./auth"));
const CUSTOMER_ROLES = ["Customer"];
const ACCOUNT_ROLES = ["Customer", "Service Advisor", "Administrator"];

/** Sends signed-in users to the home screen for their own role. */
function roleHome(role) {
  if (role === "Administrator") return "/admin";
  if (role === "Service Advisor") return "/advisor";
  return "/dashboard";
}

/** Restricts account routes to signed-in demo users with an allowed account role. */
function Protected({ children, roles }) {
  const { user, setUser } = useApp();
  const disabled = Boolean(user && user.role !== "Administrator" && !isDemoAccountActive(user.email));
  useEffect(() => {
    if (disabled) setUser(null);
  }, [disabled, setUser]);
  if (!user) return <Navigate to="/login" replace />;
  if (!ACCOUNT_ROLES.includes(user.role)) return <Navigate to="/login" replace />;
  if (disabled) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to={roleHome(user.role)}
        replace
      />
    );
  }
  return children;
}
/** Composes lazy-loaded route screens and displays global toast feedback. */
export default function App() {
  const { toast } = useApp();
  const loc = useLocation();
  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes location={loc}>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<Detail />} />
            <Route path="/book-service" element={<Protected roles={CUSTOMER_ROLES}><Booking /></Protected>} />
            <Route
              path="/dashboard"
              element={
                <Protected roles={CUSTOMER_ROLES}>
                  <Dashboard />
                </Protected>
              }
            />
            <Route
              path="/dashboard/vehicles"
              element={
                <Protected roles={CUSTOMER_ROLES}>
                  <Vehicles />
                </Protected>
              }
            />
            <Route
              path="/dashboard/bookings"
              element={
                <Protected roles={CUSTOMER_ROLES}>
                  <Bookings />
                </Protected>
              }
            />
            <Route
              path="/dashboard/history"
              element={
                <Protected roles={CUSTOMER_ROLES}>
                  <History />
                </Protected>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <Protected roles={CUSTOMER_ROLES}>
                  <Profile />
                </Protected>
              }
            />
            <Route
              path="/admin"
              element={
                <Protected roles={["Administrator"]}>
                  <Admin />
                </Protected>
              }
            />
            <Route
              path="/advisor"
              element={
                <Protected roles={["Service Advisor"]}>
                  <Advisor />
                </Protected>
              }
            />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth register />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </Suspense>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
