import React from "react";
import { connect, FormikContextType, FormikState, SharedRenderProps, FormikProps } from "formik";
import Immutable from "immutable";

// https://github.com/formium/formik/blob/master/packages/formik/src/FieldArray.tsx

export const isEmptyArray = (value?: any) => Array.isArray(value) && value.length === 0;

export const isEmptyChildren = (children: any): boolean => React.Children.count(children) === 0;

export type FieldArrayRenderProps = ArrayHelpers & {
  form: FormikProps<any>;
  name: string;
};

export type FieldArrayConfig = {
  /** Really the path to the array field to be updated */
  name: string;
  /** Should field array validate the form AFTER array updates/changes? */
  validateOnChange?: boolean;
} & SharedRenderProps<FieldArrayRenderProps>;
export interface ArrayHelpers {
  push: (obj: any) => void;
  handlePush: (obj: any) => () => void;
  handleRemove: (index: number) => () => void;
  remove<T>(index: number): T | undefined;
}

class FieldArrayInner<Values = {}> extends React.Component<
  FieldArrayConfig & { formik: FormikContextType<Values> },
  {}
> {
  static defaultProps = {
    validateOnChange: true,
  };

  constructor(props: FieldArrayConfig & { formik: FormikContextType<Values> }) {
    super(props);
    // We need TypeScript generics on these, so we'll bind them in the constructor
    // @todo Fix TS 3.2.1
    this.remove = this.remove.bind(this) as any;
  }

  componentDidUpdate(prevProps: FieldArrayConfig & { formik: FormikContextType<Values> }) {
    if (
      // @ts-ignore
      !prevProps.formik.values[prevProps.name].equals(this.props.formik.values[this.props.name]) &&
      this.props.formik.validateOnChange
    ) {
      this.props.formik.validateForm(this.props.formik.values);
    }
  }

  updateArrayField = (fn: Function, alterTouched: boolean | Function, alterErrors: boolean | Function) => {
    const {
      name,

      formik: { setFormikState },
    } = this.props;
    setFormikState((prevState: FormikState<any>) => {
      let updateErrors = typeof alterErrors === "function" ? alterErrors : fn;
      let updateTouched = typeof alterTouched === "function" ? alterTouched : fn;

      // values fn should be executed before updateErrors and updateTouched,
      // otherwise it causes an error with unshift.
      let values = { ...prevState.values };
      values[name] = fn(prevState.values[name]);

      let fieldError = alterErrors ? updateErrors(prevState.errors[name]) : undefined;
      let fieldTouched = alterTouched ? updateTouched(prevState.touched[name]) : undefined;

      if (isEmptyArray(fieldError)) {
        fieldError = undefined;
      }
      if (isEmptyArray(fieldTouched)) {
        fieldTouched = undefined;
      }

      let errors = prevState.errors;
      if (alterErrors) {
        errors = { ...prevState.errors };
        errors[name] = fieldError;
      }

      let touched = prevState.touched;
      if (alterTouched) {
        touched = { ...prevState.touched };
        touched[name] = fieldTouched;
      }

      return {
        ...prevState,
        values,
        errors,
        touched,
      };
    });
  };

  push = (value: any) => this.updateArrayField((list: Immutable.List<any>) => list.push(value), false, false);

  handlePush = (value: any) => () => this.push(value);

  remove<T>(index: number): T {
    // We need to make sure we also remove relevant pieces of `touched` and `errors`
    let result: any;
    this.updateArrayField(
      // so this gets call 3 times
      (list?: Immutable.List<any>) => {
        result = list?.get(index);
        return list?.delete(index);
      },
      true,
      true,
    );

    return result as T;
  }

  handleRemove = (index: number) => () => this.remove<any>(index);

  render() {
    const arrayHelpers: ArrayHelpers = {
      push: this.push,
      handlePush: this.handlePush,
      remove: this.remove,
      handleRemove: this.handleRemove,
    };

    const {
      component,
      render,
      children,
      name,
      formik: { validate: _validate, validationSchema: _validationSchema, ...restOfFormik },
    } = this.props;

    const props: FieldArrayRenderProps = {
      ...arrayHelpers,
      form: restOfFormik,
      name,
    };

    return component
      ? React.createElement(component as any, props)
      : render
      ? (render as any)(props)
      : children // children come last, always called
      ? typeof children === "function"
        ? (children as any)(props)
        : !isEmptyChildren(children)
        ? React.Children.only(children)
        : null
      : null;
  }
}

export const ImmutableFieldArray = connect<FieldArrayConfig, any>(FieldArrayInner);
