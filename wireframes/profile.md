# User profile wireframe

## Desktop layout
- Customer workspace shell with profile heading and Edit profile action.
- Identity card with avatar, full name, email, phone, and address; optional missing fields show “Not provided”.
- Registered vehicle summary with details links.
- Upcoming appointments panel with status and center.
- Booking history table with date, vehicle, service, and status; empty state for users without history.
- Edit mode presents labeled fields, inline validation, Save and Cancel actions.

## Mobile layout
- Identity card stacks avatar and contact details; edit action remains visible.
- Vehicles and appointments use compact cards; booking history becomes a vertical list.
- Edit fields fill width and preserve clear labels and error text.

## Interactions
- Save updates demo profile state through the mock API and displays a confirmation toast only on success.
- Cancel returns to read-only profile without changing saved data.
- Links open vehicle details or booking details; sensitive real information is never requested.
