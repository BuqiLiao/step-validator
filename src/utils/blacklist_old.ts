// import { isNil } from "lodash-es";
// import { validateCondition, isInRange, hostTypeValidationMap } from "./validators.js";
// import type { HostType, BaseOptions } from "@/types.js";

// const validateBlacklistAND = (title: string, value: string, blacklist: any) => {
//   const isBlacklisted =
//     blacklist.values &&
//     blacklist.values.includes(value) &&
//     blacklist.types &&
//     blacklist.types.some((type: HostType) => hostTypeValidationMap[type]?.(value)) &&
//     blacklist.start_with &&
//     blacklist.start_with.some((prefix: string) => value.startsWith(prefix)) &&
//     blacklist.end_with &&
//     blacklist.end_with.some((suffix: string) => value.endsWith(suffix)) &&
//     blacklist.contains &&
//     blacklist.contains.some((substring: string) => value.includes(substring)) &&
//     blacklist.interval &&
//     isInRange(parseInt(value), blacklist.interval);

//   if (!isBlacklisted) {
//     const conditions: string[] = [];
//     if (blacklist.values) conditions.push(`one of "${blacklist.values.join('", "')}"`);
//     if (blacklist.types) conditions.push(`of type "${blacklist.types.join('", "')}"`);
//     if (blacklist.start_with) conditions.push(`starting with "${blacklist.start_with.join('", "')}"`);
//     if (blacklist.end_with) conditions.push(`ending with "${blacklist.end_with.join('", "')}"`);
//     if (blacklist.contains) conditions.push(`containing "${blacklist.contains.join('", "')}"`);
//     if (blacklist.interval) conditions.push(`between ${blacklist.interval[0]} and ${blacklist.interval[1]}`);

//     throw new Error(`${title} should not be ${conditions.join(" and ")}`);
//   }
// };

// const validateBlacklistOR = (title: string, value: string, blacklist: any) => {
//   const { values, types, start_with, end_with, contains, interval } = blacklist;

//   values && validateCondition(!values.includes(value), `${title} should not be "${values.join('" or "')}"`);
//   types &&
//     validateCondition(
//       !types.some((type: HostType) => hostTypeValidationMap[type]?.(value)),
//       `${title} should not be of type "${types.join('" or "')}"`
//     );
//   start_with &&
//     validateCondition(
//       !start_with.some((prefix: string) => value.startsWith(prefix)),
//       `${title} should not start with "${start_with.join('" or "')}"`
//     );
//   end_with &&
//     validateCondition(
//       !end_with.some((suffix: string) => value.endsWith(suffix)),
//       `${title} should not end with "${end_with.join('" or "')}"`
//     );
//   contains &&
//     validateCondition(
//       !contains.some((substring: string) => value.includes(substring)),
//       `${title} should not contain "${contains.join('" or "')}"`
//     );
//   interval &&
//     validateCondition(
//       !isInRange(parseInt(value), interval),
//       `${title} should not be between ${interval[0]} and ${interval[1]}`
//     );
// };

// export const validateBlacklist = (title: string, value: string, blacklist?: any) => {
//   if (isNil(blacklist) || isNil(value)) return;
//   const combine = blacklist?.combine || "or";
//   combine === "and" ? validateBlacklistAND(title, value, blacklist) : validateBlacklistOR(title, value, blacklist);
// };

// interface ValidateWhitelistOptions {
//   blacklist: BaseOptions;
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

// const validateBlacklistANDNew = (value: string, options: ValidateWhitelistOptions) => {
//   const { blacklist, error_label, error_message } = options;
//   if (isNil(blacklist)) return { is_valid: true };

//   const { values, start_with, end_with, contains, validation_sequence } = blacklist;

//   const validationSequence = validation_sequence ?? ["values", "start_with", "end_with", "contains"];
//   for (const check of validationSequence) {
//     switch (check) {
//       case "values":
//         if (values && values.includes(value)) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "values",
//               values,
//               error_message ?? `${error_label} should not be "${values.join('" or "')}"`
//             )
//           };
//         }
//         break;
//       case "start_with":
//         if (start_with && start_with.some((prefix) => value.startsWith(prefix))) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "start_with",
//               start_with,
//               error_message ?? `${error_label} should not start with "${start_with.join('" or "')}"`
//             )
//           };
//         }
//         break;
//       case "end_with":
//         if (end_with && end_with.some((suffix) => value.endsWith(suffix))) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "end_with",
//               end_with,
//               error_message ?? `${error_label} should not end with "${end_with.join('" or "')}"`
//             )
//           };
//         }
//         break;
//       case "contains":
//         if (contains && contains.some((substring) => value.includes(substring))) {
//           return {
//             is_valid: false,
//             error_message: generateErrorMessage(
//               "contains",
//               contains,
//               error_message ?? `${error_label} should not contain "${contains.join('" or "')}"`
//             )
//           };
//         }
//         break;
//     }
//   }

//   return { is_valid: true };
// };

// export const validateBlacklistNew = (value: string, options?: ValidateWhitelistOptions) => {
//   if (isNil(value) || isNil(options) || isNil(options.blacklist)) return { is_valid: true };
//   const { combine } = options.blacklist;
//   return (combine ?? "and") === "and"
//     ? validateBlacklistANDNew(value, options)
//     : validateWhitelistORNew(value, options);
// };
