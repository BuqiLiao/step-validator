export type HostType = "FQDN" | "ipv4" | "ipv6";
export type CombineType = "and" | "or";

export interface BaseOptions {
  combine?: CombineType;
  values?: string[];
  start_with?: string[];
  end_with?: string[];
  contains?: string[];
}
export interface HostOptions extends BaseOptions {
  types?: HostType[];
}
export interface PortOptions extends BaseOptions {
  interval?: [number, number];
}

export interface URLValidationOptions {
  protocol_config?: {
    required?: boolean;
    whitelist?: BaseOptions;
    blacklist?: BaseOptions;
  };
  host_config?: {
    required?: boolean;
    whitelist?: HostOptions;
    blacklist?: HostOptions;
  };
  port_config?: {
    required?: boolean;
    whitelist?: PortOptions;
    blacklist?: PortOptions;
  };
  query_key_config?: {
    allowed?: boolean;
    whitelist?: BaseOptions;
    blacklist?: BaseOptions;
  };
  query_value_config?: {
    [key: string]: {
      required?: boolean;
      whitelist?: BaseOptions;
      blacklist?: BaseOptions;
    };
  };
  fragment_config?: {
    allowed?: boolean;
    whitelist?: BaseOptions;
    blacklist?: BaseOptions;
  };
}

export interface StringOptions {
  required?: boolean;
  whitelist?: BaseOptions;
  blacklist?: BaseOptions;
}

