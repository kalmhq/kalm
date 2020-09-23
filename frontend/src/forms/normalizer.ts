export const NormalizeNumber = (
  value: string,
  _previousValue?: any,
  _allValues?: any,
  _previousAllValues?: any,
): number | any => {
  const integerValue = parseInt(value, 10);
  return isNaN(integerValue) ? null : integerValue;
};

export const FormikNormalizeNumber = (event: React.ChangeEvent<HTMLInputElement>): number | any => {
  const integerValue = parseInt(event.target.value, 10);
  return isNaN(integerValue) ? null : integerValue;
};

export const FormikNormalizePositiveNumber = (event: React.ChangeEvent<HTMLInputElement>): number | any => {
  const integerValue = parseInt(event.target.value, 10);

  if (integerValue < 0) {
    return 0;
  }

  return isNaN(integerValue) ? undefined : integerValue;
};

export const NormalizePositiveNumber = (value?: number | string): any => {
  if (value === undefined) {
    return;
  }

  const integerValue = parseInt(`${value}`, 10);

  if (integerValue < 0) {
    return 0 - integerValue;
  }

  return isNaN(integerValue) ? undefined : integerValue;
};

export const normalizePort = (value: string) => {
  const portInteger = parseInt(value, 10);

  if (isNaN(portInteger)) {
    return 0;
  }

  if (portInteger < 0) {
    return 0;
  }

  if (portInteger > 65535) {
    return 65535;
  }

  return portInteger;
};

export const FormikNormalizePort = (event: React.ChangeEvent<HTMLInputElement>) => {
  return normalizePort(event.target.value);
};

export const NormalizePorts = (values: string[]) => {
  return Array.from(new Set(values.map(normalizePort))).filter((x) => x <= 65535 && x > 0);
};

export const NormalizeComponentAccessGroups = (values: string[]) => {
  return values.map((x) => x.trim()).filter((x) => !!x);
};

export const NormalizeCPU = (value: string) => {
  if (!value || value === "") {
    return null;
  }

  return value;
};

export const NormalizeMemory = (value: string) => {
  if (!value || value === "") {
    return null;
  }

  while (value.length > 0 && value[0] === "0") {
    value = value.slice(1);
  }

  if (!value || value === "") {
    return null;
  }

  return value;
};

export const NormalizeBoolean = (value: string): boolean => {
  return !!value;
};

export const NormalizeHosts = (values: string[] | string, previousValue: string[]): string[] => {
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

export const NormalizeNumberOrAlphabet = (value: string): string | number => {
  const portInteger = parseInt(value, 10);
  if (isNaN(portInteger) && portInteger > 0) {
    return portInteger;
  } else {
    if (value.match(/^([a-zA-Z]*)$/)) {
      return value;
    }
  }
  return "";
};
