# Service booking wireframe

## Desktop layout
- Customer workspace shell with “Demo booking” notice and four-step progress indicator: Vehicle, Service, Appointment, Review.
- Main form area with one step at a time; contextual selection summary in a side panel.
- Vehicle step: selectable registered-vehicle cards and a clear selected state.
- Service step: selectable service cards (general service, oil, brakes, diagnostics, tires, battery, other).
- Appointment step: service center, date, available time slot, and optional notes.
- Review step: complete summary, edit links to earlier steps, terms/demo notice, and Confirm demo booking action.
- Success view confirms the mock operation and links to booking details and dashboard.

## Mobile layout
- Progress is compact with current step name and step count; cards and form controls stack vertically.
- Sticky bottom Previous/Next action bar respects safe-area padding and never obscures validation feedback.

## Interactions and validation
- React Hook Form + Zod validate step fields; errors are associated with inputs and announced accessibly.
- Previous preserves entries; Next is disabled or blocked until the current step is valid.
- Confirmation occurs only after the mock API resolves successfully; failed/offline requests show retryable error and never claim success.
- Booking and confirmation clearly state that records are demonstration data.
