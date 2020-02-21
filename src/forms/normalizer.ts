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
