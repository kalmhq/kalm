export const humanFileSize = (bytes: number, si = false, dp = 2) => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes.toFixed(dp) + " B";
  }

  const units = si ? ["k", "M", "G", "T", "P", "E", "Z", "Y"] : ["Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + " " + units[u];
};

const unitMap: { [key: string]: number } = {
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60,
  m: 0.001,
  u: 0.001 ** 2,
  k: 10 ** 3,
  M: 10 ** 6,
  G: 10 ** 9,
  T: 10 ** 12,
  P: 10 ** 15,
  E: 10 ** 18,
};

export const sizeStringToNumber = (str: string) => {
  const matches = str.match(new RegExp(`^(?<value>\\d+(\\.\\d+)?)(?<unit>${Object.keys(unitMap).join("|")})?$`));

  if (!matches || !matches.groups) {
    return 0;
  }

  let base = parseFloat(matches.groups.value);
  if (matches.groups.unit && unitMap[matches.groups.unit]) {
    base = base * unitMap[matches.groups.unit];
  }

  return base;
};

export const sizeStringToGi = (str: string) => {
  if (str.endsWith("Gi")) {
    return str.replace("Gi", "");
  }
  const num = sizeStringToNumber(str);
  if (num === 0) {
    return str.replace(new RegExp(Object.keys(unitMap).join("|")), "");
  }
  const GiBytes = 1024 * 1024 * 1024;
  return num / GiBytes;
};

export const sizeStringToMi = (str: string) => {
  if (str.endsWith("Mi")) {
    return str.replace("Mi", "");
  }
  const num = sizeStringToNumber(str);
  const MiBytes = 1024 * 1024;
  return num / MiBytes;
};

export const formatMemory = (value: number, si?: boolean): string => {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(value) < thresh) {
    return value + " B";
  }
  const units = si ? ["k", "M", "G", "T", "P", "E", "Z", "Y"] : ["Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"];
  let u = -1;
  do {
    value /= thresh;
    ++u;
  } while (Math.abs(value) >= thresh && u < units.length - 1);
  return value.toFixed(1) + " " + units[u];

  // const MiBytes = 1024 * 1024;
  // return (value / MiBytes).toFixed(0) + " Mi";
};

export const formatCPU = (value: number): string => {
  value = parseInt(`${value}`);

  if (value < 1000) {
    return value + " m";
  }

  return value / 1000 + " Core";
};
