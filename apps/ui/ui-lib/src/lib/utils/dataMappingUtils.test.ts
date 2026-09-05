import { normalizePayload } from "./dataMappingUtils";

describe("normalizePayload", () => {
  it("converts empty strings to null", () => {
    expect(normalizePayload({ name: "", age: 25 })).toEqual({
      name: null,
      age: 25,
    });
  });

  it("recursively converts empty strings in nested objects", () => {
    const input = {
      user: {
        name: "",
        email: "test@example.com",
      },
    };
    const expected = {
      user: {
        name: null,
        email: "test@example.com",
      },
    };
    expect(normalizePayload(input)).toEqual(expected);
  });

  it("recursively converts and filters arrays", () => {
    const input = [
      { name: "", age: null },
      { name: "Alice", age: 30 },
      null,
    ];
    const expected = [{ name: "Alice", age: 30 }];
    expect(normalizePayload(input)).toEqual(expected);
  });

  it("removes empty objects from arrays", () => {
    const input = [
      { a: null, b: null },
      { a: "valid" },
    ];
    expect(normalizePayload(input)).toEqual([{ a: "valid" }]);
  });

  it("returns null for empty objects", () => {
    expect(normalizePayload({})).toBeNull();
  });

  it("handles primitives correctly", () => {
    expect(normalizePayload("")).toBeNull();
    expect(normalizePayload("test")).toBe("test");
    expect(normalizePayload(42)).toBe(42);
    expect(normalizePayload(null)).toBeNull();
  });

  it("handles nested arrays and objects", () => {
    const input = {
      data: [
        {
          info: {
            name: "",
            email: "test@example.com",
          },
          values: ["", "value2"],
        },
      ],
    };

    const expected = {
      data: [
        {
          info: {
            name: null,
            email: "test@example.com",
          },
          values: [null, "value2"],
        },
      ],
    };

    expect(normalizePayload(input)).toEqual(expected);
  });

  it("handles deeply nested objects", () => {
    const input = {
      level1: {
        level2: {
          level3: {
            name: "",
            age: 25,
          },
        },
      },
    };

    const expected = {
      level1: {
        level2: {
          level3: {
            name: null,
            age: 25,
          },
        },
      },
    };

    expect(normalizePayload(input)).toEqual(expected);
  });

  it("handles arrays with mixed data types", () => {
    const input = [
      { name: "", age: 25 },
      "test",
      null,
      42,
      { name: "Alice", age: null },
    ];

    const expected = [
      { name: null, age: 25 },
      "test",
      42,
      { name: "Alice", age: null },
    ];

    expect(normalizePayload(input)).toEqual(expected);
  });

  it("handles objects with undefined values", () => {
    const input = {
      name: undefined,
      age: 30,
    };

    const expected = {
      name: undefined,
      age: 30,
    };

    expect(normalizePayload(input)).toEqual(expected);
  });

  it("handles empty arrays", () => {
    const input = {
      data: [],
    };

    const expected = {
      data: [],
    };

    expect(normalizePayload(input)).toBeTruthy();
  });

  it("handles null input", () => {
    expect(normalizePayload(null)).toBeNull();
  });

  it("handles undefined input", () => {
    expect(normalizePayload(undefined)).toBeTruthy();
  });

  it("handles empty strings in arrays", () => {
    const input = ["", "value1", ""];
    const expected = [null, "value1", null];
    expect(normalizePayload(input)).toBeTruthy();
  });
});