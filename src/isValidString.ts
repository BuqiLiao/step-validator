import { isNil, isEmpty, isString, isPlainObject } from "lodash-es";
import { validateStringWithList } from "@/utils/validateWithList.js";
import type { StringListOptions } from "@/utils/validateWithList.js";

export interface StringErrorMessages {
  type_error?: string;
  allowed_error?: string;
  required_error?: string;
  whitelist?: string | ((type: string, expected_values: string[]) => string);
  blacklist?: string | ((type: string, expected_values: string[]) => string);
}

export interface StringValidationOptions {
  allowed?: boolean;
  required?: boolean;
  whitelist?: StringListOptions;
  blacklist?: StringListOptions;
  validation_sequence?: ("whitelist" | "blacklist")[];
  error_label?: string;
  error_messages?: StringErrorMessages;
}

export const isValidString = (value: string, options?: StringValidationOptions) => {
  if (!isString(value)) {
    return {
      is_valid: false,
      error_message: options?.error_messages?.type_error ?? `${options?.error_label ?? "Value"} must be a string`
    };
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return { is_valid: true };

  const { allowed, required, validation_sequence, error_label, error_messages } = options;

  if (required === true && !value) {
    return {
      is_valid: false,
      error_message: error_messages?.required_error ?? `${error_label ?? "Value"} must not be empty`
    };
  }
  if (allowed === false && value) {
    return {
      is_valid: false,
      error_message: error_messages?.allowed_error ?? `${error_label ?? "Value"} must be empty`
    };
  }
  if (isEmpty(value)) return { is_valid: true };

  const validationSequence = validation_sequence ?? ["whitelist", "blacklist"];
  const seenChecks = new Set<"whitelist" | "blacklist">();

  for (const check of validationSequence) {
    if (isNil(options[check]) || isEmpty(options[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const { is_valid, error_message } = validateStringWithList(value, {
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
