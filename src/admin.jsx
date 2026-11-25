import React, { useState } from "react";
import { CalendarDays, CarFront, CheckCircle2, Clock3, Plus, UserRound, X } from "lucide-react";
import { useApp } from "./state";
import { getDemoAccounts, isDemoAccountActive, setDemoAccountActive } from "./services/demoAuth";
import { AccessibleDialog, Status, SearchInput } from "./ui";

/** Formats a numeric service price as Indian rupees. */
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

/** Parses the seeded and booking-form date formats without depending on locale parsing. */
function bookingMonth(dateText) {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(dateText || "");
  if (!match) return null;
  const date = new Date(`${match[2]} 1, ${match[3]}`);
  if (Number.isNaN(date.getTime())) return null;
  return { year: Number(match[3]), month: date.getMonth(), day: Number(match[1]) };
}

/** Aggregates completed appointment value by the most recent six active booking months. */
function revenueSeries(bookings) {
  const parsed = bookings.map((booking) => ({ booking, date: bookingMonth(booking.date) })).filter((item) => item.date);
  const newest = parsed.reduce((latest, item) => {
    const date = item.date.year * 12 + item.date.month;
    return Math.max(latest, date);
  }, new Date().getFullYear() * 12 + new Date().getMonth());
  return Array.from({ length: 6 }, (_, index) => {
    const stamp = newest - 5 + index;
    const year = Math.floor(stamp / 12);
    const month = stamp % 12;
    const monthName = new Date(year, month, 1).toLocaleString("en", { month: "short" });
    const amount = parsed.reduce((sum, item) => item.date.year === year && item.date.month === month && item.booking.status === "Completed" ? sum + Number(item.booking.price || 0) : sum, 0);
    return { name: monthName, revenue: amount / 1000 };
  });
}

/** Counts appointments by service week in the latest month represented in booking data. */
function appointmentSeries(bookings) {
  const parsed = bookings.map((booking) => ({ booking, date: bookingMonth(booking.date) })).filter((item) => item.date);
  const newest = parsed.reduce((latest, item) => Math.max(latest, item.date.year * 12 + item.date.month), new Date().getFullYear() * 12 + new Date().getMonth());
  const year = Math.floor(newest / 12);
  const month = newest % 12;
  return Array.from({ length: 4 }, (_, week) => ({
    name: `Week ${week + 1}`,
    n: parsed.filter((item) => item.date.year === year && item.date.month === month && Math.min(3, Math.floor((item.date.day - 1) / 7)) === week).length,
  }));
}

/** Returns the matching booking revenue for the current month and previous month. */
function monthlyRevenue(bookings, offset = 0) {
  const now = new Date();
  const stamp = now.getFullYear() * 12 + now.getMonth() - offset;
  const year = Math.floor(stamp / 12);
  const month = stamp % 12;
  return bookings.reduce((sum, booking) => {
    const date = bookingMonth(booking.date);
    return date && date.year === year && date.month === month && booking.status === "Completed"
      ? sum + Number(booking.price || 0)
      : sum;
  }, 0);
}

/** Provides the heading style shared with the other dashboard screens. */
function PageHead({ eyebrow, title, sub, action }) {
  return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action}</div>;
}

/** Displays one administration metric with its label and supporting context. */
function Stat({ icon, label, value, foot }) {
  return <article className="stat-card"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span><b>{value}</b><small>{foot}</small></article>;
}

/** Lets an administrator change one catalogue price and save it to shared app state. */
function ServicePriceEditor({ service, onSave }) {
  const [price, setPrice] = useState(String(service.price));
  return <div className="admin-service-row">
    <span className="admin-service-summary"><b>{service.name}</b><small>{service.category} · {service.duration}</small></span>
    <form className="admin-service-price" onSubmit={(event) => { event.preventDefault(); onSave(service, Number(price)); }}>
      <label htmlFor={`service-price-${service.id}`}>Price for {service.name} (₹)</label>
      <input id={`service-price-${service.id}`} type="number" min="1" step="1" required value={price} onChange={(event) => setPrice(event.target.value)} />
      <button className="table-action" type="submit">Save price</button>
    </form>
  </div>;
}

/** Draws a lightweight, responsive revenue chart with native SVG. */
function RevenueChart({ data }) {
  const values = data.map((point) => point.revenue);
  const max = Math.max(...values, 1);
  const xAt = (index) => 50 + index * (500 / Math.max(1, values.length - 1));
  const yAt = (value) => 205 - (value / max) * 165;
  const points = values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(" ");
  return <svg className="lightweight-chart" viewBox="0 0 600 250" role="img" aria-label={`Revenue trend: ${data.map((point) => `${point.name} ₹${point.revenue} thousand`).join(", ")}`}>
    {[40, 95, 150, 205].map((y) => <line key={y} x1="40" x2="560" y1={y} y2={y} className="chart-gridline" />)}
    <polygon points={`50,215 ${points} 550,215`} className="chart-area" />
    <polyline points={points} className="chart-line" />
    {data.map((point, index) => <g key={point.name}><circle cx={xAt(index)} cy={yAt(point.revenue)} r="4" className="chart-point"><title>{point.name}: ₹{point.revenue.toFixed(1)} thousand completed</title></circle><text x={xAt(index)} y="240" textAnchor="middle" className="chart-label">{point.name}</text></g>)}
  </svg>;
}

/** Draws a lightweight appointment activity chart with native SVG. */
function ActivityChart({ data }) {
  const max = Math.max(...data.map((point) => point.n), 1);
  return <svg className="lightweight-chart" viewBox="0 0 500 250" role="img" aria-label={`Appointment activity: ${data.map((point) => `${point.name}, ${point.n} bookings`).join(", ")}`}>
    {[40, 95, 150, 205].map((y) => <line key={y} x1="32" x2="480" y1={y} y2={y} className="chart-gridline" />)}
    {data.map((point, index) => { const height = (point.n / max) * 165; const x = 68 + index * 108; return <g key={point.name}><rect x={x} y={215 - height} width="44" height={height} rx="6" className="chart-bar"><title>{point.name}: {point.n} bookings</title></rect><text x={x + 22} y="240" textAnchor="middle" className="chart-label">{point.name.replace(" ", "\u00a0")}</text></g>; })}
  </svg>;
}

/** Shows dealership analytics and supports appointment status updates. */
export default function Admin() {
  const { bookings, setBookings, vehicles, services, setServices, notify } = useApp();
  const [q, setQ] = useState(""),
    [tab, setTab] = useState("Appointments");
  const [accounts] = useState(() => getDemoAccounts());
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "Maintenance", price: "", duration: "1 hr", desc: "" });
  const [disabledEmails, setDisabledEmails] = useState(() =>
    getDemoAccounts().filter((account) => !isDemoAccountActive(account.email)).map((account) => account.email),
  );
  const revenue = monthlyRevenue(bookings);
  const previousMonthRevenue = monthlyRevenue(bookings, 1);
  const completedCount = bookings.filter((booking) => booking.status === "Completed").length;
  const pendingCount = bookings.filter((booking) => booking.status === "Pending").length;
  const months = revenueSeries(bookings);
  const trends = appointmentSeries(bookings);
  const list = bookings.filter((b) =>
    `${b.customer} ${b.vehicle} ${b.service} ${b.id}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  ); /** Persists an administrator selected appointment status. */
  const update = (b, status) => setBookings((current) =>
    current.map((booking) => (booking.id === b.id ? { ...booking, status } : booking)),
  );
  /** Saves a positive service price and lets catalogue consumers react to the state update. */
  const saveServicePrice = (service, price) => {
    if (!Number.isFinite(price) || price < 1) {
      notify("Enter a valid service price greater than ₹0.");
      return;
    }
    setServices((current) => current.map((item) => item.id === service.id ? { ...item, price } : item));
    notify(`${service.name} price updated to ${money(price)}.`);
  };
  /** Adds a validated catalogue service, selecting an existing category image as a fallback. */
  const addService = (event) => {
    event.preventDefault();
    const name = serviceForm.name.trim();
    const price = Number(serviceForm.price);
    if (!name || !Number.isFinite(price) || price < 1) {
      notify("Enter a service name and a valid price greater than ₹0.");
      return;
    }
    if (services.some((service) => service.name.trim().toLowerCase() === name.toLowerCase())) {
      notify("A service with this name already exists.");
      return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "service";
    const newService = {
      id: `${slug}-${Date.now().toString(36)}`,
      name,
      category: serviceForm.category,
      price,
      duration: serviceForm.duration.trim() || "1 hr",
      popularity: 70,
      image: services.find((service) => service.category === serviceForm.category)?.image || services[0]?.image || "",
      desc: serviceForm.desc.trim() || `${name} carried out by our experienced two-wheeler service team.`,
      includes: ["Initial inspection", "Technician service report"],
    };
    setServices((current) => [newService, ...current]);
    setServiceForm({ name: "", category: "Maintenance", price: "", duration: "1 hr", desc: "" });
    setShowAddService(false);
    notify(`${name} added to the service catalogue.`);
  };
  /** Confirms account deactivation and persists customer/advisor access changes. */
  const toggleAccount = (account) => {
    const active = disabledEmails.includes(account.email);
    if (!active && !window.confirm(`Deactivate ${account.name}'s ${account.role.toLowerCase()} account?`)) return;
    try {
      setDemoAccountActive(account.email, active);
      setDisabledEmails((current) => active ? current.filter((email) => email !== account.email) : [...current, account.email]);
      notify(`${account.role} account ${active ? "activated" : "deactivated"}.`);
    } catch (error) {
      notify(error.message || "Account access could not be updated.");
    }
  };
  const managedAccounts = accounts.filter((account) => account.role === (tab === "Customers" ? "Customer" : "Service Advisor") && `${account.name} ${account.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead
        eyebrow="DEALERSHIP OPERATIONS"
        title="Good morning, team."
        sub="Here’s how your service network is doing today."
        action={
          <span className="admin-date">
            <CalendarDays size={15} /> {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        }
      />
      <div className="stats-grid admin-stats">
        <Stat
          icon={<UserRound />}
          label="Total customers"
          value={accounts.filter((account) => account.role === "Customer").length.toLocaleString("en-IN")}
          foot="Customer demo accounts"
        />
        <Stat
          icon={<CarFront />}
          label="Registered vehicles"
          value={vehicles.length.toLocaleString("en-IN")}
          foot="Registered in this workspace"
        />
        <Stat
          icon={<CalendarDays />}
          label="Appointments"
          value={bookings.length.toLocaleString("en-IN")}
          foot="Across all centers"
        />
        <Stat
          icon={<CheckCircle2 />}
          label="Completed services"
          value={completedCount.toLocaleString("en-IN")}
          foot={`${bookings.length ? Math.round((completedCount / bookings.length) * 100) : 0}% completion rate`}
        />
        <Stat
          icon={<Clock3 />}
          label="Awaiting confirmation"
          value={pendingCount.toLocaleString("en-IN")}
          foot="Needs advisor attention"
        />
        <Stat
          icon={<span className="rupee">₹</span>}
          label="Revenue this month"
          value={money(revenue)}
          foot={`${previousMonthRevenue ? `${Math.round(((revenue - previousMonthRevenue) / previousMonthRevenue) * 100)}%` : "—"} from last month`}
        />
      </div>
      <div className="admin-charts">
        <section className="dash-panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Monthly service revenue · ₹ thousands</p>
            </div>
          </div>
          <RevenueChart data={months} />
        </section>
        <section className="dash-panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Appointment activity</h2>
              <p>Service bookings this month</p>
            </div>
          </div>
          <ActivityChart data={trends} />
        </section>
      </div>
      <section className="dash-panel admin-bookings">
        <div className="panel-heading">
          <div>
            <h2>Service operations</h2>
            <p>Review and update recent appointment requests</p>
          </div>
          <div className="admin-tabs">
            {["Appointments", "Services", "Customers", "Advisors"].map((t) => (
              <button
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
                key={t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {tab === "Appointments" ? (
          <>
            <div className="admin-search">
              <SearchInput
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by customer, vehicle or booking"
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>BOOKING / CUSTOMER</th>
                    <th>VEHICLE & SERVICE</th>
                    <th>DATE</th>
                    <th>ESTIMATE</th>
                    <th>STATUS</th>
                    <th>UPDATE</th>
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, 8).map((b) => (
                    <tr key={b.id}>
                      <td>
                        <b>{b.id}</b>
                        <small>{b.customer || "Aarav Mehta"}</small>
                      </td>
                      <td>
                        <b>{b.service}</b>
                        <small>{b.vehicle}</small>
                      </td>
                      <td>
                        <b>{b.date}</b>
                        <small>
                          {b.time} · {b.center}
                        </small>
                      </td>
                      <td>{money(b.price)}</td>
                      <td>
                        <Status status={b.status} />
                      </td>
                      <td>
                        <select
                          className="status-select"
                          aria-label={`Update ${b.id}`}
                          value={b.status}
                          onChange={(e) => update(b, e.target.value)}
                        >
                          <option>Pending</option>
                          <option>Confirmed</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : tab === "Services" ? (
          <>
            <div className="admin-services-toolbar">
              <p>Update customer-facing prices or add a service to the booking catalogue.</p>
              <button className="btn primary" type="button" onClick={() => setShowAddService(true)}><Plus size={16} /> Add service</button>
            </div>
            <div className="admin-service-list">
              {services.map((service) => <ServicePriceEditor key={service.id} service={service} onSave={saveServicePrice} />)}
              {!services.length && <p className="account-empty">No services are available. Add one to start the catalogue.</p>}
            </div>
            {showAddService && <AccessibleDialog className="form-modal service-create-modal" labelledBy="add-service-title" onClose={() => setShowAddService(false)}>
                <button className="modal-close" type="button" aria-label="Close add service form" onClick={() => setShowAddService(false)}><X size={18} /></button>
                <span className="eyebrow">SERVICE CATALOGUE</span>
                <h2 id="add-service-title">Add a service</h2>
                <p>New services become available across the catalogue and booking flow.</p>
                <form className="service-create-form" onSubmit={addService}>
                  <label>Service name<input autoFocus required maxLength="60" value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Suspension check" /></label>
                  <div className="form-grid">
                    <label>Category<select value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))}><option>Maintenance</option><option>Repairs</option><option>Care</option></select></label>
                    <label>Estimated duration<input required maxLength="30" value={serviceForm.duration} onChange={(event) => setServiceForm((current) => ({ ...current, duration: event.target.value }))} placeholder="e.g. 1–2 hrs" /></label>
                  </div>
                  <label>Price (₹)<input type="number" min="1" step="1" required value={serviceForm.price} onChange={(event) => setServiceForm((current) => ({ ...current, price: event.target.value }))} placeholder="Enter price in INR" /></label>
                  <label>Description<textarea rows="3" maxLength="240" value={serviceForm.desc} onChange={(event) => setServiceForm((current) => ({ ...current, desc: event.target.value }))} placeholder="Describe what this service covers" /></label>
                  <div className="service-create-actions"><button className="btn outline" type="button" onClick={() => setShowAddService(false)}>Cancel</button><button className="btn primary" type="submit">Add service</button></div>
                </form>
            </AccessibleDialog>}
          </>
        ) : (
          <div className="customer-list account-management-list">
            <div className="account-search-row">
              <SearchInput value={q} onChange={(event) => setQ(event.target.value)} placeholder={`Search ${tab.toLowerCase()}`} />
            </div>
            {managedAccounts.map((account) => {
              const customerBookings = bookings.filter((booking) => booking.customerEmail
                ? booking.customerEmail.toLowerCase() === account.email.toLowerCase()
                : booking.customer?.toLowerCase() === account.name.toLowerCase());
              const accountVehicles = vehicles.filter((vehicle) => vehicle.ownerEmail
                ? vehicle.ownerEmail.toLowerCase() === account.email.toLowerCase()
                : vehicle.ownerName?.toLowerCase() === account.name.toLowerCase());
              const advisorJobs = bookings.filter((booking) => booking.advisorEmail === account.email);
              const active = !disabledEmails.includes(account.email);
              return (
                <div key={account.id || account.email}>
                  <span className="avatar">{account.name?.[0] || account.email[0].toUpperCase()}</span>
                  <span className="account-identity"><b>{account.name}</b><small>{account.email}</small></span>
                  <span className="account-activity">{account.role === "Customer" ? `${accountVehicles.length} vehicles · ${customerBookings.length} bookings` : `${advisorJobs.length} assigned appointments`}</span>
                  <span className={`account-state ${active ? "active" : "inactive"}`}>{active ? "Active" : "Inactive"}</span>
                  <button className="table-action" type="button" onClick={() => toggleAccount(account)}>{active ? "Deactivate" : "Activate"}</button>
                </div>
              );
            })}
            {!managedAccounts.length && <p className="account-empty">No {tab.toLowerCase()} demo accounts found.</p>}
          </div>
        )}
      </section>
    </>
  );
}
