import React, { ChangeEvent } from "react";
import { RootState } from "reducers";
import { FilledTextFieldProps } from "@material-ui/core";
import { WrappedFieldProps, EventOrValueHandler } from "redux-form";
import { getIsDisplayDebounceError } from "selectors/debounce";
import { connect } from "react-redux";
import { setDebouncing } from "actions/debounce";
import { TDispatchProp } from "types";
import { store } from "store";

const mapStateToProps = (state: RootState, ownProps: FilledTextFieldProps & WrappedFieldProps) => {
  const {
    input: { name },
    meta: { form, touched, dirty, error },
  } = ownProps;
  const isDisplayDebounceError = getIsDisplayDebounceError(state, form, name);

  return {
    showError: !!error && (touched || (dirty && isDisplayDebounceError)),
  };
};

export const inputOnChangeWithDebounce = (
  nativeOnChange: EventOrValueHandler<ChangeEvent<any>>,
  value: any,
  formID: string,
  name: string,
) => {
  nativeOnChange(value);
  store.dispatch(setDebouncing(formID, name));
};

export interface withDebounceProps
  extends ReturnType<typeof mapStateToProps>,
    FilledTextFieldProps,
    WrappedFieldProps,
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
