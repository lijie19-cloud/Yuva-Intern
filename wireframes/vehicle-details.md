# Vehicle details wireframe — `/vehicles/:id`

## Desktop layout
- Customer dashboard shell, breadcrumb/back-to-vehicles link, and primary **Book service** action.
- Vehicle summary with image/fallback, registration, brand and model, manufacturing year, and status.
- Specification panel for engine, fuel type, mileage, and owner information.
- Next-service-due panel and service history list/table showing appointment date, service, center, and outcome.

## Mobile layout
- Vehicle summary and booking action appear first; specifications become stacked label/value rows.
- Service history becomes a vertical list; long registration numbers and names wrap without overflow.

## States and interactions
- Book Service opens `/book-service` with the vehicle preselected when possible.
- Missing imagery uses an accessible vehicle fallback; an unknown ID shows a not-found message and return link.
- Service history and upcoming appointment details use demo records and their current status.
