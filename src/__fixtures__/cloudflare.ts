export const availabilityFixture = { success: true, result: { available: true, price: "12.34", currency: "USD" } };
export const unavailableFixture = { success: true, result: { available: false } };
export const purchaseFixture = { success: true, result: { id: "order-fixture-1", price: "12.34", currency: "USD" } };
export const errorFixture = { success: false, errors: [{ message: "Registrar error" }] };
