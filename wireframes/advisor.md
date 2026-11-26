# Service advisor wireframe — `/advisor`

## Desktop layout
- Shared header and compact advisor workspace shell. The only role-specific navigation item is **Service queue**.
- Page heading greets the advisor by local time and first name, and names the assigned service center.
- Appointments panel shows the matching queue count and a search field for booking, vehicle, service, or center.
- Table columns: booking, vehicle/service, date/time and center, current status, and a status selector.
- Empty state explains when no appointments match or when the advisor has no service center assignment.

## Mobile layout
- Navigation and heading stack; queue count and search remain visible.
- Appointment table is contained in a labeled horizontal-scroll region; status selector remains operable with touch and keyboard.
- Long vehicle/service details wrap; no page-level horizontal overflow.

## Interactions and first sign-in
- Queue results are limited to the advisor’s assigned service center and, where assigned, their own appointment records. Advisors cannot navigate to admin/customer management screens.
- Updating status changes only the demo booking record and displays a confirmation notification.
- A first-sign-in dialog requires the temporary PIN to be replaced with a personal 4–8 digit PIN and confirmation. The dialog must be completed before proceeding; errors are announced accessibly.
- Advisor accounts are created and assigned to centers by an administrator. Username/PIN login and role selection are browser-demo behavior, not secure production authentication.
