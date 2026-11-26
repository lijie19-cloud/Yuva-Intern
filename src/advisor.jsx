import React, { useMemo, useState } from "react";
import { CalendarCheck, Search } from "lucide-react";
import { useAuth, useBookings, useNotifications } from "./state";
import { Status } from "./ui";
import { centers } from "./data";
import { firstName, getTimeGreeting } from "./utils/greeting";
import { AccessibleDialog } from "./ui";
import { updateAdvisorPersonalPin } from "./services/demoAuth";

/** Shows service advisors their operational appointment queue without admin analytics or customer account screens. */
export default function Advisor() {
  const { user, setUser } = useAuth();
  const { bookings, setBookings } = useBookings();
  const { notify } = useNotifications();
  const [query, setQuery] = useState("");
  const [pinForm, setPinForm] = useState({ pin: "", confirmation: "" });
  const [pinError, setPinError] = useState("");
  const assignedCenter = centers.find((center) => center.id === user?.serviceCenterId);
  const assignedCenterName = assignedCenter?.name.replace(/^Auto Dealer\s*[–-]\s*/i, "").toLowerCase();
  const queue = useMemo(() => bookings.filter((booking) => {
    const belongsToCenter = Boolean(assignedCenter) && (
      booking.serviceCenterId
        ? booking.serviceCenterId === assignedCenter.id
        : booking.center?.trim().toLowerCase() === assignedCenterName
    );
    return belongsToCenter && (!booking.advisorEmail || booking.advisorEmail === user?.email) &&
      `${booking.id} ${booking.vehicle} ${booking.service} ${booking.center}`.toLowerCase().includes(query.toLowerCase());
  }), [bookings, query, user?.email, assignedCenter, assignedCenterName]);
  const updateStatus = (id, status) => {
    setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status } : booking));
    notify("Appointment status updated.");
  };
  const savePersonalPin = async (event) => {
    event.preventDefault();
    setPinError("");
    if (pinForm.pin !== pinForm.confirmation) {
      setPinError("The PIN entries do not match.");
      return;
    }
    try {
      const updatedUser = await updateAdvisorPersonalPin({ username: user.username, pin: pinForm.pin });
      setUser(updatedUser);
      setPinForm({ pin: "", confirmation: "" });
      notify("Your personal PIN has been set.");
    } catch (error) {
      setPinError(error.message || "Your personal PIN could not be saved.");
    }
  };
  return (
    <>
      <div className="page-head">
          <div><span className="eyebrow">ADVISOR WORKSPACE · SERVICE QUEUE</span><h1>{getTimeGreeting()}, {firstName(user?.name)}.</h1><p>{assignedCenter ? `Appointments assigned to ${assignedCenter.name.replace(/^Auto Dealer\s*[–-]\s*/i, "")}.` : "No service center is assigned to this demo advisor account."}</p></div>
      </div>
      <section className="dash-panel advisor-queue">
        <div className="panel-heading">
          <div><h2><CalendarCheck size={18} /> Appointments</h2><p>{queue.length} service {queue.length === 1 ? "appointment" : "appointments"}</p></div>
          <label className="advisor-search"><Search size={16} aria-hidden="true" /><input aria-label="Search appointments" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search service queue" /></label>
        </div>
        <div className="table-wrap advisor-table-wrap" role="region" aria-label="Appointment service queue" tabIndex={0}>
          <table>
            <caption className="sr-only">Advisor appointments and current service statuses</caption>
            <thead><tr><th scope="col">BOOKING</th><th scope="col">VEHICLE & SERVICE</th><th scope="col">DATE & CENTER</th><th scope="col">STATUS</th><th scope="col">UPDATE</th></tr></thead>
            <tbody>{queue.map((booking) => <tr key={booking.id}>
              <td><b>{booking.id}</b><small>Customer appointment</small></td>
              <td><b>{booking.vehicle}</b><small>{booking.service}</small></td>
              <td><b>{booking.date} · {booking.time}</b><small>{booking.center}</small></td>
              <td><Status status={booking.status} /></td>
              <td><select aria-label={`Update ${booking.id} status`} value={booking.status} onChange={(event) => updateStatus(booking.id, event.target.value)}><option>Pending</option><option>Confirmed</option><option>In Progress</option><option>Completed</option><option>Cancelled</option></select></td>
            </tr>)}</tbody>
          </table>
        </div>
        {!queue.length && <p className="advisor-empty">{assignedCenter ? "No appointments match this search." : "Ask an administrator to assign your service center before viewing appointments."}</p>}
      </section>
      {user?.mustChangePin && <AccessibleDialog className="form-modal advisor-pin-modal" labelledBy="advisor-pin-title" onClose={() => {}}>
        <span className="eyebrow">FIRST SIGN-IN SETUP</span>
        <h2 id="advisor-pin-title">Create your personal PIN</h2>
        <p>Your administrator's temporary PIN has been used. Set a personal 4–8 digit PIN to continue.</p>
        <form className="service-create-form" onSubmit={savePersonalPin}>
          <label>New PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="new-password" value={pinForm.pin} onChange={(event) => setPinForm((current) => ({ ...current, pin: event.target.value.replace(/\D/g, "").slice(0, 8) }))} /></label>
          <label>Confirm new PIN<input required type="password" inputMode="numeric" pattern="[0-9]{4,8}" minLength={4} maxLength={8} autoComplete="new-password" value={pinForm.confirmation} onChange={(event) => setPinForm((current) => ({ ...current, confirmation: event.target.value.replace(/\D/g, "").slice(0, 8) }))} /></label>
          {pinError && <p className="auth-error" role="alert">{pinError}</p>}
          <button className="btn primary full" type="submit">Save personal PIN</button>
        </form>
      </AccessibleDialog>}
    </>
  );
}
