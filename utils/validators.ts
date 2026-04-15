export const isValidBloodSugar = (val: number): boolean =>
  val >= 20 && val <= 600;

export const isValidCarbs = (val: number): boolean =>
  val >= 0 && val <= 500;

export const isValidAge = (val: number): boolean =>
  val >= 1 && val <= 120;

export const isValidInsulin = (val: number): boolean =>
  val >= 0 && val <= 300;

export const isValidDuration = (val: number): boolean =>
  val > 0 && val <= 600;

export const isValidTargetRange = (min: number, max: number): boolean =>
  min >= 40 && max <= 400 && min < max;

export type BloodSugarAlert =
  | 'critical-low'
  | 'low'
  | 'in-range'
  | 'high'
  | 'critical-high';

export const getBloodSugarAlert = (
  reading: number,
  min: number,
  max: number
): BloodSugarAlert => {
  if (reading < 54) return 'critical-low';
  if (reading < min) return 'low';
  if (reading > 400) return 'critical-high';
  if (reading > max) return 'high';
  return 'in-range';
};
