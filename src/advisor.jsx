import React, { useMemo, useState } from "react";
import { CalendarCheck, Search } from "lucide-react";
import { useApp } from "./state";
import { Status } from "./ui";

/** Shows service advisors their operational appointment queue without admin analytics or customer account screens. */
export default function Advisor() {
  const { user, bookings, setBookings, notify } = useApp();
  const [query, setQuery] = useState("");
  const queue = useMemo(() => bookings.filter((booking) =>
    (!booking.advisorEmail || booking.advisorEmail === user?.email) &&
    `${booking.id} ${booking.vehicle} ${booking.service} ${booking.center}`.toLowerCase().includes(query.toLowerCase())
  ), [bookings, query, user?.email]);
  const updateStatus = (id, status) => {
    setBookings((current) => current.map((booking) => booking.id === id ? { ...booking, status } : booking));
    notify("Appointment status updated.");
  };
  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">ADVISOR WORKSPACE</span><h1>Service queue</h1><p>Review appointments and keep each service visit moving.</p></div>
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
        {!queue.length && <p className="advisor-empty">No appointments match this search.</p>}
      </section>
    </>
  );
}
