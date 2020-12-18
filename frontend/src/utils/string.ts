export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const pluralize = (str: string, num: number) => {
  if (num > 1) {
    return `${num} ${str}s`;
  } else if (num === 0) {
    return `No ${str}s`;
  }
  return `${num} ${str}`;
};

export const shortness = (str: string, leading = 30) => {
  return `${str.slice(0, leading)}...`;
};
export const shortnessImage = (str: string) => {
  return str.split(":")[0];
};
