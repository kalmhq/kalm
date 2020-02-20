export const validator = () => {
  const errors = {};

  return errors;
};

export const ValidatorRequired = (
  value: any,
  _allValues?: any,
  _props?: any,
  _name?: any
) => {
  return !!value ? undefined : `Required`;
};

// https://regex101.com/r/cJ74bX/1/
export const ValidatorCPU = (value: string) => {
  if (!value || !value.match(/^\d+(mili|m)|\d+(.\d+)?$/i) || value === "0") {
    return "Invalid CPU Value";
  }

  return undefined;
};

export const ValidatorMemory = (value: string) => {
  if (
    !value ||
    !value.match(/^\d+(e\d+)?((m|m|e|p|t|g|k)i?)?$/i) ||
    value === "0"
  ) {
    return "Invalid Memory Value";
  }

  return undefined;
};

export const ValidatorSchedule = (value: string) => {
  if (
    !value ||
    !value.match(
      /^(\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?(1?[0-9]|2[0-3]))) (\*|((\*\/)?([1-9]|[12][0-9]|3[0-1]))) (\*|((\*\/)?([1-9]|1[0-2]))) (\*|((\*\/)?[0-6]))$/
    )
  ) {
    return "Invalid Schedule Rule";
  }

  return undefined;
};

export const ValidatorStringLength = () => {};
