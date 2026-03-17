import { describe, expect, it } from "vitest";
import { generateOrderNumber } from "../../src/models/order.js";

describe("order model", () => {
  describe("generateOrderNumber", () => {
    it("returns string matching ORD-YYYYMMDD-XXXX format", () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^ORD-\d{8}-[A-Z0-9]{4}$/);
    });

    it("returns different values on successive calls", () => {
      const a = generateOrderNumber();
      const b = generateOrderNumber();
      // Very unlikely to collide; format already validated above
      expect(a).not.toBe(b);
    });
  });
});
