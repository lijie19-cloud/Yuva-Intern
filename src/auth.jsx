import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useApp } from "./state";
import { Button } from "./ui";
import { initialBookings, initialVehicles } from "./data";
import {
  hasDemoAdministrator,
  hasLegacyAdminSetup,
  registerDemoAccount,
  signInDemoAccount,
} from "./services/demoAuth";

/** Handles browser-local demo account registration, password verification, and role-based routing. */
export default function Auth({ register = false }) {
  const { setUser, notify, vehicles, setVehicles, bookings, setBookings } =
    useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState("Customer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    serviceCenterId: "",
    username: "",
    pin: "",
  });
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const adminExists = hasDemoAdministrator();
  const legacyAdminNeedsSetup = hasLegacyAdminSetup();
  const adminOptionLocked = register && adminExists;

  /** Validates credentials, creates or restores the role-bound session, then routes to its account. */
  async function submit(event) {
    event.preventDefault();
    setAuthError("");
    if (submitting) return;
    if (register && form.password !== form.confirmPassword) {
      setAuthError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const account = register
        ? await registerDemoAccount({ ...form, role })
        : await signInDemoAccount(form);
      const accountName = account.name;
      if (register && account.role !== "Administrator") {
        if (!vehicles.length) setVehicles(initialVehicles.map((vehicle) => ({ ...vehicle, ownerName: accountName, ownerEmail: account.email })));
        if (!bookings.length) {
          setBookings(
            initialBookings.map((booking) => ({
              ...booking,
              customer: accountName,
            })),
          );
        }
      }
      setUser(account);
      notify(`${register ? "Demo account created" : "Signed in"} as ${account.role}.`);
      navigate(account.role === "Administrator" ? "/admin" : "/dashboard");
    } catch (error) {
      setAuthError(error.message || "We couldn't complete sign-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-image">
        <img
          src="/hero-service-optimized.jpg"
          alt="Motorcycle on a scenic road"
          loading="lazy"
          decoding="async"
          width="512"
          height="339"
        />
        <div>
          <span className="eyebrow">MADE FOR EVERY RIDE</span>
          <h2>
            Good journeys
            <br />
            start with good care.
          </h2>
        </div>
      </div>
      <section className="auth-form">
        <span className="eyebrow">
          {register ? "START YOUR JOURNEY" : "WELCOME BACK"}
        </span>
        <h1>{register ? "Create your account" : "Sign in to your garage"}</h1>
        <p>
          {register
            ? "One account for your vehicles, bookings and service history."
            : "Use the email and password you registered with to access your account."}
        </p>
        {adminOptionLocked && (
          <p className="admin-registered" role="status">
            An administrator account has already been created for this demo.
            Sign in to use it.
          </p>
        )}
        {register && legacyAdminNeedsSetup && (
          <p className="admin-registered" role="status">
            To keep the existing administrator account, choose Administrator and
            register with its existing email address to set a demo password.
          </p>
        )}
        <form onSubmit={submit} aria-busy={submitting}>
          {register && (
            <label>
              Full name
              <input
                required
                autoComplete="name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          {
            <>
              <label>
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Password
                <span className="password-input-wrap">
              <input
                required
                type={showPassword ? "text" : "password"}
                minLength={8}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={register ? "At least 8 characters" : "Your password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                className="password-visibility"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
              </label>
            </>
          }
          {register && (
            <label>
              Confirm password
              <span className="password-input-wrap">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                />
                <button
                  className="password-visibility"
                  type="button"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          )}
          {register && (
            <label>
              Account type
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Customer</option>
                <option disabled={adminOptionLocked}>Administrator</option>
              </select>
            </label>
          )}
          {authError && (
            <p className="auth-error" role="alert">
              {authError}
            </p>
          )}
          <Button className="full" type="submit" disabled={submitting}>
            {submitting
              ? register
                ? "Creating account…"
                : "Signing in…"
              : register
                ? "Create account"
                : "Sign in"}{" "}
            {!submitting && <ArrowRight size={16} />}
          </Button>
        </form>
        <div className="auth-switch">
          {register ? "Already have an account?" : "New to Auto Dealer?"}{" "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Log in" : "Create an account"}
          </Link>
        </div>
        <div className="demo-notice">
          <ShieldCheck size={17} />
          <span>
            <b>Demonstration authentication</b>
            <small>
              Accounts, password verifiers, sessions and roles stay in this
              browser. This is not production-secure: browser data and role
              checks can be changed by the user. Never use a real password.
            </small>
          </span>
        </div>
      </section>
    </div>
  );
}
