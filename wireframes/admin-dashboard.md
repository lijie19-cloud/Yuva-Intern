# Administrator overview wireframe — `/admin`

Service operations open as separate pages; see `admin-service-operations.md`.

## Desktop layout
- Shared header and dashboard shell. Sidebar has **Admin overview**, then a **SERVICE OPERATIONS** group linking to Appointments, Services, and Customers. The selected link uses the same active background style as Admin overview.
- Overview heading greets the administrator by local time and first name; current date appears alongside it.
- Summary cards show customers, registered vehicles, appointments, completed services, pending/awaiting confirmation, confirmed, cancelled, and revenue this month.
- Analytics period selector: Daily, Weekly, Monthly, 6 months, Yearly. Revenue overview and appointment activity charts use the selected period.
- Recent activity is a table of time/event, booking, customer, vehicle/service, center, and status; entries expire from the view six hours after creation/latest update.

## Mobile and tablet layout
- Sidebar becomes responsive dashboard navigation; service-operation destinations stay individually accessible.
- Greeting/date wrap; metric cards reflow from a two-column grid to one column on narrow screens.
- Analytics selector and charts stack; the recent-activity table uses a labeled horizontal-scroll region.

## Interactions and states
- Changing analytics period refreshes both chart series. Empty activity has a clear message.
- Service-operation links navigate to their own `/admin/:section` routes.
- Greeting and data are simulated. Role switching is demo-only and does not provide secure authentication or authorization.
