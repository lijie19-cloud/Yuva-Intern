import React, { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { centers, history as historySeed } from "./data";
import { bookingsForUser, useApp, vehiclesForUser } from "./state";
import { getDemoAccounts, isDemoAccountActive } from "./services/demoAuth";
import {
  Button,
  AccessibleDialog,
  Empty,
  SectionTitle,
  ServiceCard,
  Status,
  SearchInput,
} from "./ui";
/** Formats a numeric service price as Indian rupees. */
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
/** Provides a consistent heading block for app pages. */
function PageHead({ eyebrow, title, sub, action }) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}
/** Searches, filters, sorts, and paginates the service catalogue. */
export function Services() {
  const { services } = useApp();
  const [q, setQ] = useState(""),
    [cat, setCat] = useState("All services"),
    [sort, setSort] = useState("Popular"),
    [page, setPage] = useState(1);
  const filtered = useMemo(
    () =>
      services
        .filter(
          (s) =>
            (cat === "All services" || s.category === cat) &&
            `${s.name} ${s.desc}`.toLowerCase().includes(q.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Price: low to high"
            ? a.price - b.price
            : sort === "Price: high to low"
              ? b.price - a.price
              : b.popularity - a.popularity,
        ),
    [services, q, cat, sort],
  );
  const shown = filtered.slice((page - 1) * 6, page * 6);
  return (
    <div className="container page">
      <PageHead
        eyebrow="OUR SERVICES"
        title="Care that keeps you moving"
        sub="Expert two-wheeler servicing with upfront pricing and dependable care."
        action={
          <Link to="/book-service" className="btn primary">
            Book a service <ArrowRight size={16} />
          </Link>
        }
      />
      <div className="filter-bar">
        <SearchInput
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search services"
        />
        <div className="filter-controls">
          <label className="select-label">
            <span>Category</span>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option>All services</option>
              <option>Maintenance</option>
              <option>Repairs</option>
              <option>Care</option>
            </select>
          </label>
          <label className="select-label">
            <span>Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option>Popular</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </label>
        </div>
      </div>
      <div className="service-grid">
        {shown.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
      {!shown.length && (
        <Empty
          title="No services found"
          text="Try another search or category."
        />
      )}
      {filtered.length > 6 && (
        <div className="pagination">
          <span>
            Showing {(page - 1) * 6 + 1}–{Math.min(page * 6, filtered.length)}{" "}
            of {filtered.length}
          </span>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() =>
              setPage(Math.min(Math.ceil(filtered.length / 6), page + 1))
            }
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
/** Displays one service, its estimate, benefits, and related options. */
export function Detail() {
  const { id } = useParams();
  const { services } = useApp();
  const s = services.find((x) => x.id === id);
  if (!s)
    return (
      <div className="container page">
        <Empty title="Service not found" text="That service may have moved." />
      </div>
    );
  return (
    <div className="container page">
      <Link className="back-link" to="/services">
        <ArrowLeft size={16} /> All services
      </Link>
      <div className="detail-layout">
        <div>
          <img
            className="detail-image"
            src={s.image}
            alt={s.name}
          />
          <div className="detail-description">
            <span className="eyebrow">{s.category.toUpperCase()}</span>
            <h1>{s.name}</h1>
            <p>{s.desc}</p>
            <h2>What's included</h2>
            <ul className="check-list">
              {s.includes.map((x) => (
                <li key={x}>
                  <CheckCircle2 size={18} />
                  {x}
                </li>
              ))}
            </ul>
            <h2>Why riders choose this service</h2>
            <p>
              Experienced technicians, genuine parts and a clear service report
              every time. Your booking includes a complimentary post-service
              safety check.
            </p>
            <div className="review">
              <div className="stars">★★★★★</div>
              <b>“Professional and right on time.”</b>
              <p>
                They explained what my bike needed and got me back on the road
                the same day.
              </p>
              <small>— Verified Auto Dealer rider</small>
            </div>
          </div>
        </div>
        <aside className="booking-panel">
          <span className="eyebrow">SERVICE ESTIMATE</span>
          <h2>
            {money(s.price)}
            <small> onwards</small>
          </h2>
          <div className="panel-row">
            <Clock3 /> Estimated time <b>{s.duration}</b>
          </div>
          <div className="panel-row">
            <Star /> Rider rating <b>4.8 / 5</b>
          </div>
          <div className="panel-divider" />
          <p>
            Final cost depends on vehicle condition and parts required. We'll
            confirm any changes before work begins.
          </p>
          <Link
            className="btn primary full"
            to={`/book-service?service=${s.id}`}
          >
            Book appointment <ArrowRight size={17} />
          </Link>
          <Link className="btn outline full" to="/services">
            Compare services
          </Link>
        </aside>
      </div>
      <h2 className="related-title">You might also need</h2>
      <div className="service-grid">
        {services
          .filter((x) => x.id !== id)
          .slice(0, 3)
          .map((x) => (
            <ServiceCard key={x.id} service={x} />
          ))}
      </div>
    </div>
  );
}
const steps = ["Vehicle", "Service", "Center", "Appointment", "Review"];
/** Runs the validated vehicle-to-confirmation appointment wizard. */
export function Booking() {
  const [query] = useSearchParams();
  const { user, vehicles: allVehicles, setVehicles, bookings, setBookings, services, notify } = useApp();
  const vehicles = vehiclesForUser(allVehicles, user);
  const advisors = getDemoAccounts().filter((account) => account.role === "Service Advisor" && isDemoAccountActive(account.email));
  const [step, setStep] = useState(0),
    [vehicle, setVehicle] = useState(vehicles[0]?.id || ""),
    [addVehicle, setAddVehicle] = useState(false),
    [service, setService] = useState(query.get("service") || ""),
    [center, setCenter] = useState(""),
    [date, setDate] = useState(""),
    [time, setTime] = useState(""),
    [advisor, setAdvisor] = useState(""),
    [note, setNote] = useState(""),
    [done, setDone] = useState(null);
  const [brand, setBrand] = useState("Royal Enfield"),
    [model, setModel] = useState("Hunter 350"),
    [reg, setReg] = useState(""),
    [year, setYear] = useState("2024");
  const selectedVehicle = vehicles.find((v) => v.id === vehicle);
  const selectedService = services.find((s) => s.id === service);
  const slots = [
    "09:00 AM",
    "10:30 AM",
    "12:00 PM",
    "02:00 PM",
    "03:30 PM",
    "05:00 PM",
  ];
  /** Validates the current booking step before advancing. */
  const next = () => {
    if (step === 0 && !vehicle && !addVehicle) {
      notify("Choose or add a vehicle to continue.");
      return;
    }
    if (step === 0 && addVehicle && !reg.trim()) {
      notify("Enter the vehicle registration number.");
      return;
    }
    if (step === 1 && !service) {
      notify("Select a service to continue.");
      return;
    }
    if (step === 2 && !center) {
      notify("Select a service center.");
      return;
    }
    if (step === 3 && (!date || !time)) {
      notify("Choose a date and time slot.");
      return;
    }
    setStep(step + 1);
  };
  /** Creates the booking record and presents its confirmation reference. */
  const confirm = () => {
    let v = selectedVehicle;
    if (addVehicle) {
      v = {
        id: `v${Date.now()}`,
        brand,
        model,
        ownerName: user?.name,
        ownerEmail: user?.email,
        registration: reg.toUpperCase(),
        year: Number(year),
        cc: 350,
        lastService: "Not serviced yet",
        nextDue: "To be scheduled",
      };
      setVehicles([...allVehicles, { ...v, ownerName: user?.name, ownerEmail: user?.email }]);
    }
    const id = `AD-${Math.floor(2600 + Math.random() * 700)}`;
    const b = {
      id,
      vehicle: `${v?.brand || brand} ${v?.model || model}`,
      service: selectedService.name,
      center: centers
        .find((c) => c.id === center)
        .name.replace("Auto Dealer – ", ""),
      date: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time,
      price: selectedService.price,
      status: "Confirmed",
      customer: user?.name || "Customer",
      customerEmail: user?.email || "",
      advisorEmail: advisor,
      advisorName: advisors.find((account) => account.email === advisor)?.name || "Any available advisor",
      note,
    };
    setBookings([b, ...bookings]);
    setDone(b);
    notify("Your appointment is confirmed.");
  };
  if (done)
    return (
      <div className="container page confirmation">
        <div className="confirm-check">
          <CheckCircle2 size={38} />
        </div>
        <span className="eyebrow">YOU'RE ALL SET</span>
        <h1>Your ride is in good hands.</h1>
        <p>
          Your booking is confirmed. We'll send the details and a reminder
          before your appointment.
        </p>
        <div className="confirm-card">
          <div>
            <span>BOOKING REFERENCE</span>
            <b>{done.id}</b>
          </div>
          <div>
            <span>VEHICLE</span>
            <b>{done.vehicle}</b>
          </div>
          <div>
            <span>SERVICE</span>
            <b>{done.service}</b>
          </div>
          <div>
            <span>APPOINTMENT</span>
            <b>
              {done.date} · {done.time}
            </b>
          </div>
          <div>
            <span>SERVICE CENTER</span>
            <b>{done.center}</b>
          </div>
          <div>
            <span>ESTIMATED COST</span>
            <b>{money(done.price)}</b>
          </div>
        </div>
        <div className="hero-buttons center-buttons">
          <Link className="btn primary" to="/dashboard/bookings">
            View my booking <ArrowRight size={16} />
          </Link>
          <Link className="btn outline" to="/">
            Back to home
          </Link>
        </div>
      </div>
    );
  return (
    <div className="container page booking-page">
      <PageHead
        eyebrow="BOOK AN APPOINTMENT"
        title="Let's get your ride sorted"
        sub="A few quick details, and we’ll take it from here."
      />
      <div className="progress">
        <div className="progress-track">
          <span style={{ width: `${step * 25}%` }} />
        </div>
        {steps.map((s, i) => (
          <div
            key={s}
            className={`progress-step ${i === step ? "active" : ""} ${i < step ? "passed" : ""}`}
          >
            <span>{i < step ? <Check size={15} /> : i + 1}</span>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <div className="wizard-grid">
        <section className="wizard-card">
          <span className="eyebrow">STEP {step + 1} OF 5</span>
          <h2>
            {
              [
                "Choose your vehicle",
                "Choose your service",
                "Choose a service center",
                "Choose a date & time",
                "Review your booking",
              ][step]
            }
          </h2>
          {step === 0 && (
            <>
              <p>Select a vehicle or add a new ride to your garage.</p>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setVehicle(v.id);
                    setAddVehicle(false);
                  }}
                  className={`option-card ${vehicle === v.id && !addVehicle ? "selected" : ""}`}
                >
                  <span className="vehicle-symbol">🏍️</span>
                  <span>
                    <b>
                      {v.brand} {v.model}
                    </b>
                    <small>
                      {v.registration} · {v.year}
                    </small>
                  </span>
                  <span className="radio" />
                </button>
              ))}
              <button
                className={`option-card ${addVehicle ? "selected" : ""}`}
                onClick={() => setAddVehicle(true)}
              >
                <span className="vehicle-symbol add-symbol">
                  <Plus />
                </span>
                <span>
                  <b>Add a new vehicle</b>
                  <small>Register another ride</small>
                </span>
                <span className="radio" />
              </button>
              {addVehicle && (
                <div className="form-grid">
                  <label>
                    Manufacturer
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                    >
                      <option>Royal Enfield</option>
                      <option>Honda</option>
                      <option>Hero</option>
                      <option>TVS</option>
                      <option>Yamaha</option>
                      <option>Suzuki</option>
                    </select>
                  </label>
                  <label>
                    Model
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  </label>
                  <label>
                    Registration number
                    <input
                      value={reg}
                      onChange={(e) => setReg(e.target.value)}
                      placeholder="DL 01 AB 1234"
                    />
                  </label>
                  <label>
                    Year
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      min="1990"
                      max="2026"
                    />
                  </label>
                </div>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <p>Pick the service that best matches your ride's needs.</p>
              <div className="service-options">
                {services.map((s) => (
                  <button
                    key={s.id}
                    className={`service-option ${service === s.id ? "selected" : ""}`}
                    onClick={() => setService(s.id)}
                  >
                    <span>
                      <b>{s.name}</b>
                      <small>
                        {s.duration} · {s.category}
                      </small>
                    </span>
                    <strong>{money(s.price)}</strong>
                    <span className="radio" />
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <p>Choose the Auto Dealer workshop that works best for you.</p>
              {centers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCenter(c.id)}
                  className={`center-option ${center === c.id ? "selected" : ""}`}
                >
                  <span className="center-pin">
                    <MapPin />
                  </span>
                  <span>
                    <b>{c.name.replace("Auto Dealer – ", "")}</b>
                    <small>{c.address}</small>
                    <small>
                      {c.phone} · {c.rating} ★
                    </small>
                  </span>
                  <span className="radio" />
                </button>
              ))}
            </>
          )}
          {step === 3 && (
            <>
              <p>
                Choose a convenient day and a time slot. All times are local.
              </p>
              <label className="field-label">
                Appointment date
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <div className="slots-label">AVAILABLE TIME SLOTS</div>
              <div className="slots">
                {slots.map((t) => (
                  <button
                    key={t}
                    className={time === t ? "selected" : ""}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label className="field-label">
                Preferred service advisor
                <select
                  value={advisor}
                  onChange={(e) => setAdvisor(e.target.value)}
                >
                  <option value="">Any available advisor</option>
                  {advisors.map((account) => <option key={account.email} value={account.email}>{account.name}</option>)}
                </select>
              </label>
              <label className="field-label">
                Anything we should know?{" "}
                <span className="optional">Optional</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tell us about a sound, issue or request…"
                  rows="3"
                />
              </label>
            </>
          )}
          {step === 4 && (
            <>
              <p>Please check the details before confirming your visit.</p>
              <div className="review-list">
                <div>
                  <span>VEHICLE</span>
                  <b>
                    {addVehicle
                      ? `${brand} ${model} · ${reg}`
                      : `${selectedVehicle?.brand} ${selectedVehicle?.model} · ${selectedVehicle?.registration}`}
                  </b>
                  <button onClick={() => setStep(0)}>Edit</button>
                </div>
                <div>
                  <span>SERVICE</span>
                  <b>{selectedService?.name}</b>
                  <button onClick={() => setStep(1)}>Edit</button>
                </div>
                <div>
                  <span>SERVICE CENTER</span>
                  <b>{centers.find((c) => c.id === center)?.name}</b>
                  <button onClick={() => setStep(2)}>Edit</button>
                </div>
                <div>
                  <span>APPOINTMENT</span>
                  <b>
                    {date
                      ? new Date(`${date}T12:00:00`).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "long", year: "numeric" },
                        )
                      : ""}{" "}
                    · {time}
                  </b>
                  <button onClick={() => setStep(3)}>Edit</button>
                </div>
                {note && (
                  <div>
                    <span>YOUR NOTE</span>
                    <b>{note}</b>
                  </div>
                )}
              </div>
              <div className="estimate">
                <span>Estimated total</span>
                <b>{money(selectedService?.price || 0)}</b>
              </div>
              <small className="fine-print">
                Final pricing may vary if additional work is required. We always
                ask before proceeding.
              </small>
            </>
          )}
          <div className="wizard-actions">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={next}>
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={confirm}>
                <Check size={16} /> Confirm booking
              </Button>
            )}
          </div>
        </section>
        <aside className="booking-aside">
          <div className="aside-icon">
            <ShieldCheck />
          </div>
          <h3>Care you can count on.</h3>
          <p>
            Every service includes a clear estimate, certified technicians and a
            digital record for your vehicle.
          </p>
          <ul>
            <li>
              <Check size={15} /> No hidden charges
            </li>
            <li>
              <Check size={15} /> Genuine parts
            </li>
            <li>
              <Check size={15} /> Service warranty included
            </li>
          </ul>
          <div className="aside-help">
            Need help? <a href="tel:+911143567800">+91 11 4356 7800</a>
          </div>
        </aside>
      </div>
    </div>
  );
}
/** Summarizes the customer vehicles, visits, and maintenance activity. */
export function Dashboard() {
  const { user, vehicles, bookings } = useApp();
  const ownVehicles = vehiclesForUser(vehicles, user);
  const ownBookings = bookingsForUser(bookings, user);
  const upcoming = ownBookings.filter((b) =>
    ["Pending", "Confirmed", "In Progress"].includes(b.status),
  );
  const completed = ownBookings.filter((b) => b.status === "Completed").length;
  return (
    <>
      <PageHead
        eyebrow="YOUR GARAGE"
        title={`Good morning, ${user?.name?.split(" ")[0] || "rider"}.`}
        sub="Here's what’s happening with your rides."
        action={
          <Link to="/book-service" className="btn primary">
            <Plus size={16} /> Book a service
          </Link>
        }
      />
      <div className="stats-grid">
        <Stat
          icon={<CarFront />}
          label="Your vehicles"
          value={ownVehicles.length}
          foot="Ready for their next ride"
        />
        <Stat
          icon={<CalendarDays />}
          label="Upcoming visits"
          value={upcoming.length}
          foot={
            upcoming[0] ? `Next: ${upcoming[0].date}` : "No visits scheduled"
          }
        />
        <Stat
          icon={<CheckCircle2 />}
          label="Services completed"
          value={completed}
          foot="Keeping your ride in shape"
        />
      </div>
      <div className="dash-columns">
        <section className="dash-panel">
          <div className="panel-heading">
            <div>
              <h2>Next appointment</h2>
              <p>Your upcoming service visit</p>
            </div>
            <Link className="text-link" to="/dashboard/bookings">
              All bookings <ArrowRight size={14} />
            </Link>
          </div>
          {upcoming.slice(0, 1).map((b) => (
            <div className="next-appointment" key={b.id}>
              <div className="appointment-date">
                <b>{b.date.slice(0, 2)}</b>
                <span>{b.date.slice(3, 6).toUpperCase()}</span>
              </div>
              <div className="next-info">
                <b>{b.service}</b>
                <span>{b.vehicle}</span>
                <small>
                  <Clock3 size={14} /> {b.time} <MapPin size={14} /> {b.center}
                </small>
              </div>
              <Status status={b.status} />
            </div>
          ))}
          {!upcoming.length && (
            <Empty
              title="No upcoming visits"
              text="Keep your ride in shape by booking a service."
            />
          )}
        </section>
        <section className="dash-panel reminder-panel">
          <span className="reminder-icon">
            <Sparkles />
          </span>
          <span className="eyebrow">RIDE REMINDER</span>
          <h2>Classic 350 is due soon</h2>
          <p>
            Your next recommended service is coming up on <b>12 Dec 2026</b>.
          </p>
          <Link className="text-link" to="/book-service">
            Schedule service <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="dash-panel vehicle-panel">
        <div className="panel-heading">
          <div>
            <h2>Your vehicles</h2>
            <p>Your garage at a glance</p>
          </div>
          <Link className="text-link" to="/dashboard/vehicles">
            Manage vehicles <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mini-vehicles">
          {ownVehicles.map((v) => (
            <div className="mini-vehicle" key={v.id}>
              <span className="vehicle-symbol">🏍️</span>
              <div>
                <b>
                  {v.brand} {v.model}
                </b>
                <small>
                  {v.registration} · {v.year}
                </small>
              </div>
              <span className="due-label">
                Next service <b>{v.nextDue}</b>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="dash-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Your service history, all in one place</p>
          </div>
          <Link className="text-link" to="/dashboard/history">
            View history <ArrowRight size={14} />
          </Link>
        </div>
        <div className="activity-list">
          {ownBookings
            .filter((b) => b.status === "Completed")
            .slice(0, 3)
            .map((b) => (
              <div className="activity-row" key={b.id}>
                <span className="activity-check">
                  <Check size={15} />
                </span>
                <span>
                  <b>{b.service}</b>
                  <small>
                    {b.vehicle} · {b.date}
                  </small>
                </span>
                <strong>{money(b.price)}</strong>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
/** Displays one dashboard metric with an icon and supporting label. */
function Stat({ icon, label, value, foot }) {
  return (
    <article className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <b>{value}</b>
      <small>{foot}</small>
    </article>
  );
}
/** Lists garage vehicles and handles create, edit, search, and delete actions. */
export function Vehicles() {
  const { user, vehicles: allVehicles, setVehicles, notify } = useApp();
  const vehicles = vehiclesForUser(allVehicles, user);
  const [editing, setEditing] = useState(null),
    [form, setForm] = useState({
      brand: "Honda",
      model: "Shine",
      registration: "",
      year: "2024",
      cc: "125",
    });
  const [q, setQ] =
    useState(""); /** Validates and saves a new or edited vehicle record. */
  const save = (e) => {
    e.preventDefault();
    if (!form.registration.trim()) {
      notify("Registration number is required.");
      return;
    }
    if (editing === "new")
      setVehicles([
        ...allVehicles,
        {
          ...form,
          id: `v${Date.now()}`,
          ownerName: user?.name,
          ownerEmail: user?.email,
          year: +form.year,
          cc: +form.cc,
          lastService: "Not serviced yet",
          nextDue: "To be scheduled",
        },
      ]);
    else
      setVehicles(
        allVehicles.map((v) =>
          v.id === editing
            ? { ...v, ...form, year: +form.year, cc: +form.cc }
            : v,
        ),
      );
    setEditing(null);
    notify("Vehicle details saved.");
  }; /** Confirms before removing a vehicle from the local garage. */
  const remove = (v) => {
    if (window.confirm(`Remove ${v.brand} ${v.model} from your garage?`)) {
      setVehicles(allVehicles.filter((x) => x.id !== v.id));
      notify("Vehicle removed from your garage.");
    }
  };
  return (
    <>
      <PageHead
        eyebrow="YOUR GARAGE"
        title="My vehicles"
        sub="Manage your rides and keep their service details up to date."
        action={
          <Button
            onClick={() => {
              setForm({
                brand: "Honda",
                model: "Shine",
                registration: "",
                year: "2024",
                cc: "125",
              });
              setEditing("new");
            }}
          >
            <Plus size={16} /> Add vehicle
          </Button>
        }
      />
      <div className="vehicle-toolbar">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your vehicles"
        />
        <span>
          {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
        </span>
      </div>
      {editing && (
        <AccessibleDialog className="form-modal" labelledBy="vehicle-dialog-title" onClose={() => setEditing(null)}>
          <form className="vehicle-editor-form" onSubmit={save}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditing(null)}
              aria-label="Close"
            >
              <X />
            </button>
            <span className="eyebrow">GARAGE DETAILS</span>
            <h2 id="vehicle-dialog-title">{editing === "new" ? "Add a vehicle" : "Edit vehicle"}</h2>
            <div className="form-grid">
              <label>
                Manufacturer
                <select
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                >
                  <option>Royal Enfield</option>
                  <option>Honda</option>
                  <option>Hero</option>
                  <option>TVS</option>
                  <option>Yamaha</option>
                  <option>Suzuki</option>
                </select>
              </label>
              <label>
                Model
                <input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </label>
              <label>
                Registration number
                <input
                  value={form.registration}
                  onChange={(e) =>
                    setForm({ ...form, registration: e.target.value })
                  }
                  placeholder="DL 01 AB 1234"
                />
              </label>
              <label>
                Manufacturing year
                <input
                  required
                  type="number"
                  min="1990"
                  max="2026"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </label>
              <label>
                Engine capacity (cc)
                <input
                  type="number"
                  min="50"
                  value={form.cc}
                  onChange={(e) => setForm({ ...form, cc: e.target.value })}
                />
              </label>
            </div>
            <div className="wizard-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save vehicle</Button>
            </div>
          </form>
        </AccessibleDialog>
      )}
      <div className="vehicle-cards">
        {vehicles
          .filter((v) =>
            `${v.brand} ${v.model} ${v.registration}`
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .map((v) => (
            <article className="garage-card" key={v.id}>
              <div className="garage-photo">
                <span>🏍️</span>
                <div className="garage-tag">{v.cc} cc</div>
              </div>
              <div className="garage-info">
                <span className="eyebrow">{v.registration}</span>
                <h2>
                  {v.brand} {v.model}
                </h2>
                <p>Manufactured {v.year}</p>
                <div className="garage-dates">
                  <span>
                    <small>LAST SERVICE</small>
                    <b>{v.lastService}</b>
                  </span>
                  <span>
                    <small>NEXT SERVICE DUE</small>
                    <b>{v.nextDue}</b>
                  </span>
                </div>
                <div className="garage-actions">
                  <Link to="/dashboard/history" className="text-link">
                    Service history <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={() => {
                      setForm(v);
                      setEditing(v.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    aria-label={`Delete ${v.model}`}
                    onClick={() => remove(v)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
      {!vehicles.length && (
        <Empty
          title="Your garage is ready"
          text="Add your first vehicle to get personalized service reminders."
        />
      )}
    </>
  );
}
/** Searches and filters appointments and exposes cancellation actions. */
export function Bookings() {
  const { user, bookings: allBookings, setBookings, notify } = useApp();
  const bookings = bookingsForUser(allBookings, user);
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("All bookings"),
    [sort, setSort] = useState("Newest first");
  let list = bookings.filter(
    (b) =>
      (status === "All bookings" || b.status === status) &&
      `${b.id} ${b.vehicle} ${b.service} ${b.center}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  if (sort === "Newest first")
    list = [
      ...list,
    ].reverse(); /** Cancels an eligible appointment after user confirmation. */
  const cancel = (b) => {
    if (window.confirm(`Cancel booking ${b.id}?`)) {
      setBookings(
        allBookings.map((x) =>
          x.id === b.id ? { ...x, status: "Cancelled" } : x,
        ),
      );
      notify("Your booking has been cancelled.");
    }
  };
  return (
    <>
      <PageHead
        eyebrow="YOUR GARAGE"
        title="My bookings"
        sub="Track appointments and manage your service visits."
        action={
          <Link to="/book-service" className="btn primary">
            <Plus size={16} /> Book a service
          </Link>
        }
      />
      <div className="filter-bar booking-filter">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search bookings"
        />
        <div className="filter-controls">
          <label className="select-label">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {[
                "All bookings",
                "Pending",
                "Confirmed",
                "In Progress",
                "Completed",
                "Cancelled",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="select-label">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option>Newest first</option>
              <option>Oldest first</option>
            </select>
          </label>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>BOOKING</th>
              <th>VEHICLE & SERVICE</th>
              <th>APPOINTMENT</th>
              <th>ESTIMATE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td>
                  <b>{b.id}</b>
                  <small>{b.center}</small>
                </td>
                <td>
                  <b>{b.service}</b>
                  <small>{b.vehicle}</small>
                </td>
                <td>
                  <b>{b.date}</b>
                  <small>{b.time}</small>
                </td>
                <td>
                  <b>{money(b.price)}</b>
                </td>
                <td>
                  <Status status={b.status} />
                </td>
                <td>
                  {["Pending", "Confirmed"].includes(b.status) && (
                    <button className="table-action" onClick={() => cancel(b)}>
                      Cancel
                    </button>
                  )}
                  <button
                    className="table-action"
                    title={`Details for ${b.id}`}
                    onClick={() =>
                      window.alert(
                        `${b.id}\n${b.vehicle}\n${b.service}\n${b.date} at ${b.time}\n${b.center}\nEstimated: ${money(b.price)}`,
                      )
                    }
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.length && (
        <Empty
          title="No matching bookings"
          text="Try changing the search or status filter."
        />
      )}
    </>
  );
}
/** Builds a maintenance timeline from service records and completed bookings. */
export function History() {
  const { user, bookings } = useApp();
  const items = [
    ...historySeed.filter((record) => record.ownerName?.toLowerCase() === user?.name?.toLowerCase()),
    ...bookingsForUser(bookings, user)
      .filter((b) => b.status === "Completed")
      .map((b) => ({
        date: b.date,
        vehicle: b.vehicle,
        service: b.service,
        center: b.center,
        price: b.price,
        parts: "As recorded by your technician",
        note: "Service completed successfully. Your ride is ready for the road.",
      })),
  ];
  return (
    <>
      <PageHead
        eyebrow="YOUR GARAGE"
        title="Service history"
        sub="Every tune-up, repair and recommendation in one place."
      />
      <div className="history-intro">
        <span className="history-icon">
          <Wrench />
        </span>
        <span>
          <b>A healthy ride has a story.</b>
          <small>
            Your digital records make it easy to stay ahead of maintenance.
          </small>
        </span>
      </div>
      <div className="timeline">
        {items.map((h, i) => (
          <article className="timeline-item" key={`${h.date}-${i}`}>
            <span className="timeline-dot">
              <Check size={14} />
            </span>
            <div className="timeline-card">
              <div className="timeline-head">
                <div>
                  <span className="eyebrow">{h.date}</span>
                  <h2>{h.service}</h2>
                  <p>{h.vehicle}</p>
                </div>
                <b>{money(h.price)}</b>
              </div>
              <div className="timeline-meta">
                <span>
                  <MapPin size={14} />
                  {h.center}
                </span>
                <span>
                  <Wrench size={14} />
                  {h.parts}
                </span>
              </div>
              <p className="tech-note">
                <b>Technician note</b>
                {h.note}
              </p>
            </div>
          </article>
        ))}
      </div>
      <div className="next-recommendation">
        <Sparkles />
        <span>
          <b>Recommended next step</b>
          <small>
            Book a general service every 6 months to keep your ride at its best.
          </small>
        </span>
        <Link to="/book-service" className="text-link">
          Book now <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}
/** Legacy profile screen retained for reference; active route uses profile.jsx. */
export function Profile() {
  const { user, setUser, notify } = useApp();
  const [form, setForm] = useState(
    user || {
      name: "Aarav Mehta",
      email: "aarav@example.com",
      phone: "+91 98765 43210",
      role: "Customer",
    },
  );
  const [editing, setEditing] = useState(false),
    [prefs, setPrefs] = useState({
      reminders: true,
      updates: true,
      offers: false,
    }),
    [pass, setPass] =
      useState(
        false,
      ); /** Saves edited profile fields to the local demo session. */
  const save = (e) => {
    e.preventDefault();
    setUser({ ...user, ...form });
    setEditing(false);
    notify("Profile updated successfully.");
  };
  return (
    <>
      <PageHead
        eyebrow="YOUR GARAGE"
        title="My profile"
        sub="Your personal details and communication preferences."
      />
      <div className="profile-grid">
        <section className="dash-panel profile-main">
          <div className="profile-top">
            <div className="profile-avatar">
              {form.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h2>{form.name}</h2>
              <p>{form.email}</p>
              <span className="tag">Customer account</span>
            </div>
            <Button variant="outline" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit profile"}
            </Button>
          </div>
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
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </label>
              <label>
                Address
                <input
                  value={form.address || "New Delhi, India"}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </label>
              <Button type="submit">Save changes</Button>
            </form>
          ) : (
            <div className="profile-details">
              <div>
                <small>PHONE</small>
                <b>{form.phone}</b>
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
                <input type="password" />
              </label>
              <label>
                New password
                <input type="password" />
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
          }).map(([k, v]) => (
            <label className="toggle-row" key={k}>
              <span>
                <b>{v}</b>
                <small>
                  {k === "reminders"
                    ? "Timely maintenance nudges for your vehicle"
                    : k === "updates"
                      ? "Changes to your service bookings"
                      : "Occasional news from Auto Dealer"}
                </small>
              </span>
              <input
                type="checkbox"
                checked={prefs[k]}
                onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}
              />
            </label>
          ))}
          <button
            className="btn outline full"
            onClick={() => notify("Notification preferences saved.")}
          >
            Save preferences
          </button>
        </section>
      </div>
    </>
  );
}
