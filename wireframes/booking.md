# Service booking wireframe — `/book-service`

## Desktop layout
- Customer dashboard shell, visible demo-data notice, and four-step progress: Vehicle, Service, Appointment, Review.
- Main step form with a contextual booking summary.
- Vehicle step selects one of the customer’s registered vehicles and shows its key details.
- Service step offers the current service catalogue (including general servicing, oil, brakes, diagnostics, tires, battery, and other available services).
- Appointment step selects a service center, date, available time, and optional notes.
- Review step summarizes vehicle, service, estimate, center, date/time, and notes before **Confirm demo booking**.
- Successful confirmation leads to `/booking-success` with a route back to the customer dashboard/bookings.

## Mobile layout
- Progress indicator shows current step and total; selection cards and form controls stack vertically.
- Previous/Next actions remain reachable and do not cover form errors or the summary.
- Review details wrap into labeled rows and confirmation actions fill the available width.

## Interactions and validation
- Back preserves earlier choices; Next validates required current-step values and presents field-associated error messages.
- Service center/date/time availability and booking records are simulated locally through the frontend mock data layer.
- Confirmation is labeled demo data and occurs only when the mock operation succeeds; error feedback allows retry without claiming success.
