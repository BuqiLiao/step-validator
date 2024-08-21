import { isNil, isEmpty, isString, isPlainObject } from "lodash-es";
import { isValidByList, validateStringByList } from "@/utils/validateByList.js";
import { ValidationResult } from "@/utils/ValidationResult.js";
import type { ListOptions } from "@/utils/validateByList.js";

export interface StringErrorMessages {
  type_error?: string;
  allowed_error?: string;
  required_error?: string;
  whitelist?: string | ((type: string | ((value: string) => boolean), expected_values: string[]) => string);
  blacklist?: string | ((type: string | ((value: string) => boolean), expected_values: string[]) => string);
}

export interface StringValidationOptions {
  allowed?: boolean;
  required?: boolean;
  whitelist?: ListOptions<string>;
  blacklist?: ListOptions<string>;
  validation_sequence?: ("whitelist" | "blacklist")[];
  error_label?: string;
  error_messages?: StringErrorMessages;
}

export function validateString(value: string, options?: StringValidationOptions) {
  if (!isString(value)) {
    return new ValidationResult(
      false,
      options?.error_messages?.type_error ?? `${options?.error_label ?? "Value"} must be a string`
    );
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return new ValidationResult(true);

  const { allowed, required, validation_sequence, error_label, error_messages } = options;
  if (required === true && !value) {
    return new ValidationResult(false, error_messages?.required_error ?? `${error_label ?? "Value"} must not be empty`);
  }
  if (allowed === false && value) {
    return new ValidationResult(false, error_messages?.allowed_error ?? `${error_label ?? "Value"} must be empty`);
  }
  if (value === "") return new ValidationResult(true);

  const validationSequence = validation_sequence ?? ["whitelist", "blacklist"];
  const seenChecks = new Set<"whitelist" | "blacklist">();

  for (const check of validationSequence) {
    if (isNil(options[check]) || isEmpty(options[check])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const result = validateStringByList(value, {
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

export function isValidString(value: string, options?: StringValidationOptions) {
  if (!isString(value)) return false;
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return true;

  const { allowed, required, validation_sequence } = options;
  if (required === true && !value) return false;
  if (allowed === false && value) return false;
  if (value === "") return true;

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
