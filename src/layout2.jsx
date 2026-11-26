import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CarFront,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { bookingsForUser, useApp } from "./state";
import logo from "./assets/autodealer-wordmark-small.png";

/** Renders a compact brand mark for the selected social network. */
function SocialIcon({ type }) {
  if (type === "LinkedIn")
    return (
      <span className="social-in" aria-hidden="true">
        in
      </span>
    );
  if (type === "Twitter")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.6 22H2.4l7.3-8.4L1.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
      </svg>
    );
  if (type === "Telegram")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m21.7 3.2-3.3 17.1c-.2 1.2-.9 1.5-1.9.9l-5.3-3.9-2.6 2.5c-.3.3-.5.5-1 .5l.4-5.4 9.8-8.8c.4-.4-.1-.6-.6-.2L5.1 13.5l-5.2-1.6c-1.1-.3-1.1-1 .2-1.5L20.4 2c1-.4 1.8.2 1.3 1.2Z"
          transform="translate(1 1) scale(.92)"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.6 7.2a4.7 4.7 0 0 1-3.1-4.4V2h-3.8v13.6a2.9 2.9 0 1 1-2-2.8V9a6.8 6.8 0 1 0 5.8 6.7V9.1a8.4 8.4 0 0 0 4.9 1.6V6.9c-.6 0-1.2.1-1.8.3Z" />
    </svg>
  );
}

/** Builds the shared public and dashboard shell, navigation, footer, and logout controls. */
export function Layout() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const headerRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seenStatuses, setSeenStatuses] = useState({});
  const { user, setUser, theme, setTheme, bookings } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const dashboard =
    location.pathname.startsWith("/dashboard") ||
    location.pathname === "/admin" ||
    location.pathname === "/advisor";
  const links = [
    ["Home", "/"],
    ["Our Services", "/services"],
    ["Service Centers", "/#centers"],
    ...(!user || user.role === "Customer" ? [["My Bookings", "/dashboard/bookings"]] : []),
    ["About Us", "/#about"],
  ];
  const customerSide = [
    ["Overview", "/dashboard", LayoutDashboard],
    ["My vehicles", "/dashboard/vehicles", CarFront],
    ["My bookings", "/dashboard/bookings", CalendarCheck],
    ["Service history", "/dashboard/history", Clock3],
    ["My profile", "/dashboard/profile", UserRound],
  ];
  const side =
    user?.role === "Administrator"
      ? [["Admin overview", "/admin", ShieldCheck]]
      : user?.role === "Service Advisor"
        ? [["Service queue", "/advisor", CalendarCheck]]
        : customerSide;
  /** Clears the local demo session and returns to the public home page. */
  const logout = () => {
    setUser(null);
    setOpen(false);
    navigate("/");
  };
  /** Closes compact navigation after route changes and keeps notification state in sync. */
  useEffect(() => {
    setOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname, location.search, location.hash]);
  /** Supports outside-click dismissal and Escape dismissal from anywhere in the header. */
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);
  const homePath =
    user?.role === "Administrator"
      ? "/admin"
      : user?.role === "Service Advisor"
        ? "/advisor"
        : "/dashboard";
  // Name-only matching is reserved for legacy seeded records; new records use email ownership.
  const customerBookings = bookingsForUser(bookings, user);
  const serviceNotifications = customerBookings.slice(0, 5);
  const notificationKey = `ad-seen-service-updates-${user?.email?.toLowerCase() || "guest"}`;
  useEffect(() => {
    try {
      setSeenStatuses(JSON.parse(localStorage.getItem(notificationKey)) || {});
    } catch {
      setSeenStatuses({});
    }
    setNotificationsOpen(false);
  }, [notificationKey]);
  const unreadCount = customerBookings.filter(
    (booking) => seenStatuses[booking.id] !== booking.status,
  ).length;
  /** Marks the customer's currently visible booking statuses as seen when they open the notification list. */
  const toggleNotifications = () => {
    if (!notificationsOpen) {
      const nextSeen = { ...seenStatuses };
      serviceNotifications.forEach((booking) => {
        nextSeen[booking.id] = booking.status;
      });
      setSeenStatuses(nextSeen);
      localStorage.setItem(notificationKey, JSON.stringify(nextSeen));
    }
    setNotificationsOpen(!notificationsOpen);
  };
  /** Toggles the saved site appearance while exposing its current state to assistive technology. */
  const themeToggle = (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      <span className="sr-only">
        {theme === "dark" ? "Light theme" : "Dark theme"}
      </span>
    </button>
  );
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="nav" ref={headerRef}>
        <Link className="brand logo-brand" to="/" aria-label="Auto Dealer home">
          <img
            className="brand-logo-image"
            src={logo}
            alt="Auto Dealer vehicle servicing and maintenance"
          />
        </Link>
        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-controls="primary-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav id="primary-navigation" aria-label="Primary navigation" className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([name, path]) =>
            path.startsWith("/#") ? (
              <a
                key={path}
                href={path}
                className={location.pathname === "/" && location.hash === path.slice(1) ? "active" : undefined}
                aria-current={location.pathname === "/" && location.hash === path.slice(1) ? "location" : undefined}
                onClick={() => setOpen(false)}
              >
                {name}
              </a>
            ) : (
              <Link
                key={path}
                to={path}
                className={
                  (path === "/"
                    ? location.pathname === "/" && !location.hash
                    : location.pathname === path || location.pathname.startsWith(`${path}/`))
                    ? "active"
                    : undefined
                }
                aria-current={
                  (path === "/"
                    ? location.pathname === "/" && !location.hash
                    : location.pathname === path || location.pathname.startsWith(`${path}/`))
                    ? "page"
                    : undefined
                }
                onClick={() => setOpen(false)}
              >
                {name}
              </Link>
            ),
          )}
          <div className="mobile-auth">
            {themeToggle}
            {user ? (
              <>
                {user.role === "Customer" && (
                  <div className="notification-wrap mobile-notifications">
                    <button
                      className="notification-trigger"
                      type="button"
                      aria-label={`Service notifications, ${unreadCount} unread`}
                      aria-expanded={notificationsOpen}
                      onClick={toggleNotifications}
                    >
                      <Bell size={18} />
                      <span>Service updates</span>
                      {unreadCount > 0 && <b>{unreadCount}</b>}
                    </button>
                    {notificationsOpen && (
                      <NotificationPanel
                        items={serviceNotifications}
                        onOpen={() => {
                          setNotificationsOpen(false);
                          setOpen(false);
                          navigate("/dashboard/bookings");
                        }}
                      />
                    )}
                  </div>
                )}
                <Link className="btn primary" to={homePath} onClick={() => setOpen(false)}>
                  My account
                </Link>
                <button className="mobile-logout" onClick={logout}>
                  <LogOut size={15} /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link className="btn primary" to="/register" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
        <div className="nav-actions">
          {themeToggle}
          {user ? (
            <>
              {user.role === "Customer" && (
                <div className="notification-wrap">
                  <button
                    className="notification-trigger icon-only"
                    type="button"
                    aria-label={`Service notifications, ${unreadCount} unread`}
                    aria-expanded={notificationsOpen}
                    onClick={toggleNotifications}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && <b>{unreadCount}</b>}
                  </button>
                  {notificationsOpen && (
                    <NotificationPanel
                      items={serviceNotifications}
                      onOpen={() => {
                        setNotificationsOpen(false);
                        navigate("/dashboard/bookings");
                      }}
                    />
                  )}
                </div>
              )}
              <Link className="nav-admin" to={homePath}>
                {user.role === "Administrator"
                  ? "Admin"
                  : user.role === "Service Advisor"
                    ? "Advisor account"
                    : "My Garage"}{" "}
                <ArrowRight size={15} />
              </Link>
              <button className="logout-btn" onClick={logout}>
                <LogOut size={15} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link className="login" to="/login">
                Log in
              </Link>
              <Link className="btn primary" to="/register">
                Get started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </header>
      {dashboard ? (
        <div className="dash-layout">
          <nav className="sidebar" aria-label={`${user?.role || "Customer"} workspace navigation`}>
            <div className="side-heading">
              {user?.role === "Administrator"
                ? "DEALERSHIP"
                : user?.role === "Service Advisor"
                  ? "ADVISOR WORKSPACE"
                  : "YOUR GARAGE"}
            </div>
            {side.map(([name, path, Icon]) => (
              <NavLink key={path} end={path === "/dashboard"} to={path}>
                <Icon size={18} />
                {name}
              </NavLink>
            ))}
            <div className="sidebar-bottom">
              <div className="avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" />
                ) : (
                  user?.name?.[0] || "A"
                )}
              </div>
              <span>
                <b>{user?.name || "Guest rider"}</b>
                <small>
                  {user?.role === "Administrator"
                    ? "Admin workspace"
                    : user?.role === "Service Advisor"
                      ? "Advisor workspace"
                      : "Customer account"}
                </small>
              </span>
              <button aria-label="Log out" onClick={logout}>
                <LogOut size={16} />
              </button>
            </div>
          </nav>
          <main className="dash-main" id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      ) : (
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      )}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Link
              className="brand footer-brand logo-brand"
              to="/"
              aria-label="Auto Dealer home"
            >
              <img
                className="brand-logo-image"
                src={logo}
                alt="Auto Dealer vehicle servicing and maintenance"
              />
            </Link>
            <p>
              Delhi's trusted partner for every journey.
              <br />
              Expert two-wheeler care, made effortless.
            </p>
          </div>
          <div>
            <b>Explore</b>
            <Link to="/services">Our services</Link>
            <a href="/#centers">Service centers</a>
            <Link to="/book-service">Book a service</Link>
          </div>
          <div>
            <b>Get in touch</b>
            <span>+91 11 4356 7800</span>
            <span>care@autodealer.in</span>
            <span>New Delhi, India</span>
          </div>
          <div>
            <b>Follow along</b>
            <div className="social social-network-links">
              {[
                [
                  "LinkedIn",
                  "https://www.linkedin.com/in/lijalem-melisew-a24bb4351/",
                ],
                ["Twitter", "https://twitter.com/"],
                ["Telegram", "https://telegram.org/"],
                ["TikTok", "https://www.tiktok.com/"],
              ].map(([name, url]) => (
                <a
                  key={name}
                  aria-label={`Follow Auto Dealer on ${name}`}
                  title={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <SocialIcon type={name} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="copyright">
          <span>© 2026 Auto Dealer India. All rights reserved.</span>
          <span>Built for the love of the ride.</span>
        </div>
      </footer>
    </>
  );
}

/** Lists the signed-in customer's own service statuses and links to their bookings. */
function NotificationPanel({ items, onOpen }) {
  return (
    <section
      className="notification-panel"
      aria-label="Your service status updates"
    >
      <div className="notification-heading">
        <b>Your service updates</b>
        <span>{items.length}</span>
      </div>
      {items.length ? (
        items.map((booking) => (
          <button
            className="notification-item"
            type="button"
            key={booking.id}
            onClick={onOpen}
          >
            <span>
              <b>{booking.service}</b>
              <small>
                {booking.vehicle} · {booking.date}
              </small>
            </span>
            <StatusLabel status={booking.status} />
          </button>
        ))
      ) : (
        <p className="notification-empty">
          No service updates yet. Your bookings will appear here.
        </p>
      )}
      <button className="notification-all" type="button" onClick={onOpen}>
        View my bookings <ArrowRight size={14} />
      </button>
    </section>
  );
}

/** Formats a booking state for a compact notification badge. */
function StatusLabel({ status }) {
  return (
    <span
      className={`notification-status ${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}
