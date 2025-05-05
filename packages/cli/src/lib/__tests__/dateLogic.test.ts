import { describe, it, expect } from "vitest";
import { isFriday, weekNum, isEndOfMonthFriday, isEndOfQuarterFriday, isVacationFriday } from "../dateLogic";

describe("dateLogic", () => {
  describe("isFriday", () => {
    it("should return true for Fridays", () => {
      expect(isFriday(new Date("2024-08-02"))).toBe(true); // A known Friday
    });
    it("should return false for non-Fridays", () => {
      expect(isFriday(new Date("2024-08-01"))).toBe(false); // Thursday
    });
  });

  describe("weekNum", () => {
    it("should return the correct ISO week number", () => {
      expect(weekNum(new Date("2024-01-01"))).toBe(1); // Monday of week 1
      expect(weekNum(new Date("2024-12-31"))).toBe(1); // Tuesday of week 1 2025
      expect(weekNum(new Date("2023-12-31"))).toBe(52); // Sunday of week 52 2023
    });
  });

  describe("isEndOfMonthFriday", () => {
    it("should return true for the last Friday of a month", () => {
      expect(isEndOfMonthFriday(new Date("2024-08-30"))).toBe(true);
      expect(isEndOfMonthFriday(new Date("2025-01-31"))).toBe(true);
    });
    it("should return false for Fridays that are not the last of the month", () => {
      expect(isEndOfMonthFriday(new Date("2024-08-23"))).toBe(false);
    });
    it("should return true for the last Friday of a month (including Feb 28, 2025)", () => {
      // Feb 28, 2025 is the last Friday of Feb 2025.
      expect(isEndOfMonthFriday(new Date("2025-02-28"))).toBe(true);
    });
    it("should return false for non-Fridays", () => {
      expect(isEndOfMonthFriday(new Date("2024-08-29"))).toBe(false);
    });
  });

  describe("isEndOfQuarterFriday", () => {
    it("should return true for the last Friday of a quarter", () => {
      expect(isEndOfQuarterFriday(new Date("2024-03-29"))).toBe(true); // Q1 end Mar 31 (Sun)
      expect(isEndOfQuarterFriday(new Date("2024-06-28"))).toBe(true); // Q2 end Jun 30 (Sun)
      expect(isEndOfQuarterFriday(new Date("2024-09-27"))).toBe(true); // Q3 end Sep 30 (Mon)
      expect(isEndOfQuarterFriday(new Date("2024-12-27"))).toBe(true); // Q4 end Dec 31 (Tue)
      expect(isEndOfQuarterFriday(new Date("2025-03-28"))).toBe(true); // Issue specific test case - Q1 end Mar 31 (Mon)
    });
    it("should return false for Fridays that are not the last of the quarter", () => {
      expect(isEndOfQuarterFriday(new Date("2024-03-22"))).toBe(false);
      expect(isEndOfQuarterFriday(new Date("2025-02-28"))).toBe(false); // Issue specific test case
    });
    it("should return false for non-Fridays", () => {
      expect(isEndOfQuarterFriday(new Date("2024-03-28"))).toBe(false);
    });
  });

  describe("isVacationFriday", () => {
    const cutOff = 17; // December 17th

    it("should return true for the last Friday before the cutoff (Dec 13th, 2024)", () => {
      // Dec 17 2024 is a Tuesday. The Friday before is Dec 13th.
      expect(isVacationFriday(new Date("2024-12-13"), cutOff)).toBe(true);
    });
    it("should return true for the last Friday before the cutoff (Dec 15th, 2023)", () => {
      // Dec 17 2023 is a Sunday. The Friday before is Dec 15th.
      expect(isVacationFriday(new Date("2023-12-15"), cutOff)).toBe(true);
    });
    it("should return false for Fridays before the final week", () => {
      expect(isVacationFriday(new Date("2024-12-06"), cutOff)).toBe(false);
    });
    it("should return false for Fridays after the cutoff", () => {
      expect(isVacationFriday(new Date("2024-12-20"), cutOff)).toBe(false);
    });
    it("should return false for dates outside December", () => {
      expect(isVacationFriday(new Date("2024-11-15"), cutOff)).toBe(false);
    });
    it("should return false for non-Fridays", () => {
      expect(isVacationFriday(new Date("2024-12-12"), cutOff)).toBe(false);
    });
  });
});
