import { isNil, isEmpty, isString, isObject } from "lodash-es";
import { isIP, inRange } from "range_check";

export type HostType = "FQDN" | "ipv4" | "ipv6" | "localhost";

export interface IPv4CheckOptions {
  whitelist?: {
    values?: string[];
    ranges?: ([string, string] | string)[];
  };
  blacklist?: {
    values?: string[];
    ranges?: [string, string][];
  };
}

export const isIPv4InRange = (ip: string, range: [string, string]) => {
  const [start, end] = range;
  return inRange(ip, [start, end]);
};
