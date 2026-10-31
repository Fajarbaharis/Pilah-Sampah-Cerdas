import { describe, it, expect } from "vitest";
import {
  normalizePercentage,
  formatPercentString,
  calculateNormalizedDelta,
  determineProvenance,
} from "./surveyNormalizer";

describe("surveyNormalizer", () => {
  describe("normalizePercentage", () => {
    it("converts legacy 0..1 decimal values to percentage 0..100", () => {
      expect(normalizePercentage(0.248)).toBe(24.8);
      expect(normalizePercentage(0.15)).toBe(15);
      expect(normalizePercentage(0.5)).toBe(50);
      expect(normalizePercentage(1.0)).toBe(100);
      expect(normalizePercentage("0.248")).toBe(24.8);
    });

    it("preserves standard percentage values (above 1.0)", () => {
      expect(normalizePercentage(42.5)).toBe(42.5);
      expect(normalizePercentage(66.67)).toBe(66.67);
      expect(normalizePercentage(100)).toBe(100);
      expect(normalizePercentage("55.4")).toBe(55.4);
    });

    it("handles zero, null, undefined, empty, and invalid inputs gracefully", () => {
      expect(normalizePercentage(0)).toBe(0);
      expect(normalizePercentage(null)).toBe(0);
      expect(normalizePercentage(undefined)).toBe(0);
      expect(normalizePercentage("")).toBe(0);
      expect(normalizePercentage("invalid")).toBe(0);
    });
  });

  describe("formatPercentString", () => {
    it("formats percentage correctly with specified decimals", () => {
      expect(formatPercentString(0.248)).toBe("24.8%");
      expect(formatPercentString(42.5, 1)).toBe("42.5%");
      expect(formatPercentString(42.567, 2)).toBe("42.57%");
    });

    it("returns placeholder when value is null or empty", () => {
      expect(formatPercentString(null)).toBe("—");
      expect(formatPercentString(undefined)).toBe("—");
      expect(formatPercentString("", 1, "0%")).toBe("0%");
    });
  });

  describe("calculateNormalizedDelta", () => {
    it("accurately computes delta between legacy baseline and new endline", () => {
      // Baseline 0.248 (24.8%) vs Endline 66.67% -> delta +41.87%
      expect(calculateNormalizedDelta(0.248, 66.67)).toBe(41.87);
      // Baseline 50% vs Endline 30% -> delta -20%
      expect(calculateNormalizedDelta(50, 30)).toBe(-20);
    });

    it("returns null if either baseline or endline is missing", () => {
      expect(calculateNormalizedDelta(null, 66.67)).toBeNull();
      expect(calculateNormalizedDelta(24.8, null)).toBeNull();
    });
  });

  describe("determineProvenance", () => {
    it("identifies RW survey aggregation", () => {
      const prov1 = determineProvenance("Agregasi otomatis dari 4 RW via survey.berseka.id", 4);
      expect(prov1.type).toBe("AGREGASI_RW");
      expect(prov1.label).toContain("Terverifikasi Lapangan RW");

      const prov2 = determineProvenance(null, 2);
      expect(prov2.type).toBe("AGREGASI_RW");
    });

    it("identifies initial data estimation", () => {
      const prov = determineProvenance("Estimasi data awal kelurahan", 0);
      expect(prov.type).toBe("DATA_AWAL");
      expect(prov.label).toContain("Estimasi Data Awal");
    });
  });
});
