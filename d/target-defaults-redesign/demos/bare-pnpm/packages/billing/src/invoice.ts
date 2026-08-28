export function invoiceTotal(lineItems: number[]): number {
  return lineItems.reduce((sum, amount) => sum + amount, 0);
}
