# Vehicle listing wireframe

## Desktop layout
- Customer workspace shell with sidebar navigation and page breadcrumb/title.
- Toolbar: search registration/brand/model, brand and status filters, sort by registration date, and Add Vehicle action.
- Results count and responsive vehicle card grid (or compact table when explicitly selected).
- Each card: vehicle image/fallback, registration, brand/model/year, fuel, last service, next due date, status badge, and View details action.
- Pagination with page size, previous/next, and current-page indication.

## Mobile layout
- Sidebar becomes a drawer or compact horizontal navigation.
- Search fills width; filters open in a labeled expandable panel.
- One card per row; metadata wraps in two-column definition lists; pagination controls remain touch sized.

## States and interactions
- Loading skeletons, recoverable error with retry, empty account state with Add Vehicle, and no-match state with Clear filters.
- Search, brand/status filters, sorting, and pagination compose; changing filters resets to page one.
- View details opens `/vehicles/:id`; registration numbers remain readable and are not treated as valid by appearance alone.
