import { isNil, isEmpty, isObject, isString } from "lodash-es";
import { isValidString } from "@/isValidString.js";
import { isValidNumber } from "@/isValidNumber.js";
import { isValidPort } from "@/isValidPort.js";
import type { StringValidationOptions } from "@/isValidString.js";
import type { NumberValidationOptions } from "@/isValidNumber.js";
import type { PortValidationOptions } from "@/isValidPort.js";

export type QueryValueValidationOptions =
  | ({ type?: "string" } & StringValidationOptions)
  | ({ type: "number" } & NumberValidationOptions)
  | ({ type: "port" } & PortValidationOptions);

export type QueryValidationOptions = {
  allowed?: boolean;
  required?: boolean;
  keys_config?: {
    whitelist?: string[];
    allow_duplicates?: boolean;
    require_all?: boolean;
  };
  values_config?: {
    [key: string]: QueryValueValidationOptions;
  };
  error_messages?: {
    allowed_error?: string;
    required_error?: string;
    invalid_key_error?: string | ((key: string) => string);
    duplicate_key_error?: string | ((key: string) => string);
    require_all_error?: string;
  };
};

const generateErrorMessage = (key: string, error_message: string | ((key: string) => string)) => {
  return typeof error_message === "function" ? error_message(key) : error_message;
};

export const isValidQuery = (query: string, options?: QueryValidationOptions) => {
  if (!isString(query)) {
    throw new Error("Query must be a string");
  }
  if (!isNil(options) && !isObject(options)) {
    throw new Error("Options must be an object");
  }
  if (isEmpty(options)) return { is_valid: true };

  const { allowed, required, keys_config, values_config, error_messages } = options;

  if (required === true && isEmpty(query)) {
    return {
      is_valid: false,
      error_message: error_messages?.required_error ?? "Query must not be empty"
    };
  }
  if (allowed === false && !isEmpty(query)) {
    return {
      is_valid: false,
      error_message: error_messages?.allowed_error ?? "Query must be empty"
    };
  }
  if (isEmpty(query) || isEmpty(keys_config)) return { is_valid: true };

  const { whitelist, allow_duplicates, require_all } = keys_config;

  const pairs = query.startsWith("?") ? query.slice(1).split("&") : query.split("&");
  const result: Record<string, string | undefined> = {};

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value ?? "");

    if (result[decodedKey]) {
      if (allow_duplicates === false) {
        return {
          is_valid: false,
          error_message: generateErrorMessage(
            decodedKey,
            error_messages?.duplicate_key_error ?? `Duplicate query key: ${decodedKey}`
          )
        };
      }
      continue;
    }
    // Check if the key is in the whitelist
    if (whitelist && !whitelist.includes(decodedKey)) {
      return {
        is_valid: false,
        error_message: generateErrorMessage(
          decodedKey,
          error_messages?.invalid_key_error ?? `Query key should be one of ${whitelist.join(", ")}`
        )
      };
    }

    if (values_config && values_config[key]) {
      const { type = "string", ...rest } = values_config[key];
      const { is_valid, error_message } =
        type === "string"
          ? isValidString(decodedValue, rest as StringValidationOptions)
          : type === "number"
          ? isValidNumber(Number(decodedValue), rest as NumberValidationOptions)
          : isValidPort(decodedValue, rest as PortValidationOptions);
      if (!is_valid) {
        return { is_valid, error_message };
      }
    }

    result[decodedKey] = decodedValue;
  }

  if (require_all === true && whitelist) {
    for (const key of whitelist) {
      if (!result[key]) {
        return {
          is_valid: false,
          error_message: error_messages?.invalid_key_error ?? `Query keys must have all of ${whitelist.join(", ")}`
        };
      }
    }
  }

  return { is_valid: true };
};
