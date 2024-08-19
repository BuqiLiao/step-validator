import { isNil, isEmpty, isString, isObject } from "lodash-es";

export interface StringCheckOptions {
  values?: string[];
  starts_with?: string[];
  ends_with?: string[];
  contains?: string[];
}

export interface StringListOptions extends StringCheckOptions {
  combination?: "AND" | "OR";
  validation_sequence?: ("values" | "starts_with" | "ends_with" | "contains")[];
}

export interface ValidateStringOptions extends StringListOptions {
  list_type?: "whitelist" | "blacklist";
  list?: StringListOptions;
  error_label?: string;
  error_message?: string | ((type: string, expected_values: string[]) => string);
}

const checkToValidationMap = {
  values: (value: string, array: string[]) => array.includes(value),
  starts_with: (value: string, array: string[]) => array.some((prefix) => value.startsWith(prefix)),
  ends_with: (value: string, array: string[]) => array.some((suffix) => value.endsWith(suffix)),
  contains: (value: string, array: string[]) => array.some((substring) => value.includes(substring))
};

const checkToPhraseMap = {
  values: "be",
  starts_with: "start with",
  ends_with: "end with",
  contains: "contain"
};

const generateErrorMessage = (
  type: string,
  expected_values: string[],
  error_message: string | ((type: string, expected_values: string[]) => string)
) => {
  return typeof error_message === "function" ? error_message(type, expected_values) : error_message;
};

export const validateStringWithList = (value: string, options?: ValidateStringOptions) => {
  if (!isString(value)) {
    throw new Error("Value must be a string");
  }
  if (!isNil(options) && !isObject(options)) {
    throw new Error("Options must be an object");
  }
  if (isEmpty(value) || isEmpty(options)) return { is_valid: true };

  const { list, list_type, error_label, error_message } = options;

  if (isNil(list)) return { is_valid: true };
  if (!isObject(list)) {
    throw new Error("list must be an object");
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
  const actualSequence: (keyof StringCheckOptions)[] = [];
  const seenChecks = new Set<keyof StringCheckOptions>();

  for (const check of validationSequence) {
    if (isNil(list[check]) || isEmpty(list[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);
    actualSequence.push(check);

    const result = checkToValidationMap[check](value, list[check]);
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
    return {
      is_valid: false,
      actual_sequence: actualSequence,
      error_message: generateErrorMessage(
        lastCheck,
        list[lastCheck]!,
        error_message ??
          `${errorLabel} should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[lastCheck]} "${list[
            lastCheck
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
    const conditions = actualSequence.map(
      (check) =>
        `should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[check]} "${list[check]?.join(
          listType === "blacklist" ? '" or "' : '", "'
        )}"`
    );
    return {
      is_valid: false,
      actual_sequence: actualSequence,
      error_message: `${errorLabel} ${conditions.join(listType === "blacklist" ? " and " : " or ")}`
    };
  }
};
