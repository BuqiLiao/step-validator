import { isNil, isEmpty, isString, isPlainObject, isNumber, isNaN } from "lodash-es";
import { validateNumber, isValidNumber } from "@/validators/NumberValidators.js";
import type { NumberValidationOptions, NumberErrorMessages } from "@/validators/NumberValidators.js";
import { ValidationResult } from "@/utils/ValidationResult.js";

export interface PortErrorMessages extends NumberErrorMessages {
  allowed_error?: string;
  required_error?: string;
}
export interface PortValidationOptions extends NumberValidationOptions {
  allowed?: boolean;
  required?: boolean;
  error_messages?: PortErrorMessages;
}

export function validatePort(value: string, options?: PortValidationOptions): ValidationResult;
export function validatePort(value: number, options?: NumberValidationOptions): ValidationResult;
export function validatePort(value: string | number, options?: PortValidationOptions | NumberValidationOptions) {
  if (!isString(value) && !isNumber(value)) {
    return new ValidationResult(
      false,
      options?.error_messages?.type_error ?? `${options?.error_label ?? "Port"} must be a string or number`
    );
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return new ValidationResult(true);
  if (isString(value)) {
    const { allowed, required, error_label, error_messages } = options as PortValidationOptions;
    if (required === true && value === "") {
      return new ValidationResult(
        false,
        error_messages?.required_error ?? `${error_label ?? "Port"} must not be empty`
      );
    }
    if (allowed === false && value !== "") {
      return new ValidationResult(false, error_messages?.allowed_error ?? `${error_label ?? "Port"} must be empty`);
    }
    if (value === "") return new ValidationResult(true);
    value = Number(value);
  }
  if (isNaN(value)) {
    return new ValidationResult(false, `${options?.error_label ?? "Port"} must be a number`);
  }
  if (value < 1 || value > 65535) {
    return new ValidationResult(false, `${options?.error_label ?? "Port"} must be between 1 and 65535`);
  }

  return validateNumber(value, options);
}

export function isValidPort(value: string, options?: PortValidationOptions): boolean;
export function isValidPort(value: number, options?: NumberValidationOptions): boolean;
export function isValidPort(value: string | number, options?: PortValidationOptions | NumberValidationOptions) {
  if (!isString(value) && !isNumber(value)) return false;
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return true;
  if (isString(value)) {
    const { allowed, required } = options as PortValidationOptions;
    if (required === true && value === "") return false;
    if (allowed === false && value !== "") return false;
    if (value === "") return true;
    value = Number(value);
  }
  if (isNaN(value)) return false;
  if (value < 1 || value > 65535) return false;

  return isValidNumber(value, options);
}
