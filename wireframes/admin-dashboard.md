# Admin and service advisor dashboard wireframe

## Desktop layout
- Persistent left sidebar with role-specific links, demo role selector clearly marked “Demo only”, and account menu.
- Header with page title, date range, and appointment search.
- Six summary cards: vehicles, bookings, pending, confirmed, completed, cancelled.
- Main area: appointment management table with customer, registration, service, appointment date/time, center, status, and row actions.
- Filter row: status, date range, service type, sort, and page size; table has pagination.
- Side/below panels: service statistics chart with text summary and recent activity feed.
- Booking details dialog supports keyboard focus, Escape close, and status update confirmation.

## Mobile layout
- Sidebar becomes a labeled navigation drawer; role selector stays explicit about demo-only behavior.
- Stats use a two-column grid; filters collapse into a panel.
- Booking rows become appointment cards with status and primary action; charts resize to container and have a text alternative.

## Interactions and states
- Search covers customer name and registration; filters and sorting combine and reset pagination.
- Status changes update mock records and activity feed, with success/error notification.
- Loading, retryable error, no bookings, and no matching results each have distinct feedback.
- Role switching changes the simulated interface only; it is not authentication or authorization.
