import { validateString } from "../src/validators/StringValidators";

describe("validate error types of parameters", () => {
  // Value must be a string
  test("should return error if value is not a string", () => {
    const invalidValues = [undefined, null, true, 123, [], {}];
    invalidValues.forEach((value) => {
      expect(validateString(value as any)).toEqual({ is_valid: false, error_message: "Value must be a string" });
      expect(
        validateString(value as any, {
          error_messages: {
            type_error: "This is a type error"
          }
        })
      ).toEqual({ is_valid: false, error_message: "This is a type error" });
    });
  });

  // Options must be a plain object
  test("should throw error if options is not a plain object", () => {
    expect(() => {
      validateString("123", "test" as any);
    }).toThrow("Options must be a plain object");
  });

  //list must be a plain object
  test("should throw error if list is not a plain object", () => {
    expect(() => {
      validateString("123", { whitelist: "test" as any });
    }).toThrow("list must be a plain object");
    expect(() => {
      validateString("123", { blacklist: "test" as any });
    }).toThrow("list must be a plain object");
  });

  // Combination must be either 'AND' or 'OR'
  test("should throw error if combination is not 'AND' or 'OR'", () => {
    expect(() => {
      validateString("123", { whitelist: { combination: "test" as any, values: ["123"] } });
    }).toThrow('Combination must be either "AND" or "OR"');
    expect(() => {
      validateString("123", { blacklist: { combination: "test" as any, values: ["123"] } });
    }).toThrow('Combination must be either "AND" or "OR"');
  });
});

describe("validate empty parameters", () => {
  // Test empty value
  test("should return true if value is empty and required is false or not provided", () => {
    expect(validateString("")).toEqual({ is_valid: true });
    expect(validateString("", { whitelist: { values: ["123"] } })).toEqual({ is_valid: true });
    expect(validateString("", { blacklist: { values: ["123"] } })).toEqual({ is_valid: true });
  });
  test("should return true if value is empty and required is true", () => {
    expect(validateString("", { required: true })).toEqual({
      is_valid: false,
      error_message: "Value must not be empty"
    });
    expect(
      validateString("", { required: true, error_messages: { required_error: "This is a required error" } })
    ).toEqual({ is_valid: false, error_message: "This is a required error" });
  });

  // Test empty options
  test("should return true if options are empty", () => {
    expect(validateString("123", {})).toEqual({ is_valid: true });
  });

  // Test empty list
  test("should return true if list is empty", () => {
    expect(validateString("123", { whitelist: {} })).toEqual({ is_valid: true });
    expect(validateString("123", { blacklist: {} })).toEqual({ is_valid: true });
  });
  // Test empty list properties
  test("should return true if list properties are empty", () => {
    expect(
      validateString("123", {
        whitelist: {
          values: [],
          starts_with: [],
          ends_with: [],
          contains: []
        }
      })
    ).toEqual({ is_valid: true });
  });
});

describe("validate string with whitelist", () => {
  test("should return true if value is in whitelist", () => {
    expect(validateString("123", { whitelist: { values: ["123"] } })).toEqual({ is_valid: true });
    expect(validateString("123", { whitelist: { values: ["123"], combination: "AND" } })).toEqual({ is_valid: true });
    expect(validateString("123", { whitelist: { values: ["123"], combination: "OR" } })).toEqual({ is_valid: true });
    expect(validateString("123", { whitelist: { starts_with: ["123"] } })).toEqual({ is_valid: true });
    expect(validateString("123", { whitelist: { ends_with: ["123"] } })).toEqual({ is_valid: true });
    expect(validateString("123", { whitelist: { contains: ["123"] } })).toEqual({ is_valid: true });
  });
});
