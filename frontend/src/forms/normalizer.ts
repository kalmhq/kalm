import { sizeStringToGi, sizeStringToMi, sizeStringToNumber } from "utils/sizeConv";

export const NormalizeNumber = (value: string): number | any => {
  const integerValue = parseInt(value, 10);
  return isNaN(integerValue) ? null : integerValue;
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
    return undefined;
  }

  if (portInteger < 0) {
    return 0;
  }

  if (portInteger > 65535) {
    return 65535;
  }

  return portInteger;
};

export const NormalizePorts = (values: string[]) => {
  return Array.from(new Set(values.map(normalizePort))).filter((x) => x !== undefined && x <= 65535 && x > 0);
};

export const stringArrayTrimParse = (values: string[]) => {
  return values.map((x) => x.trim()).filter((x) => !!x);
};

export const stringArrayTrimAndToLowerCaseParse = (values: string[]) => {
  return values.map((x) => x.trim().toLowerCase()).filter((x) => !!x);
};

export const NormalizeString = (value: string) => {
  return value.trim();
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

export const diskSizeFormat = (value: any) => {
  return !value ? "" : sizeStringToGi(value);
};

export const diskSizeParse = (value: any) => {
  if (!value) {
    return "";
  }
  const valueNum = parseFloat(value);
  if (isNaN(valueNum)) {
    return "";
  }
  if (valueNum < 0) {
    return String(0 - valueNum) + "Gi";
  }
  if (value.endsWith("0") || value.endsWith(".")) {
    return value + "Gi";
  }
  return valueNum + "Gi";
};

export const memoryFormat = (value: any) => {
  return !value ? "" : sizeStringToMi(value);
};

export const memoryParse = (value: any) => {
  if (!value) {
    return undefined;
  }
  const valueNum = parseFloat(value);
  if (isNaN(valueNum)) {
    return "";
  }
  if (valueNum < 0) {
    return String(0 - valueNum) + "Mi";
  }
  if (value.endsWith("0") || value.endsWith(".")) {
    return value + "Mi";
  }
  return valueNum + "Mi";
};

export const cpuFormat = (value: any) => {
  if (!value) {
    return "";
  }
  if (value.endsWith("m")) {
    return value.replace("m", "");
  }
  return (sizeStringToNumber(value) * 1000).toFixed();
};

export const cpuParse = (value: any) => {
  if (!value) {
    return undefined;
  }

  const valueNum = parseFloat(value);

  if (isNaN(valueNum)) {
    return undefined;
  }

  if (valueNum < 0) {
    return String(0 - valueNum) + "m";
  }

  if (value.endsWith("0") || value.endsWith(".")) {
    return value + "m";
  }

  return valueNum + "m";
};

export const toLowerCaseStringParse = (value: string) => {
  if (!value) return value;
  return value.toLowerCase();
};

export const trimParse = (value: string) => {
  if (!value) return value;
  return value.trim();
};

interface StringParser {
  (value: string): string;
}

export const combineParsers = function (...fns: StringParser[]): StringParser {
  return function (value: string) {
    for (let i = 0; i < fns.length; i++) {
      value = fns[i](value);
    }

    return value;
  };
};

export const trimAndToLowerParse = combineParsers(trimParse, toLowerCaseStringParse);

// a.com -> a.com
// *.foo.bar -> .foo.bar
// *alice.foo.bar -> --alice.foo.bar
export const normalizeWildcardDomain = (domain: string) => {
  if (domain.startsWith("*")) {
    if (domain.length > 1 && domain[1] !== ".") {
      return "--" + domain.slice(1);
    } else {
      return domain.slice(1);
    }
  }

  return domain;
};
