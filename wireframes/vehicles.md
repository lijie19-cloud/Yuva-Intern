# Vehicle listing wireframe — `/vehicles` and `/dashboard/vehicles`

## Desktop layout
- Customer dashboard shell and page heading with vehicle count and available page actions.
- Toolbar provides search across registration, brand, and model; brand and status filters; registration-date sort; and page-size control.
- Responsive vehicle-card grid displays image/fallback, registration number, brand/model/year, fuel type, last service, next due date, and status.
- Each card links to `/vehicles/:id`; pagination shows current page and previous/next controls.

## Mobile layout
- Dashboard navigation collapses to mobile navigation.
- Search and filters wrap into a compact toolbar; filters remain labeled and keyboard accessible.
- Cards use one column with metadata wrapping into readable rows; pagination controls remain touch-sized.

## States and interactions
- Search, filters, sort, and page size compose; changing the query or filters resets the page.
- Loading, recoverable error, no registered vehicles, and no matching search results have distinct feedback and retry/clear actions where available.
- Missing vehicle images use a descriptive fallback. Invalid or unknown vehicle IDs have a clear details-page recovery route.
