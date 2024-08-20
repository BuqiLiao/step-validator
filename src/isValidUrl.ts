import { isNil, isEmpty, isString, isObject, isArray } from "lodash-es";
import URLParser from "url-parse";

import { isValidString } from "@/isValidString.js";
import { isValidNumber } from "@/isValidNumber.js";
import { isValidQuery } from "@/isValidQuery.js";
import type { QueryValidationOptions } from "@/isValidQuery.js";
import type { StringValidationOptions } from "@/isValidString.js";
import type { NumberValidationOptions } from "@/isValidNumber.js";

type UrlValidation = "protocol" | "host" | "port" | "query" | "hash";

export interface URLValidationOptions {
  protocol_config?: StringValidationOptions;
  host_config?: StringValidationOptions;
  port_config?: NumberValidationOptions;
  query_config?: QueryValidationOptions;
  hash_config?: StringValidationOptions;
  validation_sequence?: UrlValidation[];
}

export const isValidUrl = (url: string, options: URLValidationOptions) => {
  if (!isString(url)) {
    throw new Error("URL must be a string");
  }
  if (!isNil(options) && !isObject(options)) {
    throw new Error("Options must be an object");
  }
  if (isEmpty(options)) return { is_valid: true };

  // const { protocol, auth, hostname, port, query, hash } = URLParser(url);
  const parsedUrl = URLParser(url);

  const validationSequence = options.validation_sequence ?? ["protocol", "host", "port", "query", "hash"];

  const seenChecks = new Set<UrlValidation>();
  for (const check of validationSequence) {
    if (isNil(options[`${check}_config`]) || isEmpty(options[`${check}_config`])) continue;
    if (seenChecks.has(check)) continue;
    seenChecks.add(check);

    let result;
    if (check === "query") {
      result = isValidQuery(parsedUrl.query, options[`${check}_config`]);
    } else if (check === "port") {
      result = isValidNumber(Number(parsedUrl.port), options[`${check}_config`]);
    } else if (check === "protocol") {
      result = isValidString(parsedUrl.protocol.split(":")[0], options[`${check}_config`] as any);
    } else if (check === "host") {
      result = isValidString(parsedUrl.hostname, options[`${check}_config`] as any);
    } else {
      result = isValidString(parsedUrl[check], options[`${check}_config`] as any);
    }
    if (!result.is_valid) {
      return result;
    }
  }

  return { is_valid: true };
};
