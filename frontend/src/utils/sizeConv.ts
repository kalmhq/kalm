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
  k: 10 ** 3,
  M: 10 ** 6,
  G: 10 ** 9,
  T: 10 ** 12,
  P: 10 ** 15,
  E: 10 ** 18,
};

export const sizeStringToNumber = (str: string) => {
  const matches = str.match(new RegExp(`^(?<value>\\d+(\\.\\d+)?)(?<unit>${Object.keys(unitMap).join("|")})?$`));
  // eg. 1.23Gi
  // matches:
  // 1.23Gi
  // 1.23
  // .23
  // Gi
  if (!matches || !matches.groups) {
    return 0;
  }

  let base = parseInt(matches.groups.value, 10);

  if (matches.groups.unit && unitMap[matches.groups.unit]) {
    base = base * unitMap[matches.groups.unit];
  }

  return base;
};

export const sizeStringToGi = (str: string) => {
  const num = sizeStringToNumber(str);
  if (num === 0) {
    return str.replace(new RegExp(Object.keys(unitMap).join("|")), "");
  }
  const GiBytes = 1024 * 1024 * 1024;
  return num / GiBytes;
};

export const sizeStringToMi = (str: string) => {
  const num = sizeStringToNumber(str);
  const MiBytes = 1024 * 1024;
  return (num / MiBytes).toFixed(0);
};
