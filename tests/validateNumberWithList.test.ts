import { validateNumberByList } from "../src/utils/validateByList";

describe("validate error types of parameters", () => {
  // Value must be a number
  test("should throw error if value is not a number", () => {
    const invalidValues = [undefined, null, true, "123", [], {}];
    invalidValues.forEach((value) => {
      expect(() => {
        validateNumberByList(value as any);
      }).toThrow("Value must be a number");
    });
  });

  // Options must be a plain object
  test("should throw error if options is not a plain object", () => {
    expect(() => {
      validateNumberByList(123, "test" as any);
    }).toThrow("Options must be a plain object");
  });

  //list must be a plain object
  test("should throw error if list is not a plain object", () => {
    expect(() => {
      validateNumberByList(123, { list: "test" as any });
    }).toThrow("list must be a plain object");
  });

  // listType must be either 'whitelist' or 'blacklist'
  test("should throw error if listType is not 'whitelist' or 'blacklist'", () => {
    expect(() => {
      validateNumberByList(123, { list_type: "test" as any, list: { values: [123] } });
    }).toThrow("list_type must be either 'whitelist' or 'blacklist'");
  });

  // Combination must be either 'AND' or 'OR'
  test("should throw error if combination is not 'AND' or 'OR'", () => {
    expect(() => {
      validateNumberByList(123, { list_type: "whitelist", list: { combination: "test" as any, values: [123] } });
    }).toThrow('Combination must be either "AND" or "OR"');
  });
});

describe("validate empty parameters", () => {
  // Test empty options
  test("should return true if options are empty", () => {
    expect(validateNumberByList(123, {})).toEqual({ is_valid: true });
  });

  // Test empty list
  test("should return true if list is empty", () => {
    expect(validateNumberByList(123, { list: {} })).toEqual({ is_valid: true });
    expect(validateNumberByList(123, { list: null as any })).toEqual({ is_valid: true });
  });
  // Test empty list properties
  test("should return true if list properties are empty", () => {
    expect(
      validateNumberByList(123, {
        list: {
          values: [],
          starts_with: [],
          ends_with: [],
          contains: []
        }
      })
    ).toEqual({ is_valid: true });
  });
});

describe("validate String With Whitelist", () => {
  // AND - all condition is met
  test("AND - all condition is met", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [123454321],
          starts_with: [123],
          ends_with: [321],
          contains: [454]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values", "starts_with", "ends_with", "contains"] });
  });

  // AND - one of the condition is not met
  test("AND - one of the condition is not met", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [1234543212],
          starts_with: [123],
          ends_with: [321],
          contains: [454]
        }
      })
    ).toEqual({
      is_valid: false,
      actual_sequence: ["values"],
      error_message: "Value should be 1234543212"
    });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [123454321],
          starts_with: [1235],
          ends_with: [321],
          contains: [454]
        }
      })
    ).toEqual({
      is_valid: false,
      actual_sequence: ["values", "starts_with"],
      error_message: "Value should start with 1235"
    });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [123454321],
          starts_with: [123],
          ends_with: [322],
          contains: [454]
        }
      })
    ).toEqual({
      is_valid: false,
      actual_sequence: ["values", "starts_with", "ends_with"],
      error_message: "Value should end with 322"
    });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [123454321],
          starts_with: [123],
          ends_with: [321],
          contains: [464]
        }
      })
    ).toEqual({
      is_valid: false,
      actual_sequence: ["values", "starts_with", "ends_with", "contains"],
      error_message: "Value should contain 464"
    });
  });

  // AND - multiple conditions are not met
  test("AND - multiple conditions are not met", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [321],
          contains: [454]
        }
      })
    ).toEqual({ is_valid: false, actual_sequence: ["values"], error_message: "Value should be 1234543212" });
  });

  // AND - change validation sequence
  test("AND - change validation sequence", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [322],
          contains: [464],
          validation_sequence: ["starts_with", "ends_with", "contains", "values"]
        }
      })
    ).toEqual({
      is_valid: false,
      actual_sequence: ["starts_with"],
      error_message: "Value should start with 123456"
    });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [322],
          contains: [464],
          validation_sequence: ["ends_with", "contains", "values", "starts_with"]
        }
      })
    ).toEqual({ is_valid: false, actual_sequence: ["ends_with"], error_message: "Value should end with 322" });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [322],
          contains: [464],
          validation_sequence: ["contains", "values", "starts_with", "ends_with"]
        }
      })
    ).toEqual({ is_valid: false, actual_sequence: ["contains"], error_message: "Value should contain 464" });
  });

  // AND - duplicate validation sequence
  test("AND - duplicate validation sequence", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "AND",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [322],
          contains: [464],
          validation_sequence: ["starts_with", "starts_with", "ends_with", "contains", "values"]
        }
      })
    ).toEqual({
      is_valid: false,
      actual_sequence: ["starts_with"],
      error_message: "Value should start with 123456"
    });
  });

  //AND -custom validation
  test("AND -custom validation", () => {
    const test1 = (value: number) => value === 123454321;
    const test2 = (value: number) => value > 10000;
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list_type: "whitelist",
        list: {
          combination: "AND",
          values: [123454321],
          starts_with: [12345],
          ends_with: [321],
          contains: [454],
          validation_sequence: [
            "starts_with",
            "ends_with",
            test1,
            "contains",
            "values",
            test2
          ]
        }
      })
    ).toEqual({
      is_valid: true,
      actual_sequence: ["starts_with", "ends_with", test1, "contains", "values", test2]
    });
  });

  // OR - one condition is met
  test("OR - one condition is met", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [1234543212, 123454321],
          starts_with: [123456],
          ends_with: [322],
          contains: [464]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values"] });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [1234543212],
          starts_with: [12345],
          ends_with: [322],
          contains: [464]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values", "starts_with"] });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [321],
          contains: [464]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values", "starts_with", "ends_with"] });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [1234543212],
          starts_with: [123456],
          ends_with: [322],
          contains: [454]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values", "starts_with", "ends_with", "contains"] });
  });

  // OR - multiple conditions are met
  test("OR - multiple conditions are met", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [1234543212, 123454321],
          starts_with: [123456],
          ends_with: [321],
          contains: [464]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values"] });
  });

  // OR change validation sequence
  test("OR - change validation sequence", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [123454321],
          starts_with: [12345],
          ends_with: [321],
          contains: [454],
          validation_sequence: ["starts_with", "ends_with", "contains", "values"]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["starts_with"] });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [123454321],
          starts_with: [12345],
          ends_with: [321],
          contains: [454],
          validation_sequence: ["ends_with", "contains", "values", "starts_with"]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["ends_with"] });
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [123454321],
          starts_with: [12345],
          ends_with: [321],
          contains: [454],
          validation_sequence: ["contains", "values", "starts_with", "ends_with"]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["contains"] });
  });

  // OR - duplicate validation sequence
  test("OR - duplicate validation sequence", () => {
    expect(
      validateNumberByList(123454321, {
        error_label: "Value",
        list: {
          combination: "OR",
          values: [123454321],
          starts_with: [12345],
          ends_with: [321],
          contains: [454],
          validation_sequence: ["values", "values", "starts_with", "ends_with", "contains"]
        }
      })
    ).toEqual({ is_valid: true, actual_sequence: ["values"] });
  });
});

// describe("validate String With Blacklist", () => {
//   // AND - all condition is met
//   test("AND - all condition is met", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example123", "test"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values", "starts_with", "ends_with", "contains"],
//       error_message:
//         'Value should not be "example123" or "test" and should not start with "ex" and should not end with "123" and should not contain "ample"'
//     });
//   });

//   // AND - one of the condition is not met
//   test("AND - one of the condition is not met", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example1234"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"]
//         }
//       })
//     ).toEqual({ is_valid: true, actual_sequence: ["values"] });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example123"],
//           starts_with: ["exe"],
//           ends_with: ["123"],
//           contains: ["ample"]
//         }
//       })
//     ).toEqual({
//       is_valid: true,
//       actual_sequence: ["values", "starts_with"]
//     });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example123"],
//           starts_with: ["ex"],
//           ends_with: ["1234"],
//           contains: ["ample"]
//         }
//       })
//     ).toEqual({
//       is_valid: true,
//       actual_sequence: ["values", "starts_with", "ends_with"]
//     });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example123"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["apple"]
//         }
//       })
//     ).toEqual({
//       is_valid: true,
//       actual_sequence: ["values", "starts_with", "ends_with", "contains"]
//     });
//   });

//   // AND - multiple conditions are not met
//   test("AND - multiple conditions are not met", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example1234"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["apple"]
//         }
//       })
//     ).toEqual({ is_valid: true, actual_sequence: ["values"] });
//   });

//   // AND - change validation sequence
//   test("AND - change validation sequence", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example1234"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["apple"],
//           actual_sequence: ["starts_with", "ends_with", "contains", "values"]
//         }
//       })
//     ).toEqual({ is_valid: true, actual_sequence: ["starts_with"] });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example1234"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["apple"],
//           actual_sequence: ["ends_with", "contains", "values", "starts_with"]
//         }
//       })
//     ).toEqual({ is_valid: true, actual_sequence: ["ends_with"] });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example1234"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["apple"],
//           actual_sequence: ["contains", "values", "starts_with", "ends_with"]
//         }
//       })
//     ).toEqual({ is_valid: true, actual_sequence: ["contains"] });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example123"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: ["starts_with", "ends_with", "contains", "values"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["starts_with", "ends_with", "contains", "values"],
//       error_message:
//         'Value should not start with "ex" and should not end with "123" and should not contain "ample" and should not be "example123"'
//     });
//   });

//   //AND -custom validation
//   test("AND -custom validation", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example123"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: [
//             "starts_with",
//             "ends_with",
//             (value) => value === "example123",
//             "contains",
//             "values",
//             (value) => value.length > 5
//           ]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["starts_with", "ends_with", "self_check_0", "contains", "values", "self_check_1"],
//       error_message:
//         'Value should not start with "ex" and should not end with "123" and should not pass self check 0 and should not contain "ample" and should not be "example123" and should not pass self check 1'
//     });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "whitelist",
//         list: {
//           combination: "AND",
//           values: ["example123"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: [
//             "starts_with",
//             "ends_with",
//             (value) => value === "example123",
//             "contains",
//             "values",
//             (value) => value.length > 5
//           ]
//         }
//       })
//     ).toEqual({
//       is_valid: true,
//       actual_sequence: ["starts_with", "ends_with", "self_check_0", "contains", "values", "self_check_1"]
//     });
//   });

//   // AND - duplicate validation sequence
//   test("AND - duplicate validation sequence", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "AND",
//           values: ["example1234"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["apple"],
//           actual_sequence: ["starts_with", "starts_with", "ends_with", "contains", "values"]
//         }
//       })
//     ).toEqual({
//       is_valid: true,
//       actual_sequence: ["starts_with"]
//     });
//   });

//   // OR - one condition is met
//   test("OR - one condition is met", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example123", "test"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["apple"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values"],
//       error_message: 'Value should not be "example123" or "test"'
//     });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example", "test"],
//           starts_with: ["exa"],
//           ends_with: ["1234"],
//           contains: ["apple"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values", "starts_with"],
//       error_message: 'Value should not start with "exa"'
//     });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example", "test"],
//           starts_with: ["exe"],
//           ends_with: ["123"],
//           contains: ["apple"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values", "starts_with", "ends_with"],
//       error_message: 'Value should not end with "123"'
//     });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example", "test"],
//           starts_with: ["exe"],
//           ends_with: ["1234"],
//           contains: ["ample"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values", "starts_with", "ends_with", "contains"],
//       error_message: 'Value should not contain "ample"'
//     });
//   });

//   // OR - multiple conditions are met
//   test("OR - multiple conditions are met", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example123", "test"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values"],
//       error_message: 'Value should not be "example123" or "test"'
//     });
//   });

//   // OR change validation sequence
//   test("OR - change validation sequence", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example123", "test"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: ["starts_with", "ends_with", "contains", "values"]
//         }
//       })
//     ).toEqual({ is_valid: false, actual_sequence: ["starts_with"], error_message: 'Value should not start with "ex"' });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example123", "test"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: ["ends_with", "contains", "values", "starts_with"]
//         }
//       })
//     ).toEqual({ is_valid: false, actual_sequence: ["ends_with"], error_message: 'Value should not end with "123"' });
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example123", "test"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: ["contains", "values", "starts_with", "ends_with"]
//         }
//       })
//     ).toEqual({ is_valid: false, actual_sequence: ["contains"], error_message: 'Value should not contain "ample"' });
//   });

//   // OR - duplicate validation sequence
//   test("OR - duplicate validation sequence", () => {
//     expect(
//       validateNumberByList("example123", {
//         error_label: "Value",
//         list_type: "blacklist",
//         list: {
//           combination: "OR",
//           values: ["example123", "test"],
//           starts_with: ["ex"],
//           ends_with: ["123"],
//           contains: ["ample"],
//           actual_sequence: ["values", "values", "starts_with", "ends_with", "contains"]
//         }
//       })
//     ).toEqual({
//       is_valid: false,
//       actual_sequence: ["values"],
//       error_message: 'Value should not be "example123" or "test"'
//     });
//   });
// });
