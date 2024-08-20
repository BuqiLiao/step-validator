import { isNil, isEmpty, isString, isNumber, isPlainObject, isBoolean } from "lodash-es";

export interface StringCheckOptions {
  values?: string[];
  starts_with?: string[];
  ends_with?: string[];
  contains?: string[];
}
export interface NumberCheckOptions {
  values?: number[];
  starts_with?: number[];
  ends_with?: number[];
  contains?: number[];
  ranges?: [number, number][];
}

export interface StringListOptions extends StringCheckOptions {
  combination?: "AND" | "OR";
  validation_sequence?: (keyof StringCheckOptions | ((value: string) => boolean))[];
}
export interface NumberListOptions extends NumberCheckOptions {
  combination?: "AND" | "OR";
  validation_sequence?: (keyof NumberCheckOptions | ((value: number) => boolean))[];
}

export type ListOptions<T> = T extends number ? NumberListOptions : StringListOptions;

export interface ValidateStringWithListOptions {
  list_type?: "whitelist" | "blacklist";
  list?: ListOptions<string>;
  error_label?: string;
  error_message?: string | ((type: string, expected_values: string[]) => string);
}

export interface ValidateNumberWithListOptions {
  list_type?: "whitelist" | "blacklist";
  list?: ListOptions<number>;
  error_label?: string;
  error_message?: string | ((type: string, expected_values: number[] | [number, number][]) => string);
}

const checkToStringValidationMap = {
  values: (value: string, array: string[]) => array.includes(value),
  starts_with: (value: string, array: string[]) => array.some((prefix) => value.startsWith(prefix)),
  ends_with: (value: string, array: string[]) => array.some((suffix) => value.endsWith(suffix)),
  contains: (value: string, array: string[]) => array.some((substring) => value.includes(substring))
};
const checkToNumberValidationMap = {
  values: (value: number, array: number[]) => array.includes(value),
  starts_with: (value: number, array: number[]) =>
    array.some((prefix) => value.toString().startsWith(prefix.toString())),
  ends_with: (value: number, array: number[]) => array.some((suffix) => value.toString().endsWith(suffix.toString())),
  contains: (value: number, array: number[]) =>
    array.some((substring) => value.toString().includes(substring.toString())),
  ranges: (value: number, array: [number, number][]) => array.some((range) => value >= range[0] && value <= range[1])
};

const checkToPhraseMap = {
  values: "be",
  starts_with: "start with",
  ends_with: "end with",
  contains: "contain",
  ranges: "be in range"
};

const generateErrorMessage = <T>(
  type: string,
  expected_values: T,
  error_message: string | ((type: string, expected_values: T) => string)
) => {
  return typeof error_message === "function" ? error_message(type, expected_values) : error_message;
};

export const validateStringWithList = (value: string, options?: ValidateStringWithListOptions) => {
  if (!isString(value)) {
    throw new Error("Value must be a string");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(value) || isEmpty(options)) return { is_valid: true };

  const { list, list_type, error_label, error_message } = options;

  if (isNil(list)) return { is_valid: true };
  if (!isPlainObject(list)) {
    throw new Error("list must be a plain object");
  }
  if (isEmpty(list)) return { is_valid: true };

  if (!isNil(list_type) && list_type !== "whitelist" && list_type !== "blacklist") {
    throw new Error("list_type must be either 'whitelist' or 'blacklist'");
  }
  const listType = list_type ?? "whitelist";

  const { combination = listType === "whitelist" ? "AND" : "OR", validation_sequence } = list;
  if (combination !== "AND" && combination !== "OR") {
    throw new Error('Combination must be either "AND" or "OR"');
  }
  const validationSequence = validation_sequence ?? ["values", "starts_with", "ends_with", "contains"];

  let isValid = combination === "OR" ? listType === "blacklist" : listType === "whitelist";
  const actualSequence: (keyof StringCheckOptions | `self_check_${number}`)[] = [];
  const seenChecks = new Set<keyof StringCheckOptions>();
  let selfCheckCount = 0;

  for (const check of validationSequence) {
    let result;
    if (isString(check)) {
      if (isNil(list[check]) || isEmpty(list[check])) continue;
      if (seenChecks.has(check)) continue;
      seenChecks.add(check);
      actualSequence.push(check);
      result = checkToStringValidationMap[check](value, list[check]);
    } else if (typeof check === "function") {
      result = check(value);
      if (!isBoolean(result)) {
        throw new Error("Self check function must return a boolean");
      }
      actualSequence.push(`self_check_${selfCheckCount++}`);
    }
    if (combination === "OR" && result) {
      isValid = listType === "whitelist";
      break;
    } else if (combination === "AND" && !result) {
      isValid = listType === "blacklist";
      break;
    }
  }

  if (isValid) return { is_valid: true, ...(actualSequence.length > 0 && { actual_sequence: actualSequence }) };

  const errorLabel = error_label ?? "Value";

  if ((combination === "AND" && listType === "whitelist") || (combination === "OR" && listType === "blacklist")) {
    const lastCheck = actualSequence[actualSequence.length - 1];
    if (lastCheck.startsWith("self_check_")) {
      return {
        is_valid: false,
        actual_sequence: actualSequence,
        error_message: generateErrorMessage<string[]>(
          lastCheck,
          [],
          error_message ?? `Failed to pass self check ${lastCheck.replace("self_check_", "")}`
        )
      };
    }
    const lastCheckKey = lastCheck as keyof StringCheckOptions;
    return {
      is_valid: false,
      actual_sequence: actualSequence,
      error_message: generateErrorMessage<string[]>(
        lastCheckKey,
        list[lastCheckKey] ?? [],
        error_message ??
          `${errorLabel} should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[lastCheckKey]} "${list[
            lastCheckKey
          ]?.join('" or "')}"`
      )
    };
  } else {
    // OR mode
    if (actualSequence.length === 0) return { is_valid: true };
    if (error_message) {
      return {
        is_valid: false,
        actual_sequence: actualSequence,
        error_message: generateErrorMessage("", [], error_message)
      };
    }
    const conditions = actualSequence.map((check) => {
      if (check.startsWith("self_check_")) {
        return `should ${listType === "blacklist" ? "not " : ""}pass self check ${check.replace("self_check_", "")}`;
      }
      const checkKey = check as keyof StringCheckOptions;
      return `should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[checkKey]} "${list[checkKey]?.join(
        listType === "blacklist" ? '" or "' : '", "'
      )}"`;
    });
    return {
      is_valid: false,
      actual_sequence: actualSequence,
      error_message: `${errorLabel} ${conditions.join(listType === "blacklist" ? " and " : " or ")}`
    };
  }
};

export const validateNumberWithList = (value: number, options?: ValidateNumberWithListOptions) => {
  if (!isNumber(value)) {
    throw new Error("Value must be a number");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return { is_valid: true };

  const { list, list_type, error_label, error_message } = options;

  if (isNil(list)) return { is_valid: true };
  if (!isPlainObject(list)) {
    throw new Error("list must be a plain object");
  }
  if (isEmpty(list)) return { is_valid: true };

  if (!isNil(list_type) && list_type !== "whitelist" && list_type !== "blacklist") {
    throw new Error("list_type must be either 'whitelist' or 'blacklist'");
  }
  const listType = list_type ?? "whitelist";

  const { combination = listType === "whitelist" ? "AND" : "OR", validation_sequence } = list;
  if (combination !== "AND" && combination !== "OR") {
    throw new Error('Combination must be either "AND" or "OR"');
  }
  const validationSequence = validation_sequence ?? ["values", "starts_with", "ends_with", "contains", "ranges"];

  let isValid = combination === "OR" ? listType === "blacklist" : listType === "whitelist";
  const actualSequence: (keyof NumberCheckOptions | `self_check_${number}`)[] = [];
  const seenChecks = new Set<keyof NumberCheckOptions>();
  let selfCheckCount = 0;

  for (const check of validationSequence) {
    let result;
    if (isString(check)) {
      if (isNil(list[check]) || isEmpty(list[check])) continue;
      if (seenChecks.has(check)) continue;
      seenChecks.add(check);
      actualSequence.push(check);
      result = checkToNumberValidationMap[check](value, list[check] as any);
    } else if (typeof check === "function") {
      result = check(value);
      if (!isBoolean(result)) {
        throw new Error("Self check function must return a boolean");
      }
      actualSequence.push(`self_check_${selfCheckCount++}`);
    }
    if (combination === "OR" && result) {
      isValid = listType === "whitelist";
      break;
    } else if (combination === "AND" && !result) {
      isValid = listType === "blacklist";
      break;
    }
  }

  if (isValid) return { is_valid: true, ...(actualSequence.length > 0 && { actual_sequence: actualSequence }) };

  const errorLabel = error_label ?? "Value";

  if ((combination === "AND" && listType === "whitelist") || (combination === "OR" && listType === "blacklist")) {
    const lastCheck = actualSequence[actualSequence.length - 1];
    if (lastCheck.startsWith("self_check_")) {
      return {
        is_valid: false,
        actual_sequence: actualSequence,
        error_message: generateErrorMessage<number[] | [number, number][]>(
          lastCheck,
          [],
          error_message ?? `Failed to pass self check ${lastCheck.replace("self_check_", "")}`
        )
      };
    }
    const lastCheckKey = lastCheck as keyof NumberCheckOptions;
    if (error_message) {
      return {
        is_valid: false,
        actual_sequence: actualSequence,
        error_message: generateErrorMessage<number[] | [number, number][]>(
          lastCheckKey,
          list[lastCheckKey] ?? [],
          error_message
        )
      };
    }
    let errorMessage;
    if (lastCheck === "ranges") {
      errorMessage = `${errorLabel} should ${listType === "blacklist" ? "not " : ""}${
        checkToPhraseMap[lastCheckKey]
      } ${(list[lastCheckKey] as NumberCheckOptions["ranges"])
        ?.map((range) => `${range[0]} - ${range[1]}`)
        .join(" or ")}`;
    } else {
      errorMessage = `${errorLabel} should ${listType === "blacklist" ? "not " : ""}${
        checkToPhraseMap[lastCheckKey]
      } ${list[lastCheckKey]?.join(" or ")}`;
    }
    return {
      is_valid: false,
      actual_sequence: actualSequence,
      error_message: errorMessage
    };
  } else {
    // OR mode
    if (actualSequence.length === 0) return { is_valid: true };
    if (error_message) {
      return {
        is_valid: false,
        actual_sequence: actualSequence,
        error_message: generateErrorMessage("", [], error_message)
      };
    }
    const conditions = actualSequence.map((check) => {
      if (check.startsWith("self_check_")) {
        return `should ${listType === "blacklist" ? "not " : ""}pass self check ${check.replace("self_check_", "")}`;
      }
      const checkKey = check as keyof NumberCheckOptions;
      if (checkKey === "ranges") {
        return `should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[checkKey]} ${(
          list[checkKey] as NumberCheckOptions["ranges"]
        )
          ?.map((range) => `${range[0]} - ${range[1]}`)
          .join(" or ")}`;
      }
      return `should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[checkKey]} "${list[checkKey]?.join(
        listType === "blacklist" ? '" or "' : '", "'
      )}"`;
    });
    return {
      is_valid: false,
      actual_sequence: actualSequence,
      error_message: `${errorLabel} ${conditions.join(listType === "blacklist" ? " and " : " or ")}`
    };
  }
};
