export const NormalizePort = (
  value: string,
  _previousValue?: any,
  _allValues?: any,
  _previousAllValues?: any
): number => {
  const portInteger = parseInt(value, 10);

  if (portInteger < 1) {
    return 1;
  }

  if (portInteger > 65535) {
    return 65535;
  }

  return portInteger;
};
