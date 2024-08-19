import { isNil, isEmpty, isString, isObject } from "lodash-es";

export type HostType = "FQDN" | "ipv4" | "ipv6" | "localhost";

export interface HostCheckOptions {
  required?: boolean;
  types?: HostType[];
}