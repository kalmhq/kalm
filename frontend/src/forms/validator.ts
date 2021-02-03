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

export const regExpIp = new RegExp(
  "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
);

// https://regex101.com/r/wG1nZ3/37
export const regExpWildcardDomain = new RegExp(/^(\*\.)?([\w-]+\.)+[a-zA-Z]+$/);

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

    if (v.length === 0) {
      return undefined;
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
export const InvalidDNS1123SubDomain = "Invalid domain";
const IsDNS1123SubDomain = string()
  .required("Required")
  .matches(new RegExp(`^${dns1123SubDomainFmt}$`), InvalidDNS1123SubDomain)
  .max(253);

const IsDNS1123SubDomainWithOptionalWildcardPrefix = string()
  .required("Required")
  .matches(new RegExp(`^(\\*\\.|\\*)?${dns1123SubDomainFmt}$`), InvalidDNS1123SubDomain)
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

export const IsOrCommonOrWildcardDNS1123SubDomain = Yup.string()
  .required("Required")
  .matches(
    new RegExp(`^(${wildcardDNS1123SubDomainFmt}|${dns1123SubDomainFmt})\\.${dns1123LabelFmt}$`),
    `Not a valid domain. Valid examples: "foo.bar"; "*.foo.bar"`,
  )
  .max(253);

const hostnameFmt = "[a-z0-9_]([-a-z0-9_]*[a-z0-9_])?";
export const InvalidHostInCertificateErrorMessage = "Invalid domain";
const IsValidHostInCertificate = Yup.string()
  .required("Required")
  .max(253)
  .matches(
    new RegExp(`^(?:\\*\\.)?(?:${hostnameFmt}\\.)*${dns1123LabelFmt}\\.${dns1123LabelFmt}$`),
    InvalidHostInCertificateErrorMessage,
  );

// ================= Kalm Validators ==================

export const ValidatorIsEnvVarName = yupValidatorWrap<string>(IsEnvVarName);
export const ValidatorIsDNS123Label = yupValidatorWrap<string>(IsDNS1123Label);
export const ValidatorIsDNS1123SubDomain = yupValidatorWrap<string>(IsDNS1123SubDomain);
export const ValidatorArrayOfIsDNS1123SubDomain = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsDNS1123SubDomain,
);

export const ValidatorArrayOfIsDNS1123SubDomainWithOptionalWildcardPrefix = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsDNS1123SubDomainWithOptionalWildcardPrefix,
);

export const ValidatorArrayOfIsValidHostInCertificate = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsValidHostInCertificate,
);

export const ValidatorIsWildcardDNS1123SubDomain = yupValidatorWrap<string>(IsWildcardDNS1123SubDomain);
export const ValidatorIsCommonOrWildcardDNS1123SubDomain = yupValidatorWrap<string>(
  IsOrCommonOrWildcardDNS1123SubDomain,
);
export const ValidatorArrayOfDIsWildcardDNS1123SubDomain = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsWildcardDNS1123SubDomain,
);

// Allowed characters in an HTTP Path as defined by RFC 3986. A HTTP path may
// contain:
// * unreserved characters (alphanumeric, '-', '.', '_', '~')
// * percent-encoded octets
// * sub-delims ("!", "$", "&", "'", "(", ")", "*", "+", ",", ";", "=")
// * a colon character (":")

export const NotValidPathPrefixError = "Not a valid path prefix";
export const NoPrefixSlashError = 'Should start with a "/"';
export const PathArrayCantBeBlankError = "Should have at least one path prefix";
export const InvalidHostError = "Host must be a valid IP address or hostname.";
export const ValidatorArrayOfPath = yupValidatorWrapForArray<string>(
  Yup.array<string>().required(PathArrayCantBeBlankError),
  Yup.string()
    .required("Path Prefix can'b be blank")
    .matches(/^\//, NoPrefixSlashError)
    .matches(/^\/[A-Za-z0-9/\-._~%!$&'()*+,;=:]*$/, NotValidPathPrefixError),
);

export const ValidatorContainerPortRequired = yupValidatorWrap<number | undefined>(
  number()
    .required("Required")
    .test("", "Can't use 443 port", (value) => value !== 443),
);

export const ValidatorPort = yupValidatorWrap<number | undefined>(
  number().test("", "Can't use 443 port", (value) => value !== 443),
);

export const ValidatorIsEmail = yupValidatorWrap<string>(string().required("Required").email("invalid email address"));

export const ValidatorRequired = yupValidatorWrap<any>(
  mixed()
    .required("Required") // mixed.required() will not validate empty string
    .test("", "Required", (value) => typeof value !== "string" || value !== ""),
);

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
    "Validate CPU",
    "The minimum support is 1m",
    (value) => value === undefined || parseFloat(`${value}`) >= 1,
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
export const ValidatorArrayNotEmpty = yupValidatorWrapForArray(
  Yup.array<any>().required("Should have at least one item"),
);

export const validateHostWithWildcardPrefix = yupValidatorWrap<string | undefined>(
  string()
    .required("Required")
    .max(511)
    .test(
      "",
      InvalidHostError,
      (value) => value === undefined || !!String(value).match(regExpIp) || !!String(value).match(regExpWildcardDomain),
    ),
);

export const ValidatorIpAndHosts = yupValidatorWrapForArray(
  Yup.array<string>().required("Required"),
  string()
    .required("Required")
    .max(511)
    .test(
      "",
      InvalidHostError,
      (value) =>
        value === undefined ||
        value === "*" ||
        !!String(value).match(regExpIp) ||
        !!String(value).match(regExpWildcardDomain),
    ),
);

export const ValidateHost = yupValidatorWrap<string | undefined>(
  string()
    .required("Required")
    .max(511)
    .test("", "Domain is invalid.", (value) => value === undefined || !!String(value).match(regExpWildcardDomain)),
);

export const ValidatorOneOfFactory = (values: any[]) => yupValidatorWrap(Yup.string().oneOf(values));

export const ValidatorEnvName = yupValidatorWrap<string>(
  string()
    .required()
    .matches(
      /^[-._a-zA-Z][-._a-zA-Z0-9]*$/,
      "Env name is invalid. regex used for validation is '[-._a-zA-Z][-._a-zA-Z0-9]*'",
    ),
);
