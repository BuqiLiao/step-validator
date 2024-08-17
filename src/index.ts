import { isString, merge, isNil } from "lodash-es";
import { validateWhitelist, validateBlacklist } from "@/utils/index.js";
import type { URLValidationOptions, StringOptions } from "../types/index.js";

const defaultOptions: URLValidationOptions = {
  protocol_config: {
    required: true
  },
  host_config: {
    required: true
  },
  port_config: {
    required: false,
    whitelist: {
      interval: [0, 65535]
    }
  },
  query_key_config: {
    allowed: true
  },
  fragment_config: {
    allowed: true
  }
};

export const isValidUrl = (value: string, options: URLValidationOptions) => {
  if (!isString(value)) {
    throw new Error("URL should be a string");
  }
  if (value.trim() === "") {
    throw new Error("URL cannot be empty");
  }

  options = merge(defaultOptions, options);
  const { protocol_config, host_config, port_config, query_key_config, fragment_config } = options;

  let url = value;
  let protocol, host, port, query, fragment;
  /***************************************** Protocol Validation *****************************************/
  const protocolRegEx = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\//;
  const protocolMatch = url.match(protocolRegEx);
  if (protocolMatch) {
    protocol = protocolMatch[1];
    validateWhitelist("Protocol", protocol, protocol_config?.whitelist);
    validateBlacklist("Protocol", protocol, protocol_config?.blacklist);

    url = url.slice(protocolMatch[0].length);
  } else if (protocol_config?.required) {
    throw new Error('URL should start with a valid protocol followed by "://"');
  }
  /***************************************** Host Validation *****************************************/
  const hostRegEx = /^([^/:?#]+)/;
  const hostMatch = url.match(hostRegEx);
  if (hostMatch) {
    host = hostMatch[1];
    validateWhitelist("Host", host, host_config?.whitelist);
    validateBlacklist("Host", host, host_config?.blacklist);

    url = url.slice(hostMatch[0].length);
  } else if (host_config?.required) {
    throw new Error("Host should not be empty");
  }
  /***************************************** Port Validation *****************************************/
  const portRegEx = /:(\d+)/;
  const portMatch = url.match(portRegEx);
  if (portMatch) {
    port = portMatch[1];
    validateWhitelist("Port", port, port_config?.whitelist);
    validateBlacklist("Port", port, port_config?.blacklist);

    url = url.slice(portMatch[0].length);
  } else if (port_config?.required) {
    throw new Error("Port should not be empty");
  }
  /***************************************** Query Validation *****************************************/
  if (!query_key_config?.allowed) {
    if (url.includes("?")) {
      throw new Error('Should not contain query symbol "?"');
    }
  } else {
    const queryRegEx = /\?([^#]*)/;
    const queryMatch = url.match(queryRegEx);
    // If query is present, test the whitelist and blacklist
    if (queryMatch) {
      const queryString = queryMatch[1];
      if (!queryString) {
        throw new Error("Query should not be empty");
      }
      query = new URLSearchParams(queryString);
      for (const [key, value] of query) {
        validateWhitelist("Query parameter", key, query_key_config.whitelist);
        validateBlacklist("Query parameter", key, query_key_config.blacklist);
        const valueConfig = options.query_value_config?.[key];
        if (valueConfig) {
          if (value) {
            validateWhitelist(`Query "${key}" value`, value, valueConfig?.whitelist);
            validateBlacklist(`Query "${key}" value`, value, valueConfig?.blacklist);
          } else if (valueConfig.required) {
            throw new Error(`Query "${key}" value should not be empty`);
          }
        }
      }
      url = url.slice(queryMatch[0].length);
    }
  }
  /***************************************** Fragment Validation *****************************************/
  if (!fragment_config?.allowed) {
    if (value.includes("#")) {
      throw new Error('Should not contain fregment symbol "#"');
    }
  } else {
    const fragmentRegEx = /#([^#]*)/;
    const fragmentMatch = url.match(fragmentRegEx);
    if (fragmentMatch) {
      fragment = fragmentMatch[1];
      validateWhitelist("Fragment", fragment, fragment_config.whitelist);
      validateBlacklist("Fragment", fragment, fragment_config.blacklist);

      url = url.slice(fragmentMatch[0].length);
    }
  }

  return {
    ...(!isNil(protocol) && { protocol }),
    ...(!isNil(host) && { host }),
    ...(!isNil(port) && { port }),
    ...(!isNil(query) && { query }),
    ...(!isNil(fragment) && { fragment })
  };
};

export const isValidString = (value: string, errorLabel: string = "String", options?: StringOptions) => {
  if (!isString(value)) {
    throw new Error(`${errorLabel} should be a string`);
  }
  if (options?.required && !value) {
    throw new Error(`${errorLabel} should not be empty`);
  }
  validateWhitelist(errorLabel, value, options?.whitelist);
  validateBlacklist(errorLabel, value, options?.blacklist);
};
