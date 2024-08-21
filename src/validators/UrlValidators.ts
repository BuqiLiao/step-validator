import { isNil, isEmpty, isString, isPlainObject } from "lodash-es";
import URLParser from "url-parse";
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

export function validateUrl(url: string, options: URLValidationOptions) {
  if (!isString(url)) {
    throw new Error("URL must be a string");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (isEmpty(options)) return new ValidationResult(true);

  const parsedUrl = URLParser(url);
  const validationSequence = options.validation_sequence ?? ["protocol", "host", "port", "query", "hash"];
  const seenChecks = new Set<UrlComponent>();

  for (const check of validationSequence) {
    if (isNil(options[`${check}_config`]) || isEmpty(options[`${check}_config`])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const validator = componentToValidatorMap[check];
    if (!isNil(validator)) {
      const result = validator(
        check === "host" ? parsedUrl.hostname : parsedUrl[check],
        options[`${check}_config`] as any
      );
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

  const parsedUrl = URLParser(url);
  const validationSequence = options.validation_sequence ?? ["protocol", "host", "port", "query", "hash"];
  const seenChecks = new Set<UrlComponent>();

  for (const check of validationSequence) {
    if (isNil(options[`${check}_config`]) || isEmpty(options[`${check}_config`])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    const validator = componentToIsValidMap[check];
    if (!isNil(validator)) {
      const result = validator(
        check === "host" ? parsedUrl.hostname : parsedUrl[check],
        options[`${check}_config`] as any
      );
      if (!result) return false;
    }
  }

  return true;
}
