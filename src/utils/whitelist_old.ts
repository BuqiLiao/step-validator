// import { isNil, isEmpty } from "lodash-es";
// import { validateCondition, isInRange, hostTypeValidationMap } from "./validators.js";
// import type { HostType, BaseOptions, CheckOptions } from "@/types.js";

// const validateWhitelistAND = (title: string, value: string, whitelist: any) => {
//   const { values, types, start_with, end_with, contains, interval } = whitelist;

//   values && validateCondition(values.includes(value), `${title} should be "${values.join('" or "')}"`);
//   types &&
//     validateCondition(
//       types.some((type: HostType) => hostTypeValidationMap[type]?.(value)),
//       `${title} should be of type "${types.join('" or "')}"`
//     );
//   start_with &&
//     validateCondition(
//       start_with.some((prefix: string) => value.startsWith(prefix)),
//       `${title} should start with "${start_with.join('" or "')}"`
//     );
//   end_with &&
//     validateCondition(
//       end_with.some((suffix: string) => value.endsWith(suffix)),
//       `${title} should end with "${end_with.join('" or "')}"`
//     );
//   contains &&
//     validateCondition(
//       contains.some((substring: string) => value.includes(substring)),
//       `${title} should contain "${contains.join('" or "')}"`
//     );
//   interval &&
//     validateCondition(
//       isInRange(parseInt(value), interval),
//       `${title} should be between ${interval[0]} and ${interval[1]}`
//     );
// };

// const validateWhitelistOR = (title: string, value: string, whitelist: any) => {
//   const isWhitelisted =
//     (whitelist.values && whitelist.values.includes(value)) ||
//     (whitelist.types && whitelist.types.some((type: HostType) => hostTypeValidationMap[type]?.(value))) ||
//     (whitelist.start_with && whitelist.start_with.some((prefix: string) => value.startsWith(prefix))) ||
//     (whitelist.end_with && whitelist.end_with.some((suffix: string) => value.endsWith(suffix))) ||
//     (whitelist.contains && whitelist.contains.some((substring: string) => value.includes(substring))) ||
//     (whitelist.interval && isInRange(parseInt(value), whitelist.interval));

//   if (!isWhitelisted) {
//     const conditions: string[] = [];
//     if (whitelist.values) conditions.push(`one of "${whitelist.values.join('", "')}"`);
//     if (whitelist.types) conditions.push(`of type "${whitelist.types.join('", "')}"`);
//     if (whitelist.start_with) conditions.push(`starting with "${whitelist.start_with.join('", "')}"`);
//     if (whitelist.end_with) conditions.push(`ending with "${whitelist.end_with.join('", "')}"`);
//     if (whitelist.contains) conditions.push(`containing "${whitelist.contains.join('", "')}"`);
//     if (whitelist.interval) conditions.push(`between ${whitelist.interval[0]} and ${whitelist.interval[1]}`);

//     throw new Error(`${title} should be ${conditions.join(" or ")}`);
//   }
// };

// export const validateWhitelist = (title: string, value: string, whitelist?: any) => {
//   if (isNil(whitelist) || isNil(value)) return;
//   const combine = whitelist?.combine || "and";
//   combine === "and" ? validateWhitelistAND(title, value, whitelist) : validateWhitelistOR(title, value, whitelist);
// };

// interface ValidateWhitelistOptions {
//   whitelist: BaseOptions;
//   error_label: string;
//   error_message?: string | ((type: string, expected_values: string[]) => string);
// }

// const generateErrorMessage = (
//   type: string,
//   expected_values: string[],
//   error_message: string | ((type: string, expected_values: string[]) => string)
// ) => {
//   return typeof error_message === "function" ? error_message(type, expected_values) : error_message;
// };

// const validateWhitelistORNew = (value: string, options: ValidateWhitelistOptions) => {
//   const { error_label, error_message, whitelist } = options;
//   if (isNil(whitelist) || isEmpty(whitelist)) return { is_valid: true };

//   const { values, start_with, end_with, contains, validation_sequence } = whitelist;

//   const validationSequence = validation_sequence ?? ["values", "start_with", "end_with", "contains"];
//   let isWhitelisted = false;
//   for (const check of validationSequence) {
//     switch (check) {
//       case "values":
//         if (values && values.includes(value)) {
//           isWhitelisted = true;
//         }
//         break;
//       case "start_with":
//         if (start_with && start_with.some((prefix) => value.startsWith(prefix))) {
//           isWhitelisted = true;
//         }
//         break;
//       case "end_with":
//         if (end_with && end_with.some((suffix) => value.endsWith(suffix))) {
//           isWhitelisted = true;
//         }
//         break;
//       case "contains":
//         if (contains && contains.some((substring) => value.includes(substring))) {
//           isWhitelisted = true;
//         }
//         break;
//     }
//     if (isWhitelisted) break;
//   }

//   if (!isWhitelisted) {
//     if (error_message) {
//       return {
//         is_valid: false,
//         error_message: generateErrorMessage("", [], error_message)
//       };
//     }
//     const conditions: string[] = [];
//     if (values) conditions.push(`one of "${values.join('", "')}"`);
//     if (start_with) conditions.push(`starting with "${start_with.join('", "')}"`);
//     if (end_with) conditions.push(`ending with "${end_with.join('", "')}"`);
//     if (contains) conditions.push(`containing "${contains.join('", "')}"`);

//     return {
//       is_valid: false,
//       error_message: `${error_label} should be ${conditions.join(" or ")}`
//     };
//   }

//   return { is_valid: true };
// };

// const validateWhitelistANDNew = (value: string, options: ValidateWhitelistOptions) => {
//   const { error_label, error_message, whitelist } = options;
//   if (isNil(whitelist)) return { is_valid: true };

//   const { values, start_with, end_with, contains, validation_sequence } = whitelist;

//   const validationSequence = validation_sequence ?? ["values", "start_with", "end_with", "contains"];
//   for (const check of validationSequence) {
//     switch (check) {
//       case "values":
//         if (values && !values.includes(value)) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "values",
//               values,
//               error_message ?? `${error_label} should be "${values.join('" or "')}"`
//             )
//           };
//         }
//         break;
//       case "start_with":
//         if (start_with && !start_with.some((prefix) => value.startsWith(prefix))) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "start_with",
//               start_with,
//               error_message ?? `${error_label} should start with "${start_with.join('" or "')}"`
//             )
//           };
//         }
//         break;
//       case "end_with":
//         if (end_with && !end_with.some((suffix) => value.endsWith(suffix))) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "end_with",
//               end_with,
//               error_message ?? `${error_label} should end with "${end_with.join('" or "')}"`
//             )
//           };
//         }
//         break;
//       case "contains":
//         if (contains && !contains.some((substring) => value.includes(substring))) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "contains",
//               contains,
//               error_message ?? `${error_label} should contain "${contains.join('" or "')}"`
//             )
//           };
//         }
//         break;
//     }
//   }
//   return { is_valid: true };
// };

// export const validateWhitelistNew = (value: string, options?: ValidateWhitelistOptions) => {
//   if (isNil(value) || isNil(options) || isNil(options.whitelist)) return { is_valid: true };
//   const { combine } = options.whitelist;
//   // return (combine ?? "and") === "and"
//   //   ? validateWhitelistANDNew(value, options)
//   //   : validateWhitelistORNew(value, options);
//   return validateWhitelistV2(value, options, combine ?? "AND");
// };

// const checkToValidationMap = {
//   values: (value: string, array: string[]) => array.includes(value),
//   start_with: (value: string, array: string[]) => array.some((prefix) => value.startsWith(prefix)),
//   end_with: (value: string, array: string[]) => array.some((suffix) => value.endsWith(suffix)),
//   contains: (value: string, array: string[]) => array.some((substring) => value.includes(substring))
// };

// export const validateWhitelistV2 = (value: string, options: ValidateWhitelistOptions, mode: "OR" | "AND") => {
//   const { error_label, error_message, whitelist } = options;
//   if (isNil(whitelist) || isEmpty(whitelist)) return { is_valid: true };

//   const { values, start_with, end_with, contains, validation_sequence } = whitelist;
//   const validationSequence = validation_sequence ?? ["values", "start_with", "end_with", "contains"];

//   const checkToErrorMessageMap = {
//     values: () => `should be "${values?.join('" or "')}"`,
//     start_with: () => `should start with "${start_with?.join('" or "')}"`,
//     end_with: () => `should end with "${end_with?.join('" or "')}"`,
//     contains: () => `should contain "${contains?.join('" or "')}"`
//   };

//   let isWhitelisted = mode === "OR" ? false : true;
//   let stoppedCheck: keyof CheckOptions | undefined;
//   const seenChecks = new Set<keyof CheckOptions>();

//   for (const check of validationSequence) {
//     if (isNil(whitelist[check])) continue;
//     if (seenChecks.has(check)) continue;
//     seenChecks.add(check);

//     const result = checkToValidationMap[check](value, whitelist[check]);
//     if (mode === "OR" && result) {
//       isWhitelisted = true;
//       break;
//     } else if (mode === "AND" && !result) {
//       stoppedCheck = check;
//       isWhitelisted = false;
//       break;
//     }
//   }

//   if (isWhitelisted) return { is_valid: true };

//   if (mode === "AND") {
//     return {
//       is_valid: false,
//       error_message: generateErrorMessage(
//         stoppedCheck!,
//         whitelist[stoppedCheck!]!,
//         error_message ?? `${error_label} ${checkToErrorMessageMap[stoppedCheck!]()}`
//       )
//     };
//   } else {
//     // OR mode
//     if (error_message) {
//       return {
//         is_valid: false,
//         error_message: generateErrorMessage("", [], error_message)
//       };
//     }
//     const conditions: string[] = [];
//     if (values) conditions.push(`one of "${values.join('", "')}"`);
//     if (start_with) conditions.push(`starting with "${start_with.join('", "')}"`);
//     if (end_with) conditions.push(`ending with "${end_with.join('", "')}"`);
//     if (contains) conditions.push(`containing "${contains.join('", "')}"`);

//     return {
//       is_valid: false,
//       error_message: `${error_label} should be ${conditions.join(" or ")}`
//     };
//   }
// };
