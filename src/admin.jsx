import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, CarFront, CheckCircle2, Clock3, Plus, UserRound, X, ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import { useAuth, useBookings, useNotifications, useVehicles } from "./state";
import { deleteDemoAccount, getDemoAccounts, isDemoAccountActive, setDemoAccountActive } from "./services/demoAuth";
import { AccessibleDialog, Status, SearchInput } from "./ui";
import { firstName, getTimeGreeting } from "./utils/greeting";

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

/** Normalizes seeded and form-created appointment dates for filters and sorting. */
function bookingDateValue(booking) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(booking.appointmentDate || "")) return booking.appointmentDate;
  const parsed = bookingMonth(booking.date);
  return parsed ? `${parsed.year}-${String(parsed.month + 1).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}` : "";
}

function bookingTimestamp(booking) {
  const activity = Date.parse(booking.updatedAt || booking.createdAt || "");
  if (Number.isFinite(activity)) return activity;
  const date = bookingDateValue(booking);
  return date ? new Date(`${date}T12:00:00`).getTime() : 0;
}

const RANGE_OPTIONS = { Daily: 7, Weekly: 8, Monthly: 12, "6 months": 6, Yearly: 5 };

/** Creates aligned buckets and aggregates service revenue and appointments for the selected window. */
function dashboardSeries(bookings, range, now = new Date()) {
  const quantity = RANGE_OPTIONS[range];
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "Daily") start.setDate(start.getDate() - (quantity - 1));
  if (range === "Weekly") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 7 * (quantity - 1));
  }
  if (range === "Monthly" || range === "6 months") start.setDate(1), start.setMonth(start.getMonth() - (quantity - 1));
  if (range === "Yearly") start.setFullYear(start.getFullYear() - (quantity - 1), 0, 1);
  const bucketStart = (date) => {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (range === "Weekly") result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    if (range === "Monthly" || range === "6 months") result.setDate(1);
    if (range === "Yearly") result.setMonth(0, 1);
    return result;
  };
  const step = (date, amount) => {
    const result = new Date(date);
    if (range === "Daily") result.setDate(result.getDate() + amount);
    if (range === "Weekly") result.setDate(result.getDate() + 7 * amount);
    if (range === "Monthly" || range === "6 months") result.setMonth(result.getMonth() + amount);
    if (range === "Yearly") result.setFullYear(result.getFullYear() + amount);
    return result;
  };
  const label = (date) => range === "Daily"
    ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : range === "Weekly"
      ? `Wk ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : range === "Yearly" ? String(date.getFullYear()) : date.toLocaleDateString("en-IN", { month: "short", year: range === "6 months" ? undefined : "2-digit" });
  const buckets = Array.from({ length: quantity }, (_, index) => {
    const date = step(start, index);
    return { date, name: label(date), revenueValue: 0, n: 0 };
  });
  const first = buckets[0].date;
  const last = step(buckets.at(-1).date, 1);
  bookings.forEach((booking) => {
    const iso = booking.appointmentDate || bookingDateValue(booking);
    const date = iso ? new Date(`${iso}T12:00:00`) : null;
    if (!date || Number.isNaN(date.getTime()) || date < first || date >= last) return;
    const target = bucketStart(date);
    const index = range === "Daily" ? Math.round((target - first) / 86400000)
      : range === "Weekly" ? Math.round((target - first) / (7 * 86400000))
        : range === "Yearly" ? target.getFullYear() - first.getFullYear()
          : (target.getFullYear() - first.getFullYear()) * 12 + target.getMonth() - first.getMonth();
    if (!buckets[index]) return;
    buckets[index].n += 1;
    if (booking.status === "Completed") buckets[index].revenueValue += Number(booking.price || 0);
  });
  return buckets.map(({ name, revenueValue, n }) => ({ name, revenue: revenueValue / 1000, n }));
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
    {data.map((point, index) => <g key={point.name}><circle cx={xAt(index)} cy={yAt(point.revenue)} r="4" className="chart-point"><title>{point.name}: ₹{point.revenue.toFixed(1)} thousand completed</title></circle>{(data.length <= 7 || index % 2 === 0 || index === data.length - 1) && <text x={xAt(index)} y="240" textAnchor="middle" className="chart-label">{point.name}</text>}</g>)}
  </svg>;
}

/** Draws a lightweight appointment activity chart with native SVG. */
function ActivityChart({ data }) {
  const max = Math.max(...data.map((point) => point.n), 1);
  const slot = 420 / data.length;
  const barWidth = Math.min(44, slot * 0.52);
  return <svg className="lightweight-chart" viewBox="0 0 500 250" role="img" aria-label={`Appointment activity: ${data.map((point) => `${point.name}, ${point.n} bookings`).join(", ")}`}>
    {[40, 95, 150, 205].map((y) => <line key={y} x1="32" x2="480" y1={y} y2={y} className="chart-gridline" />)}
    {data.map((point, index) => { const height = (point.n / max) * 165; const x = 40 + index * slot + (slot - barWidth) / 2; return <g key={point.name}><rect x={x} y={215 - height} width={barWidth} height={height} rx="6" className="chart-bar"><title>{point.name}: {point.n} bookings</title></rect>{(data.length <= 7 || index % 2 === 0 || index === data.length - 1) && <text x={x + barWidth / 2} y="240" textAnchor="middle" className="chart-label">{point.name.replace(" ", "\u00a0")}</text>}</g>; })}
  </svg>;
}

/** Shows dealership analytics and supports appointment status updates. */
export default function Admin() {
  const { user } = useAuth();
  const location = useLocation();
  const { bookings, setBookings, services, setServices } = useBookings();
  const { vehicles, setVehicles } = useVehicles();
  const { notify } = useNotifications();
  const [q, setQ] = useState("");
  const sectionNames = { appointments: "Appointments", services: "Services", customers: "Customers" };
  const tab = sectionNames[location.pathname.split("/")[2]] || "Overview";
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [serviceFilter, setServiceFilter] = useState("All services");
  const [dateFilter, setDateFilter] = useState("");
  const [sort, setSort] = useState("Newest first");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [timeRange, setTimeRange] = useState("Monthly");
  const [activityNow, setActivityNow] = useState(Date.now());
  const [accounts, setAccounts] = useState(() => getDemoAccounts());
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showAddService, setShowAddService] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", category: "Maintenance", price: "", duration: "1 hr", desc: "" });
  const [disabledEmails, setDisabledEmails] = useState(() =>
    getDemoAccounts().filter((account) => !isDemoAccountActive(account.email)).map((account) => account.email),
  );
  const revenue = monthlyRevenue(bookings);
  const previousMonthRevenue = monthlyRevenue(bookings, 1);
  const completedCount = bookings.filter((booking) => booking.status === "Completed").length;
  const pendingCount = bookings.filter((booking) => booking.status === "Pending").length;
  const confirmedCount = bookings.filter((booking) => booking.status === "Confirmed").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "Cancelled").length;
  const analytics = dashboardSeries(bookings, timeRange);
  const filteredBookings = bookings.filter((booking) => {
    const vehicle = vehicles.find((item) => `${item.brand} ${item.model}` === booking.vehicle);
    const searchText = `${booking.customer || ""} ${booking.vehicle || ""} ${vehicle?.registration || ""} ${booking.service || ""} ${booking.id || ""}`.toLowerCase();
    return (statusFilter === "All statuses" || booking.status === statusFilter) &&
      (serviceFilter === "All services" || booking.service === serviceFilter) &&
      (!dateFilter || bookingDateValue(booking) === dateFilter) &&
      searchText.includes(q.toLowerCase());
  });
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sort === "Oldest first") return bookingTimestamp(a) - bookingTimestamp(b);
    if (sort === "Customer A–Z") return (a.customer || "").localeCompare(b.customer || "");
    return bookingTimestamp(b) - bookingTimestamp(a);
  });
  const pageCount = Math.max(1, Math.ceil(sortedBookings.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleBookings = sortedBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    const timer = window.setInterval(() => setActivityNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const recentActivity = [...bookings]
    .filter((booking) => {
      const timestamp = Date.parse(booking.updatedAt || booking.createdAt || "");
      return Number.isFinite(timestamp) && activityNow - timestamp >= 0 && activityNow - timestamp < 6 * 60 * 60 * 1000;
    })
    .sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));
  const exportBookings = () => {
    const columns = ["Booking ID", "Customer", "Vehicle", "Service", "Service Center", "Appointment Date", "Time", "Estimate (INR)", "Status"];
    const rows = filteredBookings.map((booking) => [booking.id, booking.customer, booking.vehicle, booking.service, booking.center, booking.date, booking.time, booking.price, booking.status]);
    const csvCell = (value) => {
      const text = String(value ?? "");
      const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const csv = `\uFEFF${[columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `auto-dealer-service-operations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`${filteredBookings.length} service operation${filteredBookings.length === 1 ? "" : "s"} exported to an Excel-compatible CSV.`);
  };
  /** Persists an administrator selected appointment status. */
  const update = (booking, status) => {
    if (booking.status === status) return;
    setBookings((current) => current.map((item) => item.id === booking.id
      ? { ...item, status, updatedAt: new Date().toISOString() }
      : item));
    notify(`${booking.id} status updated to ${status}.`);
  };
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
  /** Confirms account deactivation and persists customer access changes. */
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
  /** Deletes a customer and their demo records. */
  const removeAccount = (account) => {
    const email = account.email.trim().toLowerCase();
    const name = account.name.trim().toLowerCase();
    try {
      deleteDemoAccount(email);
      setDisabledEmails((current) => current.filter((entry) => entry !== email));
      setAccounts((current) => current.filter((entry) => entry.email.trim().toLowerCase() !== email));
      if (account.role === "Customer") {
        setVehicles((current) => current.filter((vehicle) =>
          vehicle.ownerEmail
            ? vehicle.ownerEmail.trim().toLowerCase() !== email
            : vehicle.ownerName?.trim().toLowerCase() !== name,
        ));
        setBookings((current) => current.filter((booking) =>
          booking.customerEmail
            ? booking.customerEmail.trim().toLowerCase() !== email
            : booking.customer?.trim().toLowerCase() !== name,
        ));
      }
      setAccountToDelete(null);
      notify(`${account.role} account deleted from this browser demo.`);
    } catch (error) {
      notify(error.message || "The account could not be deleted.");
    }
  };
  const managedAccounts = accounts.filter((account) => account.role === "Customer" && `${account.name} ${account.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead
        eyebrow={tab === "Overview" ? "DEALERSHIP OPERATIONS" : "SERVICE OPERATIONS"}
        title={tab === "Overview" ? `${getTimeGreeting()}, ${user?.role === "Administrator" ? firstName(user.name) : "team"}.` : tab}
        sub={tab === "Overview" ? "Here’s how your service network is doing today." : `Manage ${tab.toLowerCase()} across your service network.`}
        action={
          <span className="admin-date">
            <CalendarDays size={15} /> {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        }
      />
      {tab === "Overview" && <><div className="stats-grid admin-stats">
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
          foot="Awaiting service confirmation"
        />
        <Stat
          icon={<CheckCircle2 />}
          label="Confirmed appointments"
          value={confirmedCount.toLocaleString("en-IN")}
          foot="Scheduled with a service center"
        />
        <Stat
          icon={<X />}
          label="Cancelled appointments"
          value={cancelledCount.toLocaleString("en-IN")}
          foot="Cancelled demo bookings"
        />
        <Stat
          icon={<span className="rupee">₹</span>}
          label="Revenue this month"
          value={money(revenue)}
          foot={`${previousMonthRevenue ? `${Math.round(((revenue - previousMonthRevenue) / previousMonthRevenue) * 100)}%` : "—"} from last month`}
        />
      </div>
      <div className="admin-charts">
        <div className="admin-analytics-range"><label>Analytics period<select aria-label="Dashboard time range" value={timeRange} onChange={(event) => setTimeRange(event.target.value)}>{Object.keys(RANGE_OPTIONS).map((range) => <option key={range}>{range}</option>)}</select></label></div>
        <section className="dash-panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>{timeRange} completed service revenue · ₹ thousands</p>
            </div>
          </div>
          <RevenueChart data={analytics} />
        </section>
        <section className="dash-panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Appointment activity</h2>
              <p>{timeRange} appointment volume</p>
            </div>
          </div>
          <ActivityChart data={analytics} />
        </section>
      </div>
      </>}
      {tab !== "Overview" && <section className="dash-panel admin-bookings">
        <div className="panel-heading">
          <div>
            <h2>{tab}</h2>
            <p>{tab === "Appointments" ? "Review, filter, export, and update appointment requests." : tab === "Services" ? "Manage the service catalogue and pricing." : "Review customer demo accounts and activity."}</p>
          </div>
          <button className="table-action export-operations" type="button" onClick={exportBookings}><Download size={15} /> Export Excel (.csv)</button>
        </div>
        {tab === "Appointments" ? (
          <>
            <div className="admin-search">
              <SearchInput
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search by customer, vehicle or booking"
              />
            </div>
            <div className="admin-booking-filters">
              <label className="select-label"><span>Status</span><select aria-label="Filter bookings by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                <option>All statuses</option>
                {[...new Set(bookings.map((booking) => booking.status))].sort().map((status) => <option key={status}>{status}</option>)}
              </select></label>
              <label className="select-label"><span>Service</span><select aria-label="Filter bookings by service" value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setPage(1); }}>
                <option>All services</option>
                {[...new Set(bookings.map((booking) => booking.service))].sort().map((service) => <option key={service}>{service}</option>)}
              </select></label>
              <label className="select-label"><span>Appointment date</span><input aria-label="Filter bookings by date" type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} /></label>
              <label className="select-label"><span>Sort</span><select aria-label="Sort bookings" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
                <option>Newest first</option><option>Oldest first</option><option>Customer A–Z</option>
              </select></label>
              <button className="table-action" type="button" onClick={() => { setQ(""); setStatusFilter("All statuses"); setServiceFilter("All services"); setDateFilter(""); setSort("Newest first"); setPage(1); }}>Clear filters</button>
            </div>
            <div className="admin-booking-meta"><span>{sortedBookings.length} matching appointment{sortedBookings.length === 1 ? "" : "s"}</span><label>Rows per page<select aria-label="Bookings per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={5}>5</option><option value={8}>8</option><option value={12}>12</option></select></label></div>
            <div className="table-wrap admin-booking-table-wrap" role="region" aria-label="Service booking management" tabIndex={0}>
              <table className="admin-booking-table">
                <thead>
                  <tr>
                    <th>BOOKING / CUSTOMER</th>
                    <th>VEHICLE & SERVICE</th>
                    <th>DATE</th>
                    <th>ESTIMATE</th>
                    <th>STATUS</th>
                    <th>UPDATE</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((b) => (
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
                      <td><button className="table-action" type="button" onClick={() => setSelectedBooking(b)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!sortedBookings.length && <p className="account-empty">No appointments match these filters.</p>}
            {sortedBookings.length > 0 && <div className="pagination admin-booking-pagination"><span>Page {currentPage} of {pageCount}</span><button type="button" aria-label="Previous appointments page" disabled={currentPage === 1} onClick={() => setPage(Math.max(1, currentPage - 1))}><ChevronLeft /></button><button type="button" aria-label="Next appointments page" disabled={currentPage === pageCount} onClick={() => setPage(Math.min(pageCount, currentPage + 1))}><ChevronRight /></button></div>}
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
        ) : tab === "Overview" ? null : (
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
              const active = !disabledEmails.includes(account.email);
              return (
                <div key={account.id || account.email}>
                  <span className="avatar">{account.name?.[0] || account.email[0].toUpperCase()}</span>
                  <span className="account-identity"><b>{account.name}</b><small>{account.username ? `Username: ${account.username}` : account.email}</small></span>
                  <span className="account-activity">{accountVehicles.length} vehicles · {customerBookings.length} bookings</span>
                  <span className={`account-state ${active ? "active" : "inactive"}`}>{active ? "Active" : "Inactive"}</span>
                  <div className="account-actions">
                    <button className="table-action" type="button" onClick={() => toggleAccount(account)}>{active ? "Deactivate" : "Activate"}</button>
                    <button className="table-action account-delete-action" type="button" onClick={() => setAccountToDelete(account)} aria-label={`Delete ${account.name} account`}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              );
            })}
            {!managedAccounts.length && <p className="account-empty">No {tab.toLowerCase()} demo accounts found.</p>}
          </div>
        )}
      </section>}
      {accountToDelete && <AccessibleDialog className="form-modal service-create-modal account-delete-dialog" labelledBy="delete-account-title" describedBy="delete-account-description" onClose={() => setAccountToDelete(null)}>
        <button className="modal-close" type="button" aria-label="Close delete account confirmation" onClick={() => setAccountToDelete(null)}><X size={18} /></button>
        <span className="eyebrow">DEMO ACCOUNT MANAGEMENT</span>
        <h2 id="delete-account-title">Delete {accountToDelete.role.toLowerCase()} account?</h2>
        <p id="delete-account-description">This permanently removes {accountToDelete.name}'s demo login, vehicles, and appointments.</p>
        <div className="service-create-actions">
          <button className="btn outline" type="button" onClick={() => setAccountToDelete(null)}>Keep account</button>
          <button className="btn danger" type="button" onClick={() => removeAccount(accountToDelete)}>Delete account</button>
        </div>
      </AccessibleDialog>}
      {tab === "Overview" && <section className="dash-panel admin-activity-panel">
        <div className="panel-heading"><div><h2>Recent activity</h2><p>Activity is cleared from this view six hours after it occurs.</p></div><span className="activity-window-label">Last 6 hours</span></div>
        <div className="table-wrap recent-activity-table-wrap" role="region" aria-label="Recent activity in the last six hours" tabIndex={0}>
          <table><caption className="sr-only">Recent service booking activity from the last six hours</caption><thead><tr><th scope="col">TIME</th><th scope="col">BOOKING</th><th scope="col">CUSTOMER</th><th scope="col">VEHICLE & SERVICE</th><th scope="col">CENTER</th><th scope="col">STATUS</th></tr></thead>
            <tbody>{recentActivity.map((booking) => { const timestamp = booking.updatedAt || booking.createdAt; return <tr key={booking.id}>
              <td><time dateTime={timestamp}>{new Date(timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time><small>{booking.updatedAt ? "Status updated" : "Booking created"}</small></td>
              <td><b>{booking.id}</b></td><td>{booking.customer || "Demo customer"}</td><td><b>{booking.vehicle}</b><small>{booking.service}</small></td><td>{booking.center}</td><td><Status status={booking.status} /></td>
            </tr>; })}</tbody>
          </table>
          {!recentActivity.length && <p className="account-empty">No booking activity in the last six hours.</p>}
        </div>
      </section>}
      {selectedBooking && <AccessibleDialog className="form-modal booking-detail-modal" labelledBy="admin-booking-detail-title" onClose={() => setSelectedBooking(null)}>
        <button className="modal-close" type="button" aria-label="Close booking details" onClick={() => setSelectedBooking(null)}><X size={18} /></button>
        <span className="eyebrow">APPOINTMENT DETAILS</span>
        <h2 id="admin-booking-detail-title">Booking {selectedBooking.id}</h2>
        <div className="admin-booking-detail-grid">
          <div><small>CUSTOMER</small><b>{selectedBooking.customer || "Demo customer"}</b></div>
          <div><small>VEHICLE</small><b>{selectedBooking.vehicle}</b></div>
          <div><small>SERVICE</small><b>{selectedBooking.service}</b></div>
          <div><small>APPOINTMENT</small><b>{selectedBooking.date} · {selectedBooking.time}</b></div>
          <div><small>SERVICE CENTER</small><b>{selectedBooking.center}</b></div>
          <div><small>ESTIMATE</small><b>{money(selectedBooking.price)}</b></div>
          <div><small>STATUS</small><Status status={selectedBooking.status} /></div>
          {selectedBooking.note && <div><small>CUSTOMER NOTE</small><b>{selectedBooking.note}</b></div>}
        </div>
        <div className="service-create-actions"><button className="btn primary" type="button" onClick={() => setSelectedBooking(null)}>Done</button></div>
      </AccessibleDialog>}
    </>
  );
}
