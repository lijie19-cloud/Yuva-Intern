# AUTO DEALER

### Vehicle Service Booking & Maintenance Management Platform

Auto Dealer is a responsive React application for a fictional two-wheeler dealership group in Delhi. It brings vehicle records, service booking, maintenance history, customer updates, advisor workflows, and dealership operations into one polished demo experience.

> **Demo notice:** Sign-in, roles, notifications, and records are stored in the browser. Authentication and role checks are for demonstration only and are not production security.

## Live app

 https://autodealer-ten.vercel.app

## Product features

### Public pages

- Automotive home page with featured services, service centers, customer stories, and service reminders.
- Service catalogue with search, category filters, sorting, pagination, service images, prices, and estimated durations.
- Service detail pages with inclusions, benefits, reviews, related services, and booking actions.
- Five-step booking flow for vehicle, services, center, appointment, and confirmation.
- Persistent light and dark themes, responsive navigation, and social follow links.

### Customer workspace

- Dashboard with vehicle, booking, and maintenance summaries.
- Vehicle create, edit, delete, and service-history views.
- Booking search, status filters, sorting, details, and cancellation for eligible appointments.
- Maintenance history timeline and profile, password, and notification preference screens.
- Booking status notifications scoped to the signed-in customer's own records. Opening notifications marks the displayed statuses as seen.

### Service advisor workspace

- Dedicated appointment queue with search and status updates.
- Advisor-only navigation and route handling in the demo UI.

### Administrator workspace

- Overview metrics based on the active demo booking and vehicle data.
- Revenue and appointment charts recalculated from the current booking data, including status and date changes.
- Create catalogue services and update any service price; the shared catalogue updates in the public service pages and booking flow.
- Searchable appointments with status updates, plus customer and advisor demo-account activity controls.
- Admin-only navigation and route handling in the demo UI.

## Responsive design and accessibility

The interface includes layouts for phones, compact tablets, tablets, and desktop screens. Mobile layouts use a collapsible header, horizontal dashboard navigation, stacked content panels, two-column compact statistics, a single-column chart layout, and horizontally scrollable data tables. The booking step indicator adapts to narrow screens, and footer content can wrap on small displays.

Pages use semantic landmarks, a keyboard-accessible skip link and navigation menu, labeled forms, visible high-contrast focus indicators, status announcements, and text alternatives for meaningful images. Dialogs support Escape dismissal, focus containment, and focus return. Text and control borders use theme-aware contrast tokens, and mobile inputs retain a readable size without forced browser zoom. Responsive styles are maintained in `src/index.css` and `src/app.css`; theme tokens and dark-mode overrides are in `src/theme.css`.

## Technology

- React 18 with JavaScript
- Vite
- React Router DOM
- Context API and browser `localStorage`
- Native SVG charts
- Lucide React icons
- CSS3
- Vitest, jsdom, and React Testing Library

React Hook Form, Zod, and their resolver are present in the dependency list, but the current forms use the app's local form handling. The screens currently use browser state rather than a connected JSON Server or MSW backend.

## Requirements

- Node.js 18 or newer
- npm

## Local development

```bash
npm ci
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Demo accounts and data

There are no fixed email/password credentials. Select **Get started** to register a demo account, choose its role, then sign in with that email and password. Passwords must be at least eight characters. The browser demo permits one administrator account to be registered.

Demo accounts, current session, vehicles, bookings, profile preferences, theme, and notification read state are persisted in browser storage. Use a fresh browser profile or clear this application's local storage to reset the demo. Password verification uses the Web Crypto API and requires `localhost` or HTTPS.

### Security limitation

Role checks only control client-side routing and presentation. A user can inspect or change browser storage and application code. Do not use the demo to store real customer data. A production system needs server-side identity, authorization on every data operation, secure password/session handling, and persistent protected storage.

## Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/services` | Service catalogue | Public |
| `/services/:id` | Service details | Public |
| `/book-service` | Booking wizard | Customer |
| `/dashboard` | Customer overview | Customer |
| `/dashboard/vehicles` | My vehicles | Customer |
| `/dashboard/bookings` | My bookings | Customer |
| `/dashboard/history` | Service history | Customer |
| `/dashboard/profile` | My profile | Customer |
| `/advisor` | Advisor appointment queue | Service Advisor |
| `/admin` | Dealership overview and operations | Administrator |
| `/login` | Sign in | Public |
| `/register` | Demo registration | Public |

When a signed-in demo user opens another role's protected route, the app redirects them to their own workspace. The public catalogue remains available to visitors.

## Project structure

```text
src/
  assets/              Brand and service images
  services/
    api.js             In-memory REST-shaped mock API
    api.test.js        Mock API tests
    demoAuth.js        Browser-local demo registration and sign-in
  App.jsx              Lazy routes and role guards
  admin.jsx            Admin metrics, charts, and operations
  advisor.jsx          Advisor appointment queue
  auth.jsx             Registration and sign-in screens
  data.js              Seeded services, centers, vehicles, and bookings
  home.jsx             Public home page
  layout2.jsx          Navigation, dashboard shell, footer, notifications
  pages.jsx            Services, booking, and customer screens
  profile.jsx          Customer profile and preferences
  state.jsx            Context state, persistence, account filters
  ui.jsx               Reusable interface components
  index.css            Base styles and public page styles
  app.css              Dashboard, component, and responsive styles
  theme.css            Theme tokens and dark-mode overrides
  main.jsx             Application entry point
```

## Mock API

`src/services/api.js` exports `createMockApi({ latency, failureRate })`, an asynchronous in-memory client seeded with services, vehicles, and bookings. It supports `list`, `get`, `create`, `update`, and `remove` operations. Set `failureRate` between `0` and `1` to simulate request errors.

```js
import { createMockApi } from "./src/services/api.js";

const api = createMockApi({ latency: 180, failureRate: 0.05 });
const bookings = await api.list("bookings");
```

The current UI uses Context and local storage so it can run without an API server. The mock client is not a network service, and updates are not shared between users or devices.

## Scripts

```bash
npm run dev          # Start the development server
npm run build        # Create the production bundle in dist/
npm run preview      # Preview the production bundle
npm run audit:preview # Build and serve on port 4173 for Lighthouse
npm test             # Run Vitest and React Testing Library tests
```

For a production-focused Lighthouse audit, run `npm run audit:preview` and audit `http://localhost:4173`. Vite's development server includes unminified modules and development tooling, so its score does not represent the production build.

## Tests

Run the complete suite with:

```bash
npm test
```

The current tests cover key pages and flows as well as mock API behavior. Lighthouse results are environment-dependent and are not claimed by this README.

## Deployment

The app builds to a static Vite bundle and can be deployed to Vercel or Netlify:

1. Import the repository into the hosting provider.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Configure SPA fallback routing so direct links such as `/dashboard/bookings` serve `index.html`.

For Netlify, add `public/_redirects` containing:

```text
/* /index.html 200
```

For Vercel, configure the project as a Vite SPA or rewrite application routes to `/index.html`. The demo needs no environment variables. A production backend or identity provider will require provider-specific configuration and server-side security rules.

## Known limitations

- Authentication, authorization, notification state, and records are browser-local demo behavior with no cross-device sync.
- The in-memory mock API is not connected to the screens as a remote backend.
- Seed data, prices, availability, analytics, reviews, and dealership contact details are illustrative.
- Service creation and price edits persist in this browser only; editing all service fields and deleting catalogue services are not included.
- Email, SMS, push, payment, and live service-center scheduling integrations are not configured.
- No confirmed live deployment URL, screenshots, or Lighthouse report is included.

## License

No license file is included. Add a license before redistributing this project publicly.
