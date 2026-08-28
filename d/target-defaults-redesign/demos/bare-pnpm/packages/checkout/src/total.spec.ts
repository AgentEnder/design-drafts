import { describe, expect, it } from "vitest";
import { total } from "./total";

describe("total", () => {
  it("sums prices", () => {
    expect(total([1, 2, 3])).toBe(6);
  });
});
