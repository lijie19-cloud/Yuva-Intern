import React, { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CarFront,
  ChevronDown,
  Clock3,
  Facebook,
  Instagram,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { useApp } from "./state";
/** Renders a compact brand mark for the selected social network in the legacy layout. */
function SocialIcon({ kind }) {
  if (kind === "LinkedIn") return <span className="social-in">in</span>;
  if (kind === "Twitter")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.6 22H2.4l7.3-8.4L1.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
      </svg>
    );
  if (kind === "Telegram")
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
/** Defines the previous shared app shell; active routes use layout2.jsx. */
export function Layout() {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useApp();
  const loc = useLocation();
  const nav = useNavigate();
  const dashboard =
    loc.pathname.startsWith("/dashboard") || loc.pathname === "/admin";
  const links = [
    ["Home", "/"],
    ["Our Services", "/services"],
    ["Service Centers", "/#centers"],
    ["My Bookings", "/dashboard/bookings"],
    ["About Us", "/#about"],
  ];
  const side = [
    ["Overview", "/dashboard", LayoutDashboard],
    ["My vehicles", "/dashboard/vehicles", CarFront],
    ["My bookings", "/dashboard/bookings", CalendarCheck],
    ["Service history", "/dashboard/history", Clock3],
    ["My profile", "/dashboard/profile", UserRound],
  ];
  const logout = () => {
    setUser(null);
    nav("/");
  };
  return (
    <>
      <header className="nav">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Activity size={22} />
          </span>
          <span>
            AUTO<span className="brand-light">DEALER</span>
            <small>CARE THAT GOES FURTHER</small>
          </span>
        </Link>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([n, h]) => (
            <a key={h} href={h} onClick={() => setOpen(false)}>
              {n}
            </a>
          ))}
          <div className="mobile-auth">
            {user ? (
              <Link className="btn primary" to="/dashboard">
                My Garage
              </Link>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link className="btn primary" to="/register">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link
                className="nav-admin"
                to={user.role === "Administrator" ? "/admin" : "/dashboard"}
              >
                {user.role === "Administrator" ? "Admin" : "My Garage"}{" "}
                <ArrowRight size={15} />
              </Link>
              <button
                className="avatar-btn"
                aria-label="Log out"
                onClick={logout}
              >
                {user.name?.[0] || "A"}
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
      {dashboard && (
        <div className="dash-layout">
          <aside className="sidebar">
            <div className="side-heading">YOUR GARAGE</div>
            {side.map(([n, h, I]) => (
              <NavLink key={h} end={h === "/dashboard"} to={h}>
                <I size={18} />
                {n}
              </NavLink>
            ))}
            <div className="side-heading admin-label">DEALERSHIP</div>
            <NavLink to="/admin">
              <ShieldCheck size={18} />
              Admin overview
            </NavLink>
            <div className="sidebar-bottom">
              <div className="avatar">{user?.name?.[0] || "A"}</div>
              <span>
                <b>{user?.name || "Guest rider"}</b>
                <small>{user?.role || "Demo account"}</small>
              </span>
              <button aria-label="Log out" onClick={logout}>
                <LogOut size={16} />
              </button>
            </div>
          </aside>
          <main className="dash-main">
            <Outlet />
          </main>
        </div>
      )}
      {!dashboard && (
        <main>
          <Outlet />
        </main>
      )}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Link className="brand footer-brand" to="/">
              <span className="brand-icon">
                <Activity />
              </span>
              <span>
                AUTO<span className="brand-light">DEALER</span>
                <small>CARE THAT GOES FURTHER</small>
              </span>
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
            <div className="social">
              <a aria-label="Instagram" href="https://instagram.com">
                <Instagram />
              </a>
              <a aria-label="Facebook" href="https://facebook.com">
                <Facebook />
              </a>
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
