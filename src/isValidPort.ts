import { isNil, isEmpty, isString, isPlainObject, isArray, isNumber } from "lodash-es";
import { isValidNumber } from "@/isValidNumber.js";
import type { NumberValidationOptions, NumberErrorMessages } from "@/isValidNumber.js";

export interface PortErrorMessages extends NumberErrorMessages {
  allowed_error?: string;
  required_error?: string;
}
export interface PortValidationOptions extends NumberValidationOptions {
  allowed?: boolean;
  required?: boolean;
  error_messages?: PortErrorMessages;
}

export function isValidPort(value: string | number, options?: PortValidationOptions) {
  if (!isString(value) && !isNumber(value)) {
    return {
      is_valid: false,
      error_message:
        options?.error_messages?.type_error ?? `${options?.error_label ?? "Port"} must be a string or number`
    };
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isNil(options)) {
    options = {};
  }
  if (isString(value)) {
    if (value === "") return { is_valid: true };

    const { allowed, required, error_label, error_messages } = options;
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
    value = Number(value);
  }

  // options.whitelist?.values
  if (isEmpty(options.whitelist)) {
    options.whitelist = {
      ranges: [[1, 65535]]
    };
  } else if (isNil(options.whitelist.ranges) || isEmpty(options.whitelist.ranges)) {
    options.whitelist.ranges = [[1, 65535]];
  } else {
    options.whitelist.ranges.push([1, 65535]);
  }
  return isValidNumber(value, options);
}
