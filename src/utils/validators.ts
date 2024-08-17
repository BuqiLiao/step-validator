import validator from 'validator';
import type { HostType } from "../../types/index.js";

export const hostTypeValidationMap: { [key in HostType]?: (value: string) => boolean } = {
  FQDN: (value) => validator.isFQDN(value),
  ipv4: (value) => validator.isIP(value, 4),
  ipv6: (value) => validator.isIP(value, 6)
};

export const validateCondition = (condition: boolean, errMsg: string) => {
  if (!condition) {
    throw new Error(errMsg);
  }
};

export const isInRange = (value: number, range: [number, number]) => {
  if (value < range[0] || value > range[1]) {
    return false;
  }
  return true;
};
