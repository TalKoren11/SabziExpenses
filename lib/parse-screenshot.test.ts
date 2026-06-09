import { describe, it, expect } from "vitest";
import { normalizeParsedExpenses } from "./parse-screenshot";

describe("normalizeParsedExpenses", () => {
  it("accepts a clean array", () => {
    expect(
      normalizeParsedExpenses([
        { merchant: "Cafe Aroma", amount: 18.5, date: "2026-06-01" },
      ])
    ).toEqual([{ merchant: "Cafe Aroma", amount: 18.5, date: "2026-06-01" }]);
  });

  it("unwraps an object with an expenses/transactions key", () => {
    expect(
      normalizeParsedExpenses({ expenses: [{ merchant: "Rami Levy", amount: 220 }] })
    ).toEqual([{ merchant: "Rami Levy", amount: 220, date: null }]);
    expect(
      normalizeParsedExpenses({ transactions: [{ merchant: "Paz", amount: 300 }] })
    ).toEqual([{ merchant: "Paz", amount: 300, date: null }]);
  });

  it("parses amounts given as strings with currency symbols and commas", () => {
    const result = normalizeParsedExpenses([
      { merchant: "Electric Co", amount: "₪1,234.50" },
      { merchant: "Store", amount: "42" },
    ]);
    expect(result[0].amount).toBe(1234.5);
    expect(result[1].amount).toBe(42);
  });

  it("drops entries without a valid positive amount", () => {
    const result = normalizeParsedExpenses([
      { merchant: "Bad", amount: "n/a" },
      { merchant: "Zero", amount: 0 },
      { merchant: "Negative", amount: -5 },
      { merchant: "Good", amount: 10 },
    ]);
    expect(result).toEqual([{ merchant: "Good", amount: 10, date: null }]);
  });

  it("normalises various date formats to ISO, else null", () => {
    expect(normalizeParsedExpenses([{ merchant: "A", amount: 1, date: "Jun 1, 2026" }])[0].date).toBe(
      "2026-06-01"
    );
    expect(normalizeParsedExpenses([{ merchant: "A", amount: 1, date: "garbage" }])[0].date).toBe(
      null
    );
  });

  it("falls back to 'Unknown' for a missing merchant and trims whitespace", () => {
    expect(normalizeParsedExpenses([{ amount: 5 }])[0].merchant).toBe("Unknown");
    expect(normalizeParsedExpenses([{ merchant: "  Shop  ", amount: 5 }])[0].merchant).toBe("Shop");
  });

  it("returns an empty array for non-array, non-wrapped input", () => {
    expect(normalizeParsedExpenses(null)).toEqual([]);
    expect(normalizeParsedExpenses("nope")).toEqual([]);
    expect(normalizeParsedExpenses({ foo: "bar" })).toEqual([]);
  });
});
