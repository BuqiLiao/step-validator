// import { isNil } from "lodash-es";
// import { isWhitelistedString } from "./whitelist.js";
// import type { ListOptions } from "@/types.js";

// interface ValidateBlacklistOptions {
//   blacklist?: ListOptions;
//   error_label?: string;
//   error_message?: string | ((type: string, expected_values: string[]) => string);
// }

// export const isBlacklistedString = (value: string, options?: ValidateBlacklistOptions) => {
//   if (!isString(value)) {
//     throw new Error("Value must be a string");
//   }
//   if (!isNil(options) && !isObject(options)) {
//     throw new Error("Options must be an object");
//   }
//   if (isEmpty(value) || isEmpty(options)) return { is_valid: true };

//   const { error_label, error_message, whitelist } = options;
//   if (!isObject(whitelist)) {
//     throw new Error("Whitelist must be an object");
//   }
//   if (isEmpty(whitelist)) return { is_valid: true };

//   const { combination = "AND", validation_sequence } = whitelist;
//   if (combination !== "AND" && combination !== "OR") {
//     throw new Error('Combine must be either "AND" or "OR"');
//   }
//   const validationSequence = validation_sequence ?? ["values", "starts_with", "ends_with", "contains"];

//   let isWhitelisted = combination === "OR" ? false : true;
//   const actualSequence: (keyof CheckOptions)[] = [];
//   const seenChecks = new Set<keyof CheckOptions>();

//   for (const check of validationSequence) {
//     if (isNil(whitelist[check]) || isEmpty(whitelist[check])) continue;
//     if (seenChecks.has(check)) continue;
//     seenChecks.add(check);
//     actualSequence.push(check);

//     const result = checkToValidationMap[check](value, whitelist[check]);
//     if (combination === "OR" && result) {
//       isWhitelisted = true;
//       break;
//     } else if (combination === "AND" && !result) {
//       isWhitelisted = false;
//       break;
//     }
//   }

//   if (isWhitelisted) return { is_valid: true, actual_sequence: actualSequence };

//   if (combination === "AND") {
//     const lastCheck = actualSequence[actualSequence.length - 1];
//     return {
//       is_valid: false,
//       actual_sequence: actualSequence,
//       error_message: generateErrorMessage(
//         lastCheck,
//         whitelist[lastCheck]!,
//         error_message ?? `${error_label} should ${checkToPhraseMap[lastCheck]} "${whitelist[lastCheck]?.join('"or "')}"`
//       )
//     };
//   } else {
//     // OR mode
//     if (actualSequence.length === 0) return { is_valid: true };
//     if (error_message) {
//       return {
//         is_valid: false,
//         actual_sequence: actualSequence,
//         error_message: generateErrorMessage("", [], error_message)
//       };
//     }
//     const conditions: string[] = [];
//     for (const check of actualSequence) {
//       conditions.push(`should ${checkToPhraseMap[check]} "${whitelist[check]?.join('", "')}"`);
//     }
//     return {
//       is_valid: false,
//       actual_sequence: actualSequence,
//       error_message: `${error_label} ${conditions.join(" or ")}`
//     };
//   }
// };
