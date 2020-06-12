import Immutable from "immutable";
import { HttpRouteDestination } from "types/route";

export const validator = () => {
  const errors = {};

  return errors;
};

export const ValidatorListNotEmpty = (value: Immutable.List<any>, _allValues?: any, _props?: any, _name?: any) => {
  if (!value || value.size <= 0) {
    return "Select at least one option";
  }

  return undefined;
};

export const ValidatorAtLeastOneHttpRouteDestination = (
  value: Immutable.List<HttpRouteDestination>,
  _allValues?: any,
  _props?: any,
  _name?: any
) => {
  if (!value || value.size <= 0) {
    return "Please define at least one target.";
  }

  if (value.size === 1) {
    return undefined;
  }

  let valid = false;

  for (let i = 0; i < value.size; i++) {
    const target = value.get(i)!;

    if (target.get("weight") > 0) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    return "Please define at least one target with non-zero weight.";
  }

  return undefined;
};

export const ValidatorRequired = (value: any, _allValues?: any, _props?: any, _name?: any) => {
  // After delete an item of an array, the validator is still invoked.
  // The value is undefined.
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? undefined : "Required";
  }

  if (Immutable.isList(value)) {
    return value.size > 0 ? undefined : "Required";
  }

  return !!value ? undefined : `Required`;
};

export const ValidatorNumberOrAlphabet = (value: any, _allValues?: any, _props?: any, _name?: any) => {
  const portInteger = parseInt(value, 10);
  if (isNaN(portInteger) && portInteger > 0) {
    if (portInteger.toString().length !== value.toString().length) {
      return "Not a valid port value";
    }
    return undefined;
  } else {
    if (value.match && value.match(/^([a-zA-Z]*)$/)) {
      return undefined;
    }
  }
  return "Not a valid port value";
};

export const ValidatorOneof = (...options: (string | RegExp)[]) => {
  return (value: string) => {
    if (!value) return undefined;

    for (let i = 0; i < options.length; i++) {
      if (typeof options[i] === "string" && value === options[i]) {
        return undefined;
      } else if (
        typeof options[i] === "object" &&
        options[i].constructor.name === "RegExp" &&
        value.match(options[i])
      ) {
        return undefined;
      }
    }

    return `Must be one of ${options.map(x => x.toString()).join(", ")}`;
  };
};

export const ValidatorName = (value: string) => {
  if (!value) return undefined;

  if (!value.match(/^[a-zA-Z0-9.-]*$/i) || value === "0") {
    return "Invalid Name Value";
  }

  return undefined;
};

export const ValidatorHttpHeaders = (value: any) => {
  if (!value) return undefined;

  if (typeof value === "string") {
    return "Invalid JSON";
  }

  return undefined;
};

// https://regex101.com/r/cJ74bX/1/
export const ValidatorCPU = (value: string) => {
  if (!value) return undefined;

  if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/i) || value === "0") {
    return "Invalid CPU Value";
  }

  return undefined;
};

export const ValidatorMemory = (value: string) => {
  if (!value) return undefined;

  if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/i) || value === "0") {
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

const validateHost = (value: string) => {
  if (value.length === 0 || value.length > 511) {
    return "Host length must be between 1 and 511 characters.";
  }

  var regExpIp = new RegExp(
    "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
  );
  var regResultIp = regExpIp.exec(value);
  var regExpHostname = new RegExp(
    /^(\*\.)?(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
  ); // RFC 1123 but allow "*." prefix

  var regResultHostname = regExpHostname.exec(value);
  if (regResultIp === null && regResultHostname === null) {
    return "Host must be a valid IP address or hostname.";
  }

  return undefined;
};

export const KValidatorHosts = (
  values: Immutable.List<string>,
  _allValues?: any,
  _props?: any,
  _name?: any
): (undefined | string)[] | undefined => {
  if (!values || values.size === 0) {
    return undefined;
  }

  const errors = values.map(host => (host === "*" ? undefined : validateHost(host))).toArray();

  return errors.filter(x => !!x).length > 0 ? errors : undefined;
};

export const KValidatorInjectedFilePath = (value: string, _allValues?: any, _props?: any, _name?: any) => {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/")) return 'Must be an absolute path, which starts with a "/"';
  if (value.endsWith("/")) return 'File name mush not end with "/"';

  return undefined;
};

export const KValidatorPaths = (
  values: Immutable.List<string>,
  _allValues?: any,
  _props?: any,
  _name?: any
): (undefined | string)[] | undefined => {
  if (!values) {
    return undefined;
  }

  const errors = values.map(x => (x.startsWith("/") ? undefined : 'path should start with a "/"')).toArray();

  return errors.filter(x => !!x).length > 0 ? errors : undefined;
};

export const ValidatorEnvName = (value: string) => {
  if (value === undefined) return undefined;

  if (!value.match(/^[-._a-zA-Z][-._a-zA-Z0-9]*$/)) {
    return "Env name is invalid. regex used for validation is '[-._a-zA-Z][-._a-zA-Z0-9]*'";
  }

  return undefined;
};

export const ValidatorServiceName = (value: string) => {
  if (value === undefined) return undefined;

  if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/)) {
    return `Port name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character. (e.g. 'my-name',  or '123-abc', regex used for validation is '[a-z0-9]([-a-z0-9]*[a-z0-9])?')`;
  }

  return undefined;
};
