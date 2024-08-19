export type HostType = "FQDN" | "ipv4" | "ipv6";
export type CombineType = "AND" | "OR";

export interface CheckOptions {
  values?: string[];
  starts_with?: string[];
  ends_with?: string[];
  contains?: string[];
}

export interface BaseOptions extends CheckOptions {
  combine?: CombineType;
  validation_sequence?: ("values" | "start_with" | "end_with" | "contains")[]; // only when combine is 'and'
}

export interface ListOptions extends CheckOptions {
  combination?: CombineType;
  validation_sequence?: ("values" | "starts_with" | "ends_with" | "contains")[];
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

export interface ErrorMessages {
  type_error?: string;
  required_error?: string;
  whitelist_error?: string | ((type: string, expected_values: string[]) => string);
  blacklist_error?: string;
}

export interface StringValidationOptions {
  required?: boolean;
  whitelist?: BaseOptions;
  blacklist?: BaseOptions;
  error_label?: string;
  error_messages?: ErrorMessages;
}
