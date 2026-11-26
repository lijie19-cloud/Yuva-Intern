import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Camera, CarFront, CheckCircle2, UserRound } from "lucide-react";
import { bookingsForUser, useApp, vehiclesForUser } from "./state";
import { Button, Status } from "./ui";
import { updateDemoAccountProfile } from "./services/demoAuth";

/** Manages customer details, notification preferences, and a locally saved profile photo. */
export default function Profile() {
  const { user, setUser, notify, vehicles, setVehicles, bookings, setBookings } = useApp();
  const ownVehicles = vehiclesForUser(vehicles, user);
  const ownBookings = bookingsForUser(bookings, user);
  const upcomingBookings = ownBookings.filter((booking) => ["Pending", "Confirmed", "In Progress"].includes(booking.status));
  const pastBookings = ownBookings.filter((booking) => ["Completed", "Cancelled"].includes(booking.status));
  const [form, setForm] = useState(
    user || { name: "", email: "", phone: "", role: "Customer" },
  );
  const [editing, setEditing] = useState(false),
    [pass, setPass] = useState(false),
    [photoError, setPhotoError] = useState("");
  /** Loads notification preferences and falls back to sensible defaults. */
  const [prefs, setPrefs] = useState(() => {
    try {
      const preferenceKey = `ad-prefs-${user?.email?.toLowerCase() || "guest"}`;
      return (
        JSON.parse(localStorage.getItem(preferenceKey)) || {
          reminders: true,
          updates: true,
          offers: false,
        }
      );
    } catch {
      return { reminders: true, updates: true, offers: false };
    }
  });
  const photoInput = useRef(null);
  /** Saves edited contact details to the shared profile state. */
  const save = (e) => {
    e.preventDefault();
    let next = { ...user, ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() };
    const previousEmail = user?.email?.trim().toLowerCase();
    const previousName = user?.name?.trim().toLowerCase();
    try {
      const savedAccount = updateDemoAccountProfile(previousEmail, next);
      if (savedAccount) next = { ...next, ...savedAccount };
    } catch (error) {
      notify(error.message);
      return;
    }
    setVehicles((current) => current.map((vehicle) => {
      const owned = vehicle.ownerEmail?.trim().toLowerCase() === previousEmail ||
        (!vehicle.ownerEmail && vehicle.ownerName?.trim().toLowerCase() === previousName);
      return owned ? { ...vehicle, ownerEmail: next.email, ownerName: next.name } : vehicle;
    }));
    setBookings((current) => current.map((booking) => {
      const owned = booking.customerEmail?.trim().toLowerCase() === previousEmail ||
        (!booking.customerEmail && booking.customer?.trim().toLowerCase() === previousName);
      return owned ? { ...booking, customerEmail: next.email, customer: next.name } : booking;
    }));
    setUser(next);
    setForm(next);
    setEditing(false);
    notify("Profile updated successfully.");
  };
  /** Validates and stores a selected image as the profile avatar. */
  const uploadPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 3 MB.");
      return;
    }
    const reader = new FileReader();
    /** Applies the selected image after the browser finishes reading it. */
    reader.onload = () => {
      const avatar = String(reader.result);
      setForm((current) => ({ ...current, avatar }));
      setUser((current) => ({ ...current, avatar }));
      setPhotoError("");
      notify("Profile photo updated.");
    };
    reader.onerror = () =>
      setPhotoError("The image could not be read. Please try another file.");
    reader.readAsDataURL(file);
  };
  /** Persists notification preferences in browser storage. */
  const savePrefs = () => {
    localStorage.setItem(`ad-prefs-${user?.email?.toLowerCase() || "guest"}`, JSON.stringify(prefs));
    notify("Notification preferences saved.");
  };
  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">YOUR GARAGE</span>
          <h1>My profile</h1>
          <p>Your personal details and communication preferences.</p>
        </div>
      </div>
      <div className="profile-grid">
        <section className="dash-panel profile-main">
          <div className="profile-top">
            <div className="profile-photo-wrap">
              {form.avatar ? (
                <img
                  className="profile-avatar profile-photo"
                  src={form.avatar}
                  alt={`${form.name}'s profile`}
                />
              ) : (
                <div className="profile-avatar">
                  <UserRound size={25} />
                  <span className="sr-only">No profile photo</span>
                </div>
              )}
              <button
                type="button"
                className="photo-change"
                onClick={() => photoInput.current?.click()}
                aria-label="Add or change profile photo"
              >
                <Camera size={15} />
              </button>
              <input
                ref={photoInput}
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={uploadPhoto}
                aria-label="Upload profile photo"
              />
            </div>
            <div>
              <h2>{form.name || "New rider"}</h2>
              <p>{form.email}</p>
              <span className="tag">Account profile</span>
            </div>
            <Button variant="outline" onClick={() => {
              if (editing) setForm(user || { name: "", email: "", phone: "", role: "Customer" });
              setEditing(!editing);
            }}>
              {editing ? "Cancel" : "Edit profile"}
            </Button>
          </div>
          {photoError && (
            <p className="auth-error" role="alert">
              {photoError}
            </p>
          )}
          <p className="photo-help">
            Add a JPG, PNG, WebP or GIF image up to 3 MB.
          </p>
          {editing ? (
            <form onSubmit={save} className="profile-form">
              <label>
                Full name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Phone number
                <input
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </label>
              <label>
                Address
                <input
                  value={form.address || ""}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="New Delhi, India"
                />
              </label>
              <Button type="submit">Save changes</Button>
            </form>
          ) : (
            <div className="profile-details">
              <div>
                <small>PHONE</small>
                <b>{form.phone || "Add a phone number"}</b>
              </div>
              <div>
                <small>ADDRESS</small>
                <b>{form.address || "New Delhi, India"}</b>
              </div>
            </div>
          )}
          <div className="profile-divider" />
          <div className="panel-heading">
            <div>
              <h2>Password & security</h2>
              <p>Keep your account safe</p>
            </div>
            <button className="table-action" onClick={() => setPass(!pass)}>
              {pass ? "Close" : "Change password"}
            </button>
          </div>
          {pass && (
            <div className="password-form">
              <label>
                Current password
                <input type="password" autoComplete="current-password" />
              </label>
              <label>
                New password
                <input type="password" autoComplete="new-password" />
              </label>
              <Button
                onClick={() => {
                  setPass(false);
                  notify("Password updated for this demo session.");
                }}
              >
                Update password
              </Button>
            </div>
          )}
        </section>
        <section className="dash-panel preference-panel">
          <span className="eyebrow">PREFERENCES</span>
          <h2>Stay in the loop.</h2>
          <p>Choose what you’d like to hear about.</p>
          {Object.entries({
            reminders: "Service reminders",
            updates: "Appointment updates",
            offers: "Offers & riding tips",
          }).map(([key, label]) => (
            <label className="toggle-row" key={key}>
              <span>
                <b>{label}</b>
                <small>
                  {key === "reminders"
                    ? "Timely maintenance nudges for your vehicle"
                    : key === "updates"
                      ? "Changes to your service bookings"
                      : "Occasional news from Auto Dealer"}
                </small>
              </span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) =>
                  setPrefs({ ...prefs, [key]: e.target.checked })
                }
              />
            </label>
          ))}
          <button className="btn outline full" onClick={savePrefs}>
            Save preferences
          </button>
          <Link className="text-link profile-book" to="/dashboard">
            Back to your garage <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <section className="dash-panel profile-records-panel">
        <div className="panel-heading">
          <div><h2>Registered vehicles</h2><p>{ownVehicles.length ? "Vehicles connected to your demo profile" : "Add a vehicle to start your garage"}</p></div>
          <Link className="text-link" to="/dashboard/vehicles">Manage vehicles <ArrowRight size={14} /></Link>
        </div>
        {ownVehicles.length ? <div className="profile-vehicle-list">{ownVehicles.map((vehicle) => <article className="profile-vehicle-row" key={vehicle.id}>
          <span className="profile-record-icon"><CarFront size={19} /></span>
          <span><b>{vehicle.brand} {vehicle.model}</b><small>{vehicle.registration} · {vehicle.year}</small></span>
          <span className="profile-record-due"><small>Next service</small><b>{vehicle.nextDue || "Not scheduled"}</b></span>
          <Link className="text-link" to={`/vehicles/${vehicle.id}`}>Details <ArrowRight size={14} /></Link>
        </article>)}</div> : <p className="profile-record-empty">No vehicles are registered to this profile yet.</p>}
      </section>
      <section className="dash-panel profile-records-panel">
        <div className="panel-heading">
          <div><h2>Upcoming appointments</h2><p>Bookings that still need a service visit</p></div>
          <Link className="text-link" to="/book-service">Book a service <ArrowRight size={14} /></Link>
        </div>
        {upcomingBookings.length ? <div className="profile-booking-list">{upcomingBookings.map((booking) => <article className="profile-booking-row" key={booking.id}>
          <span className="profile-record-icon"><CalendarDays size={19} /></span>
          <span><b>{booking.service}</b><small>{booking.vehicle} · {booking.center}</small></span>
          <span><b>{booking.date} · {booking.time}</b><small>Ref {booking.id}</small></span>
          <Status status={booking.status} />
        </article>)}</div> : <p className="profile-record-empty">You have no upcoming appointments.</p>}
      </section>
      <section className="dash-panel profile-records-panel">
        <div className="panel-heading">
          <div><h2>Booking history</h2><p>Completed and cancelled demo appointments</p></div>
          <Link className="text-link" to="/dashboard/bookings">All bookings <ArrowRight size={14} /></Link>
        </div>
        {pastBookings.length ? <div className="profile-booking-list">{pastBookings.map((booking) => <article className="profile-booking-row" key={booking.id}>
          <span className="profile-record-icon"><CheckCircle2 size={19} /></span>
          <span><b>{booking.service}</b><small>{booking.vehicle} · {booking.center}</small></span>
          <span><b>{booking.date}</b><small>Ref {booking.id}</small></span>
          <Status status={booking.status} />
        </article>)}</div> : <p className="profile-record-empty">Your completed or cancelled service bookings will appear here.</p>}
      </section>
    </>
  );
}
