/** Returns a time-based greeting using the visitor's local clock. */
export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Returns a short display name for dashboard greetings. */
export function firstName(name) {
  return name?.trim().split(/\s+/)[0] || "there";
}
