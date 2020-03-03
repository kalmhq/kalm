export const validator = () => {
  const errors = {};

  return errors;
};

export const ValidatorRequired = (value: any, _allValues?: any, _props?: any, _name?: any) => {
  return !!value ? undefined : `Required`;
};

// https://regex101.com/r/cJ74bX/1/
export const ValidatorCPU = (value: string) => {
  if (!value) return undefined;

  if (!value.match(/^\d+(mili|m)|\d+(.\d+)?$/i) || value === "0") {
    return "Invalid CPU Value";
  }

  return undefined;
};

export const ValidatorMemory = (value: string) => {
  if (!value) return undefined;

  if (!value.match(/^\d+(e\d+)?((m|m|e|p|t|g|k)i?)?$/i) || value === "0") {
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
    /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
  ); // RFC 1123

  var regResultHostname = regExpHostname.exec(value);
  if (regResultIp === null && regResultHostname === null) {
    return "Host must be a valid IP address or hostname.";
  }

  return undefined;
};

export const ValidatorHosts = (values: string[]): (string | undefined)[] | string | undefined => {
  // console.log("ValidatorHosts", values);
  if (!values || (Array.isArray(values) && values.length === 0)) return "Required";
  // console.log("ValidatorHosts2", values);
  const errors = values.map(x => {
    const res = validateHost(x);
    // console.log("ValidatorHost", x, res);
    return res;
  });

  return errors.filter(x => !!x).length > 0 ? errors : undefined;
};
