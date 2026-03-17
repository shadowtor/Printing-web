import { describe, expect, it } from "vitest";
import { maxLeadTimeDays } from "../../src/services/quote-service.js";

describe("quote-service", () => {
  describe("maxLeadTimeDays", () => {
    it("returns 0 for empty jobs", () => {
      expect(maxLeadTimeDays([])).toBe(0);
    });

    it("returns 0 when all leadTimeDays are null/undefined", () => {
      expect(
        maxLeadTimeDays([
          { id: "1", leadTimeDays: null } as never,
          { id: "2", leadTimeDays: undefined } as never
        ])
      ).toBe(0);
    });

    it("returns the single value when one job has leadTimeDays", () => {
      expect(maxLeadTimeDays([{ id: "1", leadTimeDays: 5 } as never])).toBe(5);
    });

    it("returns the max of multiple jobs", () => {
      expect(
        maxLeadTimeDays([
          { id: "1", leadTimeDays: 3 } as never,
          { id: "2", leadTimeDays: 7 } as never,
          { id: "3", leadTimeDays: 5 } as never
        ])
      ).toBe(7);
    });
  });
});
