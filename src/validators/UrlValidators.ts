import { isNil, isEmpty, isString, isPlainObject } from "lodash-es";
import { URL } from "whatwg-url";
import { validateString, isValidString } from "@/validators/StringValidators.js";
import { validatePort, isValidPort } from "@/validators/PortValidators.js";
import { validateQuery, isValidQuery } from "@/validators/QueryValidators.js";
import { ValidationResult } from "@/utils/ValidationResult.js";
import type { QueryValidationOptions } from "@/validators/QueryValidators.js";
import type { StringValidationOptions } from "@/validators/StringValidators.js";
import type { PortValidationOptions } from "@/validators/PortValidators.js";

export type UrlComponent = "protocol" | "host" | "port" | "query" | "hash";

export interface URLValidationOptions {
  protocol_config?: StringValidationOptions;
  host_config?: StringValidationOptions;
  port_config?: PortValidationOptions;
  query_config?: QueryValidationOptions;
  hash_config?: StringValidationOptions;
  validation_sequence?: UrlComponent[];
}

const componentToValidatorMap = {
  protocol: validateString,
  host: validateString,
  port: validatePort,
  query: validateQuery,
  hash: validateString
};
const componentToIsValidMap = {
  protocol: isValidString,
  host: isValidString,
  port: isValidPort,
  query: isValidQuery,
  hash: isValidString
};

const componentToGetterNameMap = {
  protocol: "protocol",
  host: "hostname",
  port: "port",
  query: "search",
  hash: "hash"
} as const;

export function validateUrl(url: string, options: URLValidationOptions) {
  if (!isString(url)) {
    throw new Error("URL must be a string");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return new ValidationResult(true);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error("Please provide a valid URL");
  }
  const validationSequence = options.validation_sequence ?? ["protocol", "host", "port", "query", "hash"];
  const seenChecks = new Set<UrlComponent>();

  for (const check of validationSequence) {
    if (isNil(options[`${check}_config`]) || isEmpty(options[`${check}_config`])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const validator = componentToValidatorMap[check];
    if (!isNil(validator)) {
      const result = validator(parsedUrl[componentToGetterNameMap[check]], options[`${check}_config`] as any);
      if (!result.is_valid) {
        return result;
      }
    }
  }

  return new ValidationResult(true);
}

export function isValidUrl(url: string, options: URLValidationOptions) {
  if (!isString(url)) {
    throw new Error("URL must be a string");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return true;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error("Please provide a valid URL");
  }
  const validationSequence = options.validation_sequence ?? ["protocol", "host", "port", "query", "hash"];
  const seenChecks = new Set<UrlComponent>();

  for (const check of validationSequence) {
    if (isNil(options[`${check}_config`]) || isEmpty(options[`${check}_config`])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const validator = componentToIsValidMap[check];
    if (!isNil(validator)) {
      const result = validator(parsedUrl[componentToGetterNameMap[check]], options[`${check}_config`] as any);
      if (!result) return false;
    }
  }

  return true;
}
