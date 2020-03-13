export const NormalizePort = (
  value: string,
  _previousValue?: any,
  _allValues?: any,
  _previousAllValues?: any
): number => {
  const portInteger = parseInt(value, 10);

  if (portInteger < 1) {
    return 1;
  }

  if (portInteger > 65535) {
    return 65535;
  }

  return portInteger;
};

export const NormalizeNumber = (
  value: string,
  _previousValue?: any,
  _allValues?: any,
  _previousAllValues?: any
): number => {
  return parseInt(value, 10);
};

export const NormalizeCPU = (value: string): string => {
  if (!value || value === "0") {
    return "0";
  }

  while (value.length > 1 && value[0] === "0" && value[1] !== ".") {
    value = value.slice(1);
  }

  return value;
};

export const NormalizeMemory = (value: string): string => {
  if (!value || value === "0") {
    return "0";
  }

  while (value.length > 0 && value[0] === "0") {
    value = value.slice(1);
  }

  return value;
};

export const NormalizeBoolean = (value: string): boolean => {
  return !!value;
};

export const NormalizeHosts = (values: string[] | string, previousValue: string[]): string[] => {
  console.log("NormalizeHosts", values, "isArray", Array.isArray(values), previousValue);
  // only if no tags in autocomplete but unsubmit text in input field

  let res;
  if (!Array.isArray(values)) {
    res = previousValue;
  } else {
    res = values;
  }
  // console.log("res", res);
  return res;
};
