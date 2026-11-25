import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  IndianRupee,
  LoaderCircle,
  Plus,
  Search,
} from "lucide-react";
/** Provides the shared styled button variants. */
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Provides keyboard focus management, Escape dismissal, and semantics for modal dialogs. */
export function AccessibleDialog({ labelledBy, onClose, className = "", children }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => [...dialog.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    (getFocusable()[0] || dialog).focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0].focus();
      }
    };
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <div className="form-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRef.current?.(); }}>
      <section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </section>
    </div>
  );
}
/** Shows the route-level loading state. */
export function Loader() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Loading your garage…
    </div>
  );
}
export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
/** Presents a service summary with its estimate and booking links. */
export function ServiceCard({ service }) {
  return (
    <article className="service-card">
      <img
        src={service.image}
        alt={`${service.name} motorcycle service`}
        loading="lazy"
        decoding="async"
      />
      <div className="service-content">
        <div className="card-top">
          <span className="tag">{service.category}</span>
          <span className="rating">★ {service.popularity / 20}</span>
        </div>
        <h3>{service.name}</h3>
        <p>{service.desc}</p>
        <div className="service-meta">
          <span>
            <Clock3 size={15} />
            {service.duration}
          </span>
          <strong>₹{service.price.toLocaleString("en-IN")}</strong>
        </div>
        <div className="card-actions">
          <Link className="text-link" to={`/services/${service.id}`}>
            View details <ArrowRight size={15} />
          </Link>
          <Link
            className="btn small primary"
            to={`/book-service?service=${service.id}`}
          >
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}
/** Maps a booking status to its visual badge. */
export function Status({ status }) {
  const c = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status ${c}`}>{status}</span>;
}
/** Offers a consistent empty state and a path to book service. */
export function Empty({
  title = "Nothing here yet",
  text = "Your information will appear here when it is available.",
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <CalendarDays />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="btn primary" to="/book-service">
        <Plus size={16} /> Book a service
      </Link>
    </div>
  );
}
/** Renders the shared accessible search field. */
export function SearchInput(props) {
  return (
    <label className="search">
      <Search size={18} />
      <input placeholder="Search…" aria-label="Search" {...props} />
    </label>
  );
}
