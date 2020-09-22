import { HttpRoute, HttpRouteDestination } from "types/route";
import sc from "utils/stringConstants";
import { addMethod, array, object, string } from "yup";

addMethod(object, "unique", function (propertyName, message) {
  //@ts-ignore
  return this.test("unique", message, function (value) {
    if (!value || !value[propertyName]) {
      return true;
    }

    //@ts-ignore
    const { path } = this;
    //@ts-ignore
    const options = [...this.parent];
    const currentIndex = options.indexOf(value);

    const subOptions = options.slice(0, currentIndex);

    if (subOptions.some((option) => option[propertyName] === value[propertyName])) {
      //@ts-ignore
      throw this.createError({
        path: `${path}.${propertyName}`,
        message,
      });
    }

    return true;
  });
});

export const validator = () => {
  const errors = {};

  return errors;
};

export const ValidatorListNotEmpty = (value: Array<any>) => {
  if (!value || value.length <= 0) {
    return "Select at least one option";
  }

  return undefined;
};

export const ValidatorArrayNotEmpty = (value: any[]) => {
  if (!value || value.length <= 0) {
    return "Select at least one option";
  }

  return undefined;
};

export const ValidatorHttpRouteDestinations = (
  value: Array<HttpRouteDestination>,
  _allValues?: HttpRoute,
  _props?: any,
  _name?: any,
) => {
  if (!value || value.length <= 0) {
    return "Please define at least one target.";
  }

  if (value.length === 1) {
    return undefined;
  }

  let valid = false;

  for (let i = 0; i < value.length; i++) {
    const target = value[i]!;

    if (target.weight > 0) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    return "Please define at least one target with non-zero weight.";
  }

  return undefined;
};

export const ValidatorRequired = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? undefined : "Required";
  }

  return !!value || value === 0 ? undefined : `Required`;
};

export const ValidatorContainerPortRequired = (value: any) => {
  if (!!value !== undefined) {
    const portInteger = parseInt(value, 10);

    if (portInteger === 443) {
      return `Can't use 443 port`;
    }
  }

  return !!value ? undefined : `Required`;
};

export const ValidatorPort = (value: any) => {
  if (!!value !== undefined) {
    const portInteger = parseInt(value, 10);

    if (portInteger === 443) {
      return `Can't use 443 port`;
    }
  }
  return undefined;
};

export const validatePorts = (values?: number[]) => {
  console.log("formik validate ports");

  if (!values || values.length === 0) {
    return undefined;
  }

  const errors = values.map((port) => {
    if (!port) {
      return "Invalid port";
    }

    return port > 65535 || port <= 0 ? "Port should be in range of (0,65536)" : undefined;
  });

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export const ValidatorNumberOrAlphabet = (value: any) => {
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

export const ValidatorNaturalNumber = (value: string) => {
  if (!value) return undefined;

  const integerValue = parseInt(value, 10);
  if (isNaN(integerValue)) {
    return undefined;
  }

  if (integerValue < 0) {
    return 'Number can\'t be negative';
  }

  return undefined;
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

    return `Must be one of ${options.map((x) => x.toString()).join(", ")}`;
  };
};

export const ValidatorVolumeSize = (value: string) => {
  if (!value) return "Required";

  if (value === "Gi") {
    return "Required";
  }

  if (!value.match(new RegExp(`(^\\d+(\\.\\d+)?)([eEinumkKMGTP]*[-+]?[0-9]*)$`)) || value === "0Gi") {
    return "Invalid Value";
  }
  // if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/) || value === "0") {
  //   return "Invalid Value";
  // }

  return undefined;
};

export const ValidatorName = (value: string) => {
  if (!value) return "Required";

  if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/) || value === "0") {
    return sc.NAME_RULE;
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
export const ValidatorCPU = (value: number) => {
  if (!value) return undefined;

  if (parseFloat(`${value}`) < 0.001) {
    return "The minimum support is 0.001 Core";
  }

  // if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/) || value === "0") {
  //   return "Invalid CPU Value";
  // }

  return undefined;
};

export const ValidatorMemory = (value: string) => {
  if (!value) return undefined;

  if (value === "Gi") {
    return "Required";
  }

  // if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/) || value === "0") {
  //   return "Invalid Memory Value";
  // }

  return undefined;
};

export const ValidatorSchedule = (value: string) => {
  if (
    !value ||
    !value.match(
      /^(\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?(1?[0-9]|2[0-3]))) (\*|((\*\/)?([1-9]|[12][0-9]|3[0-1]))) (\*|((\*\/)?([1-9]|1[0-2])))$/,
    )
  ) {
    return "Invalid Schedule Rule";
  }

  return undefined;
};

export const ValidatorStringLength = () => {};

export const ValidateHost = (value: string) => {
  if (!value) return "Required";

  if (value.length === 0 || value.length > 511) {
    return "Host length must be between 1 and 511 characters.";
  }

  let regResultWildcardname = regExpWildcardDomain.exec(value);
  if (regResultWildcardname === null) {
    return "Domain is invalid.";
  }

  return undefined;
};

export const ValidatorHosts = (
  values: string[],
  _allValues?: any,
  _props?: any,
  _name?: any,
): string | (undefined | string)[] | undefined => {
  if (!values || values.length === 0) {
    return "Required";
  }

  const errors = values.map((host) => (host === "*" ? undefined : ValidateHost(host)));

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export const regExpIp = new RegExp(
  "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
);

// correct:
// *.test.com
// test.com
// abc.test.com
// 1.2.3.4.com
// *.1.2.2.3.4.com
// Incorrect:
// *test.com
// test.com*
// test.*.com
// test.abc*.com
export const regExpWildcardDomain = new RegExp(/^(\*\.)?([\w]+\.)+[a-zA-Z]+$/);

const validateHostWithWildcardPrefix = (value: string) => {
  if (value.length === 0 || value.length > 511) {
    return "Host length must be between 1 and 511 characters.";
  }

  let regResultIp = regExpIp.exec(value);
  let regResultWildcardname = regExpWildcardDomain.exec(value);
  if (regResultIp === null && regResultWildcardname == null) {
    return "Host must be a valid IP address or hostname.";
  }

  return undefined;
};

export const ValidatorIpAndHosts = (
  values: string[],
  _allValues?: any,
  _props?: any,
  _name?: any,
): string | (undefined | string)[] | undefined => {
  if (!values || values.length === 0) {
    return "Required";
  }

  const errors = values.map((host) => (host === "*" ? undefined : validateHostWithWildcardPrefix(host)));

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export const KValidatorInjectedFilePath = (value: string) => {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/")) return 'Must be an absolute path, which starts with a "/"';
  if (value.endsWith("/")) return 'File name mush not end with "/"';

  return undefined;
};

export const KValidatorPaths = (
  values: string[],
  _allValues?: any,
  _props?: any,
  _name?: any,
): string | (undefined | string)[] | undefined => {
  if (!values || values.length === 0) {
    return "Required";
  }

  const errors = values.map((x) => (x.startsWith("/") ? undefined : 'path should start with a "/"'));

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
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

export const RequirePrefix = (prefix: string) => (value: string) => {
  if (value === undefined) return undefined;
  if (!value.startsWith(prefix)) return `Require prefix "${prefix}"`;
  return undefined;
};

export const RequireNoSuffix = (suffix: string) => (value: string) => {
  if (value === undefined) return undefined;
  if (value.endsWith(suffix)) return `Require no suffix "${suffix}"`;
  return undefined;
};

export const RequireString = string().required("Required");

export const RequireArray = array().min(1, "Required");
