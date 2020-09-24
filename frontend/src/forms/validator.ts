import * as Yup from "yup";
import { addMethod, ArraySchema, mixed, number, object, Schema, string, ValidationError } from "yup";

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

export const ValidatorArrayNotEmpty = (value: any[]) => {
  if (!value || value.length <= 0) {
    return "Select at least one option";
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

export const ValidatorHostsOld = (
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

// https://regex101.com/r/wG1nZ3/37
export const regExpWildcardDomain = new RegExp(/^(\*\.)?([\w-]+\.)+[a-zA-Z]+$/);

export const validateHostWithWildcardPrefix = (value: string) => {
  if (!value || value.length === 0 || value.length > 511) {
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

const yupValidatorWrap = function <T>(...v: Schema<T>[]) {
  return function (value: T) {
    let schema: Schema<T>;

    if (v.length === 1) {
      schema = v[0];
    } else {
      schema = mixed();

      for (let i = 0; i < v.length; i++) {
        schema = schema.concat(v[i]);
      }
    }

    try {
      schema.validateSync(value);
      return undefined;
    } catch (e) {
      if (!ValidationError.isError(e)) {
        throw e;
      }

      return e.errors[0] || "Unknown error";
    }
  };
};

const yupValidatorWrapForArray = function <T>(arraySchema: ArraySchema<T>, ...v: Schema<T>[]) {
  return function (values: T[]) {
    try {
      arraySchema.validateSync(values);
    } catch (e) {
      if (!ValidationError.isError(e)) {
        throw e;
      }

      return e.errors[0] || "Unknown error";
    }

    const validateFunction = yupValidatorWrap<T>(...v);

    const errors = values.map((value) => validateFunction(value));

    if (errors.findIndex((x) => !!x) < 0) {
      return undefined;
    }

    return errors;
  };
};

// Basic yup validator
const envVarNameFmt = "[-._a-zA-Z][-._a-zA-Z0-9]*";
const envVarNameFmtErrMsg =
  "a valid environment variable name must consist of alphabetic characters, digits, '_', '-', or '.', and must not start with a digit";
const IsEnvVarName = string()
  .required("Required")
  .matches(new RegExp(`^${envVarNameFmt}$`), envVarNameFmtErrMsg);

const dns1123LabelFmt = "[a-z0-9]([-a-z0-9]*[a-z0-9])?";
const IsDNS1123Label = string()
  .required("Required")
  .max(63, "Max length is 63")
  .matches(
    new RegExp(`^${dns1123LabelFmt}$`),
    "Not a valid DNS1123 label. Regex is " + new RegExp(`^${dns1123LabelFmt}$`),
  );

const dns1123SubDomainFmt = dns1123LabelFmt + "(\\." + dns1123LabelFmt + ")*";
const IsDNS1123SubDomain = string()
  .required("Required")
  .matches(new RegExp(`^${dns1123SubDomainFmt}$`), "Not a valid DNS123 SubDomain")
  .max(253);

// wildcard definition - RFC 1034 section 4.3.3.
// examples:
// - valid: *.bar.com, *.foo.bar.com
// - invalid: *.*.bar.com, *.foo.*.com, *bar.com, f*.bar.com, *
const wildcardDNS1123SubDomainFmt = "\\*\\." + dns1123SubDomainFmt;
const IsWildcardDNS1123SubDomain = Yup.string()
  .required("Required")
  .matches(new RegExp(`^${wildcardDNS1123SubDomainFmt}$`), "Not a valid wildcard DNS123 SubDomain")
  .max(253);

// const RequireString = string().required("Required");

// Kalm Validators

export const ValidatorIsEnvVarName = yupValidatorWrap<string>(IsEnvVarName);

export const ValidatorIsDNS123Label = yupValidatorWrap<string>(IsDNS1123Label);
export const ValidatorIsDNS1123SubDomain = yupValidatorWrap<string>(IsDNS1123SubDomain);
export const ValidatorArrayOfIsDNS1123SubDomain = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsDNS1123SubDomain,
);

export const ValidatorIsWildcardDNS1123SubDomain = yupValidatorWrap<string>(IsWildcardDNS1123SubDomain);
export const ValidatorArrayOfDIsWildcardDNS1123SubDomain = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsWildcardDNS1123SubDomain,
);

export const ValidatorContainerPortRequired = yupValidatorWrap<number | undefined>(
  number()
    .required("Required")
    .test("", "Can't use 443 port", (value) => value !== 443),
);

export const ValidatorPort = yupValidatorWrap<number | undefined>(
  number().test("", "Can't use 443 port", (value) => value !== 443),
);

export const ValidatorRequired = yupValidatorWrap<any>(mixed().required("Required"));

export const ValidatorVolumeSize = yupValidatorWrap<string>(
  string()
    .required("Required")
    .notOneOf(["0Gi"], "Invalid Value")
    .matches(/(^\d+(\.\d+)?)(Gi)$/, "Invalid Value"),
);

export const ValidatorMemory = yupValidatorWrap<string | undefined>(
  string()
    .notRequired()
    .notOneOf(["0Mi"], "Invalid Value")
    .matches(/(^\d+(\.\d+)?)(Mi)$/, "Invalid Value"),
);

export const ValidatorCPU = yupValidatorWrap<string | undefined>(
  string().test(
    "",
    "The minimum support is 0.001 Core",
    (value) => value === undefined || parseFloat(`${value}`) >= 0.001,
  ),
);

export const ValidatorSchedule = yupValidatorWrap<string | undefined>(
  string()
    .required("Required")
    .matches(
      /^(\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?(1?[0-9]|2[0-3]))) (\*|((\*\/)?([1-9]|[12][0-9]|3[0-1]))) (\*|((\*\/)?([1-9]|1[0-2])))$/,
      "Invalid Schedule Rule",
    ),
);

export const ValidatorInjectedFilePath = yupValidatorWrap<string | undefined>(
  string()
    .required("Required")
    .test("", 'Must be an absolute path, which starts with a "/"', (value) => !value || value.startsWith("/"))
    .test("", 'File name mush not end with "/"', (value) => !value || !value.endsWith("/")),
);

export const ValidatorRegistryHost = yupValidatorWrap<string | undefined>(
  string()
    .notRequired()
    .test("", 'Require prefix "https://"', (value) => !value || value.startsWith("https://"))
    .test("", 'Require no suffix "/"', (value) => !value || !value.endsWith("/")),
);
