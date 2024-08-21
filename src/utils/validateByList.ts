import { isNil, isEmpty, isString, isNumber, isPlainObject, isBoolean } from "lodash-es";
import { ValidationResult } from "@/utils/ValidationResult.js";

export interface StringCheckOptions {
  values?: string[];
  starts_with?: string[];
  ends_with?: string[];
  contains?: string[];
}
export interface NumberCheckOptions {
  values?: number[];
  starts_with?: number[];
  ends_with?: number[];
  contains?: number[];
  ranges?: [number, number][];
}

export type CheckOptions<T> = T extends string ? StringCheckOptions : T extends number ? NumberCheckOptions : never;

export type ListOptions<T> = CheckOptions<T> & {
  combination?: "AND" | "OR";
  validation_sequence?: (keyof CheckOptions<T> | ((value: T) => boolean))[];
};

export type IsValidByListOptions<T> = {
  list_type?: "whitelist" | "blacklist";
  list?: ListOptions<T>;
};

export interface ValidateStringByListOptions extends IsValidByListOptions<string> {
  error_label?: string;
  error_message?: string | ((type: string | ((value: string) => boolean), expected_values: string[]) => string);
}

export interface ValidateNumberByListOptions extends IsValidByListOptions<number> {
  error_label?: string;
  error_message?:
    | string
    | ((type: string | ((value: number) => boolean), expected_values: number[] | [number, number][]) => string);
}

export type ValidateByListOptions<T> = T extends string
  ? ValidateStringByListOptions
  : T extends number
  ? ValidateNumberByListOptions
  : never;

export class ValidateByListResult<T> extends ValidationResult {
  public actual_sequence?: (keyof CheckOptions<T> | ((value: T) => boolean))[];

  constructor(
    public is_valid: boolean,
    public error_message?: string,
    actual_sequence?: (keyof CheckOptions<T> | ((value: T) => boolean))[]
  ) {
    super(is_valid, error_message);
    this.actual_sequence = actual_sequence;
  }
}

const checkToValidationMap = {
  string: {
    values: (value: string, array: string[]) => array.includes(value),
    starts_with: (value: string, array: string[]) => array.some((prefix) => value.startsWith(prefix)),
    ends_with: (value: string, array: string[]) => array.some((suffix) => value.endsWith(suffix)),
    contains: (value: string, array: string[]) => array.some((substring) => value.includes(substring))
  },
  number: {
    values: (value: number, array: number[]) => array.includes(value),
    starts_with: (value: number, array: number[]) =>
      array.some((prefix) => value.toString().startsWith(prefix.toString())),
    ends_with: (value: number, array: number[]) => array.some((suffix) => value.toString().endsWith(suffix.toString())),
    contains: (value: number, array: number[]) =>
      array.some((substring) => value.toString().includes(substring.toString())),
    ranges: (value: number, array: [number, number][]) => array.some((range) => value >= range[0] && value <= range[1])
  }
};

const checkToPhraseMap = {
  values: "be",
  starts_with: "start with",
  ends_with: "end with",
  contains: "contain",
  ranges: "be in range"
};

const generateErrorMessage = <T>(
  type: string | ((value: T) => boolean),
  expected_values: T[],
  error_message: string | ((type: string | ((value: T) => boolean), expected_values: T[]) => string)
) => {
  return typeof error_message === "function" ? error_message(type, expected_values) : error_message;
};

export function isValidByList(
  value: string,
  options?: IsValidByListOptions<string>,
  actualSequence?: (keyof CheckOptions<string> | ((value: string) => boolean))[]
): boolean;
export function isValidByList(
  value: number,
  options?: IsValidByListOptions<number>,
  actualSequence?: (keyof CheckOptions<number> | ((value: number) => boolean))[]
): boolean;
export function isValidByList(
  value: string | number,
  options?: IsValidByListOptions<string> | IsValidByListOptions<number>,
  actualSequence?:
    | (keyof CheckOptions<string> | ((value: string) => boolean))[]
    | (keyof CheckOptions<number> | ((value: number) => boolean))[]
) {
  if (!isString(value) && !isNumber(value)) {
    throw new Error("Value must be a string or a number");
  }
  if (!isNil(options) && !isPlainObject(options)) {
    throw new Error("Options must be a plain object");
  }
  if (value === "" || isEmpty(options)) return true;

  const { list, list_type } = options;
  if (!isNil(list) && !isPlainObject(list)) {
    throw new Error("list must be a plain object");
  }
  if (isEmpty(list)) return true;
  if (!isNil(list_type) && list_type !== "whitelist" && list_type !== "blacklist") {
    throw new Error("list_type must be either 'whitelist' or 'blacklist'");
  }
  const listType = list_type ?? "whitelist";
  const { combination = listType === "whitelist" ? "AND" : "OR", validation_sequence } = list;
  if (combination !== "AND" && combination !== "OR") {
    throw new Error('Combination must be either "AND" or "OR"');
  }

  const validationSequence = validation_sequence ?? ["values", "starts_with", "ends_with", "contains", "ranges"];
  let isValid = combination === "OR" ? listType === "blacklist" : listType === "whitelist";
  const seenChecks = new Set();

  for (const check of validationSequence) {
    if (seenChecks.has(check)) continue;
    let result;
    if (isString(check)) {
      if (isNil((list as any)[check]) || isEmpty((list as any)[check])) continue;
      const validation = (checkToValidationMap as any)[typeof value][check];
      if (!isNil(validation)) {
        result = validation(value, (list as any)[check]);
        seenChecks.add(check);
        actualSequence?.push(check as any);
      }
    } else if (typeof check === "function") {
      result = (check as any)(value);
      if (!isBoolean(result)) {
        throw new Error("Self check function must return a boolean");
      }
      seenChecks.add(check);
      actualSequence?.push(check as any);
    }
    if (combination === "OR" && result) {
      isValid = listType === "whitelist";
      break;
    } else if (combination === "AND" && !result) {
      isValid = listType === "blacklist";
      break;
    }
  }
  if (isValid || seenChecks.size === 0) return true;

  return false;
}

export function validateStringByList(value: string, options?: ValidateByListOptions<string>) {
  if (!isString(value)) {
    throw new Error("Value must be a string");
  }
  const actualSequence: (keyof CheckOptions<string> | ((value: string) => boolean))[] = [];
  const result = isValidByList(value, options, actualSequence);
  if (result) return new ValidateByListResult(true, undefined, actualSequence.length > 0 ? actualSequence : undefined);

  const { list_type, list, error_label, error_message } = options!;
  const listType = list_type ?? "whitelist";
  const combination = list?.combination ?? (list_type === "whitelist" ? "AND" : "OR");

  if ((combination === "AND" && listType === "whitelist") || (combination === "OR" && listType === "blacklist")) {
    const lastCheck = actualSequence[actualSequence.length - 1];
    if (typeof lastCheck === "function") {
      return new ValidateByListResult(
        false,
        generateErrorMessage<string>(
          lastCheck as (value: string) => boolean,
          [],
          error_message ?? `${error_label} should ${listType === "blacklist" ? "not " : ""}pass self check ${lastCheck}`
        ),
        actualSequence
      );
    }
    const lastCheckKey = lastCheck as keyof StringCheckOptions;
    return new ValidateByListResult(
      false,
      generateErrorMessage<string>(
        lastCheckKey,
        list![lastCheckKey] ?? [],
        error_message ??
          `${error_label} should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[lastCheckKey]} "${list![
            lastCheckKey
          ]?.join('" or "')}"`
      ),
      actualSequence
    );
  } else {
    if (error_message) {
      return new ValidateByListResult(false, generateErrorMessage("", [], error_message), actualSequence);
    }
    const conditions = actualSequence.map((check) => {
      if (typeof check === "function") {
        return `should ${listType === "blacklist" ? "not " : ""}pass self check ${check}`;
      }
      const checkKey = check as keyof StringCheckOptions;
      return `should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[checkKey]} "${list![checkKey]?.join(
        listType === "blacklist" ? '" or "' : '", "'
      )}"`;
    });
    return new ValidateByListResult(
      false,
      `${error_label} ${conditions.join(listType === "blacklist" ? " and " : " or ")}`,
      actualSequence
    );
  }
}

export function validateNumberByList(value: number, options?: ValidateByListOptions<number>) {
  if (!isNumber(value)) {
    throw new Error("Value must be a number");
  }
  const actualSequence: (keyof CheckOptions<number> | ((value: number) => boolean))[] = [];
  const result = isValidByList(value, options, actualSequence);
  if (result) return new ValidateByListResult(true, undefined, actualSequence.length > 0 ? actualSequence : undefined);

  const { list_type, list, error_label, error_message } = options!;
  const listType = list_type ?? "whitelist";
  const combination = list?.combination ?? (list_type === "whitelist" ? "AND" : "OR");

  if ((combination === "AND" && listType === "whitelist") || (combination === "OR" && listType === "blacklist")) {
    const lastCheck = actualSequence[actualSequence.length - 1];
    if (typeof lastCheck === "function") {
      return new ValidateByListResult(
        false,
        generateErrorMessage<number>(
          lastCheck as (value: number) => boolean,
          [],
          error_message ?? `${error_label} should ${listType === "blacklist" ? "not " : ""}pass self check ${lastCheck}`
        ),
        actualSequence
      );
    }
    const lastCheckKey = lastCheck as keyof NumberCheckOptions;
    if (error_message) {
      return new ValidateByListResult(
        false,
        generateErrorMessage<number>(lastCheck, [], error_message),
        actualSequence
      );
    }
    let errorMessage;
    if (lastCheck === "ranges") {
      errorMessage = `${error_label} should ${listType === "blacklist" ? "not " : ""}${
        checkToPhraseMap[lastCheckKey]
      } ${(list![lastCheckKey] as NumberCheckOptions["ranges"])
        ?.map((range) => `${range[0]} - ${range[1]}`)
        .join(" or ")}`;
    } else {
      errorMessage = `${error_label} should ${listType === "blacklist" ? "not " : ""}${
        checkToPhraseMap[lastCheckKey]
      } ${list![lastCheckKey]?.join(" or ")}`;
    }
    return new ValidateByListResult(false, errorMessage, actualSequence);
  } else {
    if (error_message) {
      return new ValidateByListResult(false, generateErrorMessage("", [], error_message), actualSequence);
    }
    const conditions = actualSequence.map((check) => {
      if (typeof check === "function") {
        return `should ${listType === "blacklist" ? "not " : ""}pass self check ${check}`;
      }
      const checkKey = check as keyof NumberCheckOptions;
      if (checkKey === "ranges") {
        return `should ${listType === "blacklist" ? "not " : ""}${checkToPhraseMap[checkKey]} ${(
          list![checkKey] as NumberCheckOptions["ranges"]
        )
          ?.map((range) => `${range[0]} - ${range[1]}`)
          .join(" or ")}`;
      }
      return `should ${list_type === "blacklist" ? "not " : ""}${checkToPhraseMap[checkKey]} "${list![checkKey]?.join(
        list_type === "blacklist" ? '" or "' : '", "'
      )}"`;
    });
    return new ValidateByListResult(
      false,
      `${error_label} ${conditions.join(listType === "blacklist" ? " and " : " or ")}`,
      actualSequence
    );
  }
}
