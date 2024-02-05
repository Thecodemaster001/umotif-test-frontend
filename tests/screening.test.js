import { describe, expect, it } from "vitest";
import {
  isAdult,
  latestEligibleBirthDate,
  localIsoDate,
  toSubjectAttributes,
  validateScreening,
} from "@/screening";

const today = new Date(2026, 10, 10); // 10 Nov 2026, local time

const valid = {
  first_name: "  Ada ",
  date_of_birth: "1990-05-01",
  frequency: 2,
  daily_frequency: null,
};

describe("age cut-off", () => {
  it("uses the local calendar date, not UTC", () => {
    expect(localIsoDate(new Date(2026, 0, 1, 0, 30))).toBe("2026-01-01");
  });

  it("accepts someone who turns 18 today and rejects a day later", () => {
    expect(latestEligibleBirthDate(today)).toBe("2008-11-10");
    expect(isAdult("2008-11-10", today)).toBe(true);
    expect(isAdult("2008-11-11", today)).toBe(false);
  });

  it("handles a 29 February today", () => {
    const leapDay = new Date(2028, 1, 29);
    expect(isAdult("2010-02-28", leapDay)).toBe(true);
    expect(isAdult("2010-03-01", leapDay)).toBe(false);
  });

  it("rejects malformed dates", () => {
    expect(isAdult("", today)).toBe(false);
    expect(isAdult("01/05/1990", today)).toBe(false);
  });
});

describe("validateScreening", () => {
  it("returns no errors for a complete adult answer", () => {
    expect(validateScreening(valid, today)).toEqual({});
  });

  it("flags every missing field on an empty form", () => {
    const errors = validateScreening(
      {
        first_name: " ",
        date_of_birth: "",
        frequency: null,
        daily_frequency: null,
      },
      today,
    );
    expect(Object.keys(errors).sort()).toEqual([
      "date_of_birth",
      "first_name",
      "frequency",
    ]);
  });

  it("rejects under-18s and future dates with different messages", () => {
    expect(
      validateScreening({ ...valid, date_of_birth: "2012-01-01" }, today)
        .date_of_birth,
    ).toMatch(/18 or older/);
    expect(
      validateScreening({ ...valid, date_of_birth: "2027-01-01" }, today)
        .date_of_birth,
    ).toMatch(/future/);
  });

  it("rejects an over-long name and an unknown frequency", () => {
    const errors = validateScreening(
      { ...valid, first_name: "x".repeat(101), frequency: 9 },
      today,
    );
    expect(errors.first_name).toMatch(/100 characters/);
    expect(errors.frequency).toBeDefined();
  });

  it("requires the daily count only for daily migraines", () => {
    expect(
      validateScreening({ ...valid, frequency: 3 }, today).daily_frequency,
    ).toBeDefined();
    expect(
      validateScreening({ ...valid, frequency: 3, daily_frequency: 2 }, today),
    ).toEqual({});
  });
});

describe("toSubjectAttributes", () => {
  it("trims the name and omits daily_frequency unless daily", () => {
    expect(toSubjectAttributes({ ...valid, daily_frequency: 2 })).toEqual({
      first_name: "Ada",
      date_of_birth: "1990-05-01",
      frequency: 2,
    });
  });

  it("sends daily_frequency as a number for daily migraines", () => {
    expect(
      toSubjectAttributes({ ...valid, frequency: "3", daily_frequency: "1" }),
    ).toMatchObject({ frequency: 3, daily_frequency: 1 });
  });
});
