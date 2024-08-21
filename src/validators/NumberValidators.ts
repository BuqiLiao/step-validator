import { isNil, isEmpty, isNumber, isPlainObject } from "lodash-es";
import { isValidByList, validateNumberByList } from "@/utils/validateByList.js";
import { ValidationResult } from "@/utils/ValidationResult.js";
import type { ListOptions } from "@/utils/validateByList.js";

export interface NumberErrorMessages {
  type_error?: string;
  whitelist?:
    | string
    | ((type: string | ((value: number) => boolean), expected_values: number[] | [number, number][]) => string);
  blacklist?:
    | string
    | ((type: string | ((value: number) => boolean), expected_values: number[] | [number, number][]) => string);
}

export interface NumberValidationOptions {
  whitelist?: ListOptions<number>;
  blacklist?: ListOptions<number>;
  validation_sequence?: ("whitelist" | "blacklist")[];
  error_label?: string;
  error_messages?: NumberErrorMessages;
}

export function validateNumber(value: number, options?: NumberValidationOptions) {
  if (!isNumber(value)) {
    return new ValidationResult(
      false,
      options?.error_messages?.type_error ?? `${options?.error_label ?? "Value"} must be a number`
    );
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return new ValidationResult(true);

  const { validation_sequence, error_label, error_messages } = options;
  const validationSequence = validation_sequence ?? ["whitelist", "blacklist"];
  const seenChecks = new Set<"whitelist" | "blacklist">();

  for (const check of validationSequence) {
    if (isNil(options[check]) || isEmpty(options[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const result = validateNumberByList(value, {
      list_type: check,
      list: options[check],
      error_label,
      error_message: error_messages?.[check]
    });
    if (!result.is_valid) {
      return result;
    }
  }

  return new ValidationResult(true);
}

export function isValidNumber(value: number, options?: NumberValidationOptions) {
  if (!isNumber(value)) return false;
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return true;

  const { validation_sequence } = options;
  const validationSequence = validation_sequence ?? ["whitelist", "blacklist"];
  const seenChecks = new Set<"whitelist" | "blacklist">();

  for (const check of validationSequence) {
    if (isNil(options[check]) || isEmpty(options[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const is_valid = isValidByList(value, {
      list_type: check,
      list: options[check]
    });
    if (!is_valid) return false;
  }

  return true;
}
