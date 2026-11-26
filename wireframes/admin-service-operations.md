# Administrator service operations wireframes

All sections use the shared admin shell and the `/admin` sidebar. Each operation opens as its own route, with a page heading, service-operations context, and current date. On mobile the sidebar collapses, controls wrap, and data tables remain accessible in labeled scroll regions.

## Appointments — `/admin/appointments`
- Heading and description explain the appointment management task; **Export Excel (.csv)** downloads the currently filtered appointments as an Excel-compatible file.
- Search covers customer, vehicle/registration, service, and booking ID.
- Filters combine booking status, service, appointment date, and sort (newest, oldest, customer A–Z); Clear filters resets all controls.
- Results count, configurable page size, responsive appointment table, and pagination.
- Table shows booking/customer, vehicle/service, date/time and center, estimate, status, status-update control, and View action.
- View opens an accessible booking-details dialog; status updates change demo records and show notification feedback.

## Services — `/admin/services`
- Service catalogue rows show name, category, duration, and editable price with a Save price action.
- **Add service** opens a dialog with name, category, duration, price, and description; new entries become available to the service catalogue and booking flow.
- Empty catalogue and save feedback are communicated explicitly.

## Customers — `/admin/customers`
- Searchable customer account list shows identity, vehicle and booking counts, active state, and Deactivate/Activate and Delete actions.
- Delete opens a confirmation dialog. Confirming removes the demo customer account and its associated vehicles/bookings; cancelling preserves it.
- No-match and no-account states use explicit empty messages.

## Advisors — `/admin/advisors`
- Searchable advisor list shows name, username, assigned appointment count, center assignment, active state, and account actions.
- Center selector changes the advisor’s assigned service center.
- **Create advisor** opens a dialog for full name, username, temporary numeric PIN, and required service center. New accounts are demo-only.
- Deactivation/reactivation changes demo account availability. Delete requires confirmation and clears advisor assignment from existing appointment records while retaining the bookings.

## Responsive and accessibility behavior
- Controls wrap in logical order; appointment table can scroll horizontally without page-level overflow.
- Dialogs have accessible labels, keyboard dismissal, visible focus, and confirmation copy for destructive actions.
- All account changes, exports, and status changes operate on browser demo data; no real authentication or server persistence is implied.
