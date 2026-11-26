# Vehicle details wireframe

## Desktop layout
- Customer workspace shell, breadcrumb back to vehicles, and primary Book Service action.
- Summary panel: vehicle image or fallback, make/model, year, registration, and current status.
- Two-column specifications: engine, fuel, mileage, ownership details, and registration date.
- Upcoming service panel with due date and appointment CTA.
- Service history timeline/table with date, service type, center, and outcome.

## Mobile layout
- Summary and booking action appear first; specifications become stacked labeled rows.
- History becomes a vertical timeline; long registration/customer strings wrap safely.

## States and interactions
- Unknown ID shows a not-found state with a return link.
- Missing image uses a neutral vehicle illustration/initial fallback and useful alt text.
- Book Service preselects this vehicle in `/book-service`; history entries can open the related booking details.
