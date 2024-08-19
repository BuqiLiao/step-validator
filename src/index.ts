import { isNil, isEmpty, isString, isObject } from "lodash-es";
import { validateStringWithList } from "@/utils/validateStringWithList.js";
import type { StringListOptions, StringCheckOptions } from "@/utils/validateStringWithList.js";
import { whitelist } from "validator";

export type ActualSequences = {
  list_type: "whitelist" | "blacklist";
  actual_sequence?: (keyof StringCheckOptions)[];
}[];

export interface ErrorMessages {
  type_error?: string;
  required_error?: string;
  whitelist?: string | ((type: string, expected_values: string[]) => string);
  blacklist?: string | ((type: string, expected_values: string[]) => string);
}

export interface StringValidationOptions {
  required?: boolean;
  whitelist?: StringListOptions;
  blacklist?: StringListOptions;
  validation_sequence?: ("whitelist" | "blacklist")[];
  error_label?: string;
  error_messages?: ErrorMessages;
}

export const isValidString = (value: string, options?: StringValidationOptions) => {
  if (!isString(value)) {
    return {
      is_valid: false,
      error_message: options?.error_messages?.type_error ?? `${options?.error_label ?? "Value"} must be a string`
    };
  }
  if (!isNil(options) && !isObject(options)) {
    throw new Error("Options must be an object");
  }
  if (isEmpty(options)) return { is_valid: true };

  const { required, validation_sequence, error_label, error_messages } = options;

  if (required && !value) {
    return {
      is_valid: false,
      error_message: error_messages?.required_error ?? `${error_label ?? "Value"} must not be empty`
    };
  }

  const validationSequence = validation_sequence ?? ["whitelist", "blacklist"];
  const actualSequences: ActualSequences = [];
  const seenChecks = new Set<"whitelist" | "blacklist">();

  for (const check of validationSequence) {
    if (isNil(options[check]) || isEmpty(options[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const result = validateStringWithList(value, {
      list_type: check,
      list: options[check],
      error_label,
      error_message: error_messages?.[check]
    });
    const { is_valid, error_message, actual_sequence } = result;
    actualSequences.push({ list_type: check, ...(actual_sequence && { actual_sequence }) });
    if (!is_valid) {
      return {
        is_valid: false,
        ...(error_message && { error_message }),
        ...(actualSequences.length > 0 && { actual_sequences: actualSequences })
      };
    }
  }

  return { is_valid: true, ...(actualSequences.length > 0 && { actual_sequences: actualSequences }) };
};
