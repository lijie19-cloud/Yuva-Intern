import { initialBookings, initialVehicles, services } from "../data";

/** Simulates network latency for mock API requests. */
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/** Creates a seeded REST-shaped mock client with CRUD operations and simulated failures. */
export function createMockApi({ latency = 180, failureRate = 0 } = {}) {
  const tables = {
    services: structuredClone(services),
    vehicles: structuredClone(initialVehicles),
    bookings: structuredClone(initialBookings),
  };

  /** Applies mock latency and failures before an in-memory operation. */
  async function request(table, operation) {
    await delay(latency);
    if (Math.random() < failureRate) {
      throw new Error(
        "The service is temporarily unavailable. Please try again.",
      );
    }
    return operation(tables[table]);
  }

  return {
    /** Returns all records in the selected collection. */
    list: (table) => request(table, (rows) => structuredClone(rows)),

    /** Returns one record by its identifier. */
    get: (table, id) =>
      request(table, (rows) =>
        structuredClone(rows.find((row) => row.id === id) || null),
      ),

    /** Creates and stores a new record. */
    create: (table, record) =>
      request(table, (rows) => {
        const item = {
          ...record,
          id: record.id || `${table.slice(0, 2)}-${Date.now()}`,
        };
        rows.unshift(item);
        return structuredClone(item);
      }),

    /** Updates one record with the supplied fields. */
    update: (table, id, changes) =>
      request(table, (rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index < 0) throw new Error(`${table} record not found`);
        rows[index] = { ...rows[index], ...changes };
        return structuredClone(rows[index]);
      }),

    /** Deletes one record by its identifier. */
    remove: (table, id) =>
      request(table, (rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index < 0) throw new Error(`${table} record not found`);
        return rows.splice(index, 1)[0];
      }),
  };
}
