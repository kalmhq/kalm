import React from "react";
import { RootState } from "reducers";
import { FilledTextFieldProps } from "@material-ui/core";
import { getIsDisplayDebounceError } from "selectors/debounce";
import { connect } from "react-redux";
import { setDebouncing } from "actions/debounce";
import { TDispatchProp } from "types";
import { FieldProps, getIn } from "formik";

const mapStateToProps = (state: RootState, ownProps: FilledTextFieldProps & FieldProps) => {
  const {
    field: { name },
    form: { touched, errors },
  } = ownProps;
  const isDisplayDebounceError = getIsDisplayDebounceError(state, name);
  const error = getIn(errors, name);
  // https://github.com/formium/formik/issues/691#issuecomment-446509600
  // const _touched = getIn(touched, name) || submitCount > 0;
  const _touched = getIn(touched, name);

  return {
    showError: !!error && (_touched || isDisplayDebounceError),
  };
};

export const inputOnChangeWithDebounce = (dispatch: any, nativeOnChange: any, event: any, name: string) => {
  nativeOnChange(event);
  dispatch(setDebouncing(name));
};

export interface withDebounceProps
  extends ReturnType<typeof mapStateToProps>,
    FilledTextFieldProps,
    FieldProps,
    TDispatchProp {}

export const withDebounceField = (WrappedComponent: React.ComponentType<any>) => {
  const withDebounce: React.ComponentType<withDebounceProps> = class extends React.Component<withDebounceProps> {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  withDebounce.displayName = `withComponent(${getDisplayName(WrappedComponent)})`;
  return connect(mapStateToProps)(WrappedComponent);
};

function getDisplayName(WrappedComponent: React.ComponentType<any>) {
  return WrappedComponent.displayName || WrappedComponent.name || "Debounce";
}
