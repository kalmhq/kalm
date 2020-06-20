// redux form doesn't run sync validate function when the props passed by parent changed by default
// Use this function to overwrite default one to trigger sync validation when props changed
// https://redux-form.com/8.3.0/docs/api/reduxform.md/#-code-shoulderror-params-boolean-code-optional-
export const shouldError = (formProps: any): boolean => {
  const { values, nextProps, props, initialRender, lastFieldValidatorKeys, fieldValidatorKeys, structure } = formProps;

  if (initialRender) {
    return true;
  }

  return (
    !structure.deepEqual(props, nextProps) ||
    !structure.deepEqual(values, nextProps && nextProps.values) ||
    !structure.deepEqual(lastFieldValidatorKeys, fieldValidatorKeys)
  );
};
