import { isNil, isEmpty, isNumber, isPlainObject } from "lodash-es";
import { validateNumberWithList } from "@/utils/validateWithList.js";
import type { NumberListOptions } from "@/utils/validateWithList.js";

export interface NumberErrorMessages {
  type_error?: string;
  whitelist?: string | ((type: string, expected_values: number[] | [number, number][]) => string);
  blacklist?: string | ((type: string, expected_values: number[] | [number, number][]) => string);
}

export interface NumberValidationOptions {
  whitelist?: NumberListOptions;
  blacklist?: NumberListOptions;
  validation_sequence?: ("whitelist" | "blacklist")[];
  error_label?: string;
  error_messages?: NumberErrorMessages;
}

export const isValidNumber = (value: number, options?: NumberValidationOptions) => {
  if (!isNumber(value)) {
    return {
      is_valid: false,
      error_message: options?.error_messages?.type_error ?? `${options?.error_label ?? "Value"} must be a number`
    };
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return { is_valid: true };

  const { validation_sequence, error_label, error_messages } = options;

  const validationSequence = validation_sequence ?? ["whitelist", "blacklist"];
  const seenChecks = new Set<"whitelist" | "blacklist">();

  for (const check of validationSequence) {
    if (isNil(options[check]) || isEmpty(options[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const { is_valid, error_message } = validateNumberWithList(value, {
      list_type: check,
      list: options[check],
      error_label,
      error_message: error_messages?.[check]
    });
    if (!is_valid) {
      return { is_valid, error_message };
    }
  }

  return { is_valid: true };
};
