import { isNil, isEmpty, isPlainObject, isString } from "lodash-es";
import { validateString, isValidString } from "@/validators/StringValidators.js";
import { validateNumber, isValidNumber } from "@/validators/NumberValidators.js";
import { validatePort, isValidPort } from "@/validators/PortValidators.js";
import { ValidationResult } from "@/utils/ValidationResult.js";
import type { StringValidationOptions } from "@/validators/StringValidators.js";
import type { NumberValidationOptions } from "@/validators/NumberValidators.js";
import type { PortValidationOptions } from "@/validators/PortValidators.js";

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

const valueTypeToValidatorMap = {
  string: (value: string, options: StringValidationOptions) => validateString(value, options),
  number: (value: string, options: NumberValidationOptions) => validateNumber(Number(value), options),
  port: (value: string, options: PortValidationOptions) => validatePort(value, options)
};
const valueTypeToIsValidMap = {
  string: (value: string, options: StringValidationOptions) => isValidString(value, options),
  number: (value: string, options: NumberValidationOptions) => isValidNumber(Number(value), options),
  port: (value: string, options: PortValidationOptions) => isValidPort(value, options)
};

const generateErrorMessage = (key: string, error_message: string | ((key: string) => string)) => {
  return typeof error_message === "function" ? error_message(key) : error_message;
};

export function validateQuery(query: string, options?: QueryValidationOptions) {
  if (!isString(query)) {
    throw new Error("Query must be a string");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return new ValidationResult(true);

  const { allowed, required, keys_config, values_config, error_messages } = options;

  if (required === true && isEmpty(query)) {
    return new ValidationResult(false, error_messages?.required_error ?? "Query must not be empty");
  }
  if (allowed === false && !isEmpty(query)) {
    return new ValidationResult(false, error_messages?.allowed_error ?? "Query must be empty");
  }
  if (query === "" || isEmpty(keys_config)) return new ValidationResult(true);

  const { whitelist, allow_duplicates, require_all } = keys_config;

  const pairs = query.startsWith("?") ? query.slice(1).split("&") : query.split("&");
  const result: Record<string, string | undefined> = {};

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value ?? "");

    if (result[decodedKey]) {
      if (allow_duplicates === false) {
        return new ValidationResult(
          false,
          generateErrorMessage(decodedKey, error_messages?.duplicate_key_error ?? `Duplicate query key: ${decodedKey}`)
        );
      }
      continue;
    }
    // Check if the key is in the whitelist
    if (whitelist && !whitelist.includes(decodedKey)) {
      return new ValidationResult(
        false,
        generateErrorMessage(
          decodedKey,
          error_messages?.invalid_key_error ?? `Query key should be one of ${whitelist.join(", ")}`
        )
      );
    }
    // Check if the value is valid
    if (values_config && values_config[key]) {
      const { type = "string", ...rest } = values_config[key];
      const validator = valueTypeToValidatorMap[type];
      if (isNil(validator)) {
        throw new Error(`Value type ${type} is not supported`);
      }
      const result = validator(decodedValue, rest as any);
      if (!result.is_valid) {
        return result;
      }
    }

    result[decodedKey] = decodedValue;
  }

  if (require_all === true && whitelist) {
    for (const key of whitelist) {
      if (!result[key]) {
        return new ValidationResult(
          false,
          generateErrorMessage(
            key,
            error_messages?.invalid_key_error ?? `Query keys must have all of ${whitelist.join(", ")}`
          )
        );
      }
    }
  }

  return new ValidationResult(true);
}

export function isValidQuery(query: string, options?: QueryValidationOptions) {
  if (!isString(query)) {
    throw new Error("Query must be a string");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return true;

  const { allowed, required, keys_config, values_config } = options;
  if (required === true && isEmpty(query)) return false;
  if (allowed === false && !isEmpty(query)) return false;
  if (query === "" || isEmpty(keys_config)) return true;

  const { whitelist, allow_duplicates, require_all } = keys_config;
  const pairs = query.startsWith("?") ? query.slice(1).split("&") : query.split("&");
  const result: Record<string, string | undefined> = {};

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    const decodedKey = decodeURIComponent(key);
    const decodedValue = decodeURIComponent(value ?? "");

    if (result[decodedKey]) {
      if (allow_duplicates === false) return false;
      continue;
    }
    // Check if the key is in the whitelist
    if (whitelist && !whitelist.includes(decodedKey)) return false;
    // Check if the value is valid
    if (values_config && values_config[key]) {
      const { type = "string", ...rest } = values_config[key];
      const validator = valueTypeToIsValidMap[type];
      if (isNil(validator)) {
        throw new Error(`Value type ${type} is not supported`);
      }
      const result = validator(decodedValue, rest as any);
      if (!result) return false;
    }

    result[decodedKey] = decodedValue;
  }

  if (require_all === true && whitelist) {
    for (const key of whitelist) {
      if (!result[key]) return false;
    }
  }

  return true;
}
