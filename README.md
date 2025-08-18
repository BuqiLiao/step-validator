### step-validator

A flexible, list-driven validation toolkit for strings, numbers, ports, queries, and URLs. ESM-only, fully typed, and highly composable.

- Bold, simple API: validateX(...) returns a result object; isValidX(...) returns a boolean
- List-style rules with AND/OR composition and customizable validation order
- Whitelist and blacklist semantics with optional self-check functions
- Granular error messages that you can customize or fully control
- URL component validation (protocol/hostname/port/path/query/hash)

### Installation

```bash
npm install step-validator
# or
pnpm add step-validator
# or
yarn add step-validator
```

This package is ESM-only. Use import syntax.

### Quick start

```ts
import { validateString, isValidNumber, validatePort } from "step-validator";

// String whitelist with AND composition
const result = validateString("example123", {
  error_label: "Name",
  whitelist: {
    combination: "AND",
    values: ["example123", "hello"],
    starts_with: ["ex"],
    ends_with: ["123"],
    contains: ["amp"]
  }
});
// result: { is_valid: true }

// Boolean-only check
const ok = isValidNumber(123456, {
  whitelist: {
    ranges: [[120000, 130000]]
  }
});
// ok: true

// Port validation (string or number), range auto-checked (1..65535)
const portCheck = validatePort("8080", {
  whitelist: { values: [8080, 443] },
  error_label: "Port"
});
// { is_valid: true }
```

### Exports

- validateString(value, options): ValidationResult
- isValidString(value, options): boolean
- validateNumber(value, options): ValidationResult
- isValidNumber(value, options): boolean
- validatePort(value, options): ValidationResult
- isValidPort(value, options): boolean
- validateQuery(query, options): ValidationResult
- isValidQuery(query, options): boolean
- validateUrl(url, options): ValidationResult
- isValidUrl(url, options): boolean

TypeScript definitions are included.

### ValidationResult

```ts
interface ValidationResult {
  is_valid: boolean;
  error_message?: string;
}
```

### List-based rules

Most validators accept list-based options to describe allowed/blocked values.

Shared building blocks:

- ListOptions<T>
  - combination: "AND" | "OR" (default is context-aware; whitelist -> AND, blacklist -> OR)
  - validation_sequence: Array of checks to run and their order. Can include self-check functions `(value: T) => boolean`.
- String checks: `values`, `starts_with`, `ends_with`, `contains`
- Number checks: `values`, `starts_with`, `ends_with`, `contains`, `ranges: [min, max][]`

Validation order matters. The first decisive failure/success short-circuits.

Self-check functions must return a boolean. They let you plug in any custom logic.

### String

```ts
import { validateString, isValidString } from "step-validator";
```

Options:

- allowed?: boolean
- required?: boolean
- whitelist?: ListOptions<string>
- blacklist?: ListOptions<string>
- validation_sequence?: ("whitelist" | "blacklist")[] // order of list application
- error_label?: string
- error_messages?: {
  type_error?: string;
  allowed_error?: string;
  required_error?: string;
  whitelist?: string | ((type, expected) => string);
  blacklist?: string | ((type, expected) => string);
  }

Example:

```ts
const res = validateString("alpha-1", {
  required: true,
  error_label: "Username",
  whitelist: {
    combination: "AND",
    starts_with: ["alpha"],
    contains: ["-"]
  },
  blacklist: {
    combination: "OR",
    contains: [" "]
  },
  validation_sequence: ["whitelist", "blacklist"],
  error_messages: {
    whitelist: (type, values) => `Username must ${type} ${values.join(" or ")}`
  }
});
// -> { is_valid: true }
```

Behavior notes:

- If `required === true` and value is empty, validation fails.
- If `allowed === false` and value is non-empty, validation fails.
- Empty value short-circuits to valid when not required.

### Number

```ts
import { validateNumber, isValidNumber } from "step-validator";
```

Options:

- whitelist?: ListOptions<number>
- blacklist?: ListOptions<number>
- validation_sequence?: ("whitelist" | "blacklist")[]
- error_label?: string
- error_messages?: {
  type_error?: string;
  whitelist?: string | ((type, expected) => string);
  blacklist?: string | ((type, expected) => string);
  }

Number-only check `ranges` is supported: `[[min, max], ...]`.

### Port

```ts
import { validatePort, isValidPort } from "step-validator";
```

- Accepts string or number input
- Enforces 1 <= port <= 65535
- For string input, `allowed`/`required` behave like String validator before numeric checks

Options extend Number options with:

- allowed?: boolean
- required?: boolean
- error_messages?: NumberErrorMessages & {
  allowed_error?: string;
  required_error?: string;
  }

### Query string

```ts
import { validateQuery, isValidQuery } from "step-validator";
```

Validates query strings like `?a=1&b=2` or `a=1&b=2`.

Options:

- allowed?: boolean
- required?: boolean
- keys_config?: {
  whitelist?: string[]; // allowed keys
  allow_duplicates?: boolean; // reject repeated keys when false
  require_all?: boolean; // require all keys in whitelist when true
  }
- values_config?: {
  [key: string]:
  | ({ type?: "string" } & StringValidationOptions)
  | ({ type: "number" } & NumberValidationOptions)
  | ({ type: "port" } & PortValidationOptions);
  }
- error_messages?: {
  allowed_error?: string;
  required_error?: string;
  invalid_key_error?: string | ((key: string) => string);
  duplicate_key_error?: string | ((key: string) => string);
  require_all_error?: string;
  }

Example:

```ts
const q = "?ip=192.168.0.10&port=8080";
const isIPv4 = (v: string) => /^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(v);

const res = validateQuery(q, {
  required: true,
  keys_config: {
    whitelist: ["ip", "port"],
    allow_duplicates: false,
    require_all: true
  },
  values_config: {
    ip: {
      whitelist: { validation_sequence: [isIPv4] },
      error_label: "ip"
    },
    port: { type: "port", error_label: "port" }
  }
});
// -> { is_valid: true }
```

### URL

```ts
import { validateUrl, isValidUrl } from "step-validator";
```

Validate individual URL components using the same string/port/query validators under the hood.

Options:

- protocol_config?: StringValidationOptions
- hostname_config?: StringValidationOptions
- port_config?: PortValidationOptions
- path_config?: StringValidationOptions // path validated without leading '/'
- query_config?: QueryValidationOptions // search validated without leading '?'
- hash_config?: StringValidationOptions // hash validated without leading '#'
- validation_sequence?: ("protocol" | "hostname" | "port" | "path" | "query" | "hash")[]

Example:

```ts
const isIPv4 = (v: string) => /^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/.test(v);

const cfg = {
  protocol_config: {
    required: true,
    whitelist: { values: ["http:", "https:"] },
    error_label: "Protocol"
  },
  hostname_config: {
    required: true,
    whitelist: { validation_sequence: [isIPv4] },
    error_label: "Hostname",
    error_messages: {
      whitelist: (t) => (t === isIPv4 ? "Hostname must be an IPv4 address" : "Invalid hostname")
    }
  },
  port_config: { required: true, error_label: "Port" },
  query_config: {
    keys_config: { whitelist: ["id"], allow_duplicates: false },
    values_config: { id: { whitelist: { values: ["1", "2"] } } }
  }
} as const;

const ok = isValidUrl("http://192.168.1.10:8080?id=1", cfg);
// ok: true
```

### Error handling and edge cases

- All option objects must be plain objects; otherwise an error is thrown
- Empty options mean “no constraints” and return success
- Empty strings are allowed for string validators when not required
- For `validate*` functions, you receive a `ValidationResult` with message; `isValid*` returns only a boolean
- Self-check functions must return a boolean; if not, an error is thrown

### TypeScript

All public APIs are fully typed. You can import option types when needed:

```ts
import type { StringValidationOptions, URLValidationOptions } from "step-validator";
```

### License

MIT © Buqi Liao
