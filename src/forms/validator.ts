export const validator = () => {
  const errors = {};

  return errors;
};

export const ValidatorRequired = (
  value: any,
  _allValues?: any,
  _props?: any,
  _name?: any
) => {
  return value ? undefined : `Required`;
};

export const ValidatorStringLength = () => {};
