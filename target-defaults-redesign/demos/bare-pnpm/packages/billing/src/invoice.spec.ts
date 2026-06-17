import { invoiceTotal } from "./invoice";

describe("invoiceTotal", () => {
  it("sums line items", () => {
    expect(invoiceTotal([10, 20])).toBe(30);
  });
});
