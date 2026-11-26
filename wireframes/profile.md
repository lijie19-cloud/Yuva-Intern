# Customer profile wireframe — `/profile`

## Desktop layout
- Customer dashboard shell with **Overview**, **My vehicles**, **My bookings**, **Service history**, and **My profile** navigation.
- Profile heading and identity card with avatar/photo, name, email, and edit action. A missing avatar uses the initials/icon fallback.
- Editable contact fields use labeled inputs and Save/Cancel controls. Photo upload accepts common image formats up to 3 MB.
- Communication preferences include service reminders, booking updates, and offers, with a separate save action.
- Registered vehicles, upcoming bookings, and past booking/service history are grouped into readable cards or lists with links back to the relevant vehicle or booking views.

## Mobile layout
- Dashboard navigation collapses; profile identity and edit action stack cleanly.
- Vehicle and booking summaries use single-column cards; forms and preference toggles fill the available width.
- Long names and email addresses wrap; keyboard focus and success/error feedback stay visible.

## Interactions and states
- Profile edits update the local demo account and associated vehicle/booking ownership labels; a confirmation toast follows a successful update.
- Photo validation and account conflicts show an accessible error; photo and preferences are stored locally in the browser demo.
- Notification preferences default safely when browser storage is unavailable or empty.
- This is simulated profile data; do not enter sensitive real information.
